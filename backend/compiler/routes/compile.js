const express = require('express');
const promClient = require('prom-client');
const FileManager = require('../lib/FileManager');
const Compiler = require('../lib/Compiler');

const router = express.Router();

const MAX_CONCURRENT = 4;
const MAX_QUEUE = 15;
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

const compileDuration = new promClient.Histogram({
  name: 'latex_compile_duration_seconds',
  help: 'Durée des compilations LaTeX',
  buckets: [1, 5, 10, 20, 30]
});

const compileResult = new promClient.Counter({
  name: 'latex_compile_total',
  help: 'Nombre total de compilations',
  labelNames: ['result']
});

const compileActive = new promClient.Gauge({
  name: 'latex_compile_active',
  help: 'Compilations en cours'
});

const compileQueueDepth = new promClient.Gauge({
  name: 'latex_compile_queue_depth',
  help: 'Nombre de compilations en attente dans la queue'
});

const compileQueueTimeout = new promClient.Counter({
  name: 'latex_compile_queue_timeout_total',
  help: 'Nombre de timeouts de queue'
});

const compileQueueFull = new promClient.Counter({
  name: 'latex_compile_queue_full_total',
  help: 'Nombre de rejets queue pleine (Server busy)'
});

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

    const projectId = Date.now().toString();
    let workDir;

    try {
        workDir = await FileManager.createProjectDir(projectId);
        await FileManager.writeFiles(workDir, files);

        const endTimer = compileDuration.startTimer();
        const result = await Compiler.compile(workDir, mainFile);
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

        await FileManager.cleanup(workDir);
    } catch (error) {
        compileResult.inc({ result: 'server_error' });
        console.error('erreur compilation:', error);
        if (workDir) {
            await FileManager.cleanup(workDir);
        }
        res.status(500).json({ error: error.message });
    } finally {
        releaseSlot();
    }
});

module.exports = router;
