const express = require('express');
const promClient = require('prom-client');
const CompileJobProcessor = require('../lib/CompileJobProcessor');

const router = express.Router();

const MAX_CONCURRENT = 10;
const MAX_QUEUE = 30;
const QUEUE_TIMEOUT_MS = 60000;

let activeCompilations = 0;
const queue = [];

function acquireSlot() {
    if (activeCompilations < MAX_CONCURRENT) {
        activeCompilations++;
        compileActive.set(activeCompilations);
        return Promise.resolve();
    }
    if (queue.length >= MAX_QUEUE) {
        compileQueueFull.inc();
        return Promise.reject(Object.assign(new Error('Server busy, retry later'), { status: 503 }));
    }
    return new Promise((resolve, reject) => {
        const entry = { resolve, reject, timer: null };
        entry.timer = setTimeout(() => {
            queue.splice(queue.indexOf(entry), 1);
            compileQueueDepth.set(queue.length);
            compileQueueTimeout.inc();
            reject(Object.assign(new Error('Queue timeout'), { status: 503 }));
        }, QUEUE_TIMEOUT_MS);
        queue.push(entry);
        compileQueueDepth.set(queue.length);
    });
}

function releaseSlot() {
    activeCompilations--;
    if (queue.length > 0) {
        const { resolve, timer } = queue.shift();
        clearTimeout(timer);
        activeCompilations++;
        resolve();
    }
    compileActive.set(activeCompilations);
    compileQueueDepth.set(queue.length);
}

function getMetric(name, createMetric) {
    return promClient.register.getSingleMetric(name) || createMetric();
}

const compileDuration = getMetric('latex_compile_duration_seconds', () => new promClient.Histogram({
    name: 'latex_compile_duration_seconds',
    help: 'Durée des compilations LaTeX',
    buckets: [1, 5, 10, 20, 30]
}));

const compileResult = getMetric('latex_compile_total', () => new promClient.Counter({
    name: 'latex_compile_total',
    help: 'Nombre total de compilations',
    labelNames: ['result']
}));

const compileActive = getMetric('latex_compile_active', () => new promClient.Gauge({
    name: 'latex_compile_active',
    help: 'Compilations en cours'
}));

const compileQueueDepth = getMetric('latex_compile_queue_depth', () => new promClient.Gauge({
    name: 'latex_compile_queue_depth',
    help: 'Nombre de compilations en attente dans la queue'
}));

const compileQueueTimeout = getMetric('latex_compile_queue_timeout_total', () => new promClient.Counter({
    name: 'latex_compile_queue_timeout_total',
    help: 'Nombre de timeouts de queue'
}));

const compileQueueFull = getMetric('latex_compile_queue_full_total', () => new promClient.Counter({
    name: 'latex_compile_queue_full_total',
    help: 'Nombre de rejets queue pleine (Server busy)'
}));

// compilation qui recoit les fichiers en HTTP, pas de persistance SQL (Le SQL sert à sauvegarder et ce serait moins performant de compiler avec le SQL)
router.post('/', async (req, res) => {
    const { files, mainFile } = req.body;
    console.log('compilation stateless (pas de sauvegarde SQL)');
    console.log('fichiers:', files?.length);

    if (!files || !mainFile) {
        return res.status(400).json({ error: 'Files and mainFile required' });
    }

    try {
        await acquireSlot();
    } catch (err) {
        return res.status(err.status || 503).json({ error: err.message });
    }

    try {
        const endTimer = compileDuration.startTimer();
        const result = await CompileJobProcessor.process({ files, mainFile });
        endTimer();

        if (result.success) {
            compileResult.inc({ result: 'success' });
            res.json({
                pdf: result.pdf.toString('base64'),
                logs: result.logs || '',
                hasErrors: result.hasErrors || false
            });
        } else {
            compileResult.inc({ result: 'user_failure' });
            res.status(500).json({
                error: result.error,
                logs: result.logs
            });
        }
    } catch (error) {
        compileResult.inc({ result: 'server_error' });
        console.error('erreur compilation:', error);
        res.status(500).json({ error: error.message });
    } finally {
        releaseSlot();
    }
});

module.exports = router;
