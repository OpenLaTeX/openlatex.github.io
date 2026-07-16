const { Worker } = require('bullmq');
require('dotenv').config();

const CompileJobProcessor = require('./lib/CompileJobProcessor');

const QUEUE_NAME = process.env.QUEUE_NAME || 'latex-compile';

const DEFAULT_CONCURRENCY = 4 ; 
const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY || DEFAULT_CONCURRENCY);

const connection = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    maxRetriesPerRequest: null
};

function serializeResult(result) {
    if (!result.success) {
        return result;
    }

    return {
        ...result,
        pdf: Buffer.isBuffer(result.pdf) ? result.pdf.toString('base64') : result.pdf
    };
}

const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
        console.log('compilation job recu:', job.id);
        const result = await CompileJobProcessor.process(job.data);
        return serializeResult(result);
    },
    {
        connection,
        concurrency: WORKER_CONCURRENCY
    }
);

worker.on('completed', (job) => {
    console.log('compilation job termine:', job.id);
});

worker.on('failed', (job, error) => {
    console.error('compilation job echoue:', job?.id, error.message);
});

async function shutdown() {
    console.log('arret worker compilation...');
    await worker.close();
    process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log(`compile-worker demarre sur la queue ${QUEUE_NAME} avec concurrency=${WORKER_CONCURRENCY}`);
