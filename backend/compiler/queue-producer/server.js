const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const promClient = require('prom-client');
const { Queue, QueueEvents } = require('bullmq');
require('dotenv').config();

const { defaultProtectionLimiter, guestLimiter } = require('./middleware/rateLimiter');

const PORT = process.env.PORT || 9000;
const QUEUE_NAME = process.env.QUEUE_NAME || 'latex-compile';
const COMPILE_TIMEOUT_MS = Number(process.env.COMPILE_TIMEOUT_MS || 60000);

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null
};

const compileQueue = new Queue(QUEUE_NAME, { connection });
const queueEvents = new QueueEvents(QUEUE_NAME, { connection });

promClient.collectDefaultMetrics();

function getMetric(name, createMetric) {
    return promClient.register.getSingleMetric(name) || createMetric();
}

const httpDuration = getMetric('http_request_duration_seconds', () => new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duree des requetes HTTP en secondes',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
}));

const compileDuration = getMetric('latex_compile_duration_seconds', () => new promClient.Histogram({
    name: 'latex_compile_duration_seconds',
    help: 'Duréé des compilations LaTeX',
    buckets: [1, 5, 10, 20, 30]
}));

const compileResult = getMetric('latex_compile_total', () => new promClient.Counter({
    name: 'latex_compile_total',
    help: 'Nombre total de compilations',
    labelNames: ['result']
}));

const compileQueueDepth = getMetric('latex_compile_queue_depth', () => new promClient.Gauge({
    name: 'latex_compile_queue_depth',
    help: 'Nombre de compilations en attente dans Redis'
}));

async function updateQueueDepth() {
    const waiting = await compileQueue.getWaitingCount();
    const delayed = await compileQueue.getDelayedCount();
    compileQueueDepth.set(waiting + delayed);
}

async function pingRedis() {
    const client = await compileQueue.client;
    await client.ping();
}

const app = express();

app.use(cors({
    origin: [
        'https://openlatex.github.io',
        'https://openlatex.blavogiez.fr'
    ],
    credentials: true
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

app.get('/metrics', async (req, res) => {
    await updateQueueDepth().catch(() => {});
    res.set('Content-Type', promClient.register.contentType);
    res.end(await promClient.register.metrics());
});

app.use((req, res, next) => {
    const end = httpDuration.startTimer();
    res.on('finish', () => {
        end({ method: req.method, route: req.route?.path || req.path, status_code: res.statusCode });
    });
    next();
});

app.use(defaultProtectionLimiter);

app.get('/health', async (req, res) => {
    try {
        await pingRedis();
        res.json({ status: 'healthy' });
    } catch (error) {
        res.status(500).json({ status: 'unhealthy', error: error.message });
    }
});

app.post('/compile', guestLimiter, async (req, res) => {
    const { files, mainFile } = req.body;

    if (!files || !mainFile) {
        return res.status(400).json({ error: 'Files and mainFile required' });
    }

    const endTimer = compileDuration.startTimer();

    try {
        const job = await compileQueue.add('compile', { files, mainFile }, {
            attempts: 1,
            removeOnComplete: true,
            removeOnFail: { age: 3600 }
        });

        await updateQueueDepth();

        const result = await job.waitUntilFinished(queueEvents, COMPILE_TIMEOUT_MS);
        endTimer();

        if (result.success) {
            compileResult.inc({ result: 'success' });
            return res.json({
                pdf: result.pdf,
                logs: result.logs || '',
                hasErrors: result.hasErrors || false
            });
        }

        compileResult.inc({ result: 'user_failure' });
        return res.status(500).json({
            error: result.error,
            logs: result.logs
        });
    } catch (error) {
        endTimer();
        compileResult.inc({ result: 'server_error' });
        console.error('erreur queue compilation:', error);
        return res.status(503).json({ error: error.message });
    } finally {
        await updateQueueDepth().catch(() => {});
    }
});

async function shutdown() {
    console.log('arret queue-producer...');
    await queueEvents.close();
    await compileQueue.close();
    process.exit(0);
}

if (require.main === module) {
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    app.listen(PORT, () => {
        console.log(`queue-producer demarre sur le port ${PORT}, queue=${QUEUE_NAME}`);
    });
}

module.exports = { app };
