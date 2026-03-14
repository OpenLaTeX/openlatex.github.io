const express = require('express');
const promClient = require('prom-client');
const FileManager = require('../lib/FileManager');
const Compiler = require('../lib/Compiler');

const router = express.Router();

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

// compilation qui recoit les fichiers en HTTP, pas de persistance SQL (Le SQL sert à sauvegarder et ce serait moins performant de compiler avec le SQL)
router.post('/', async (req, res) => {
    const { files, mainFile } = req.body;
    console.log('compilation stateless (pas de sauvegarde SQL)');
    console.log('fichiers:', files?.length);

    if (!files || !mainFile) {
        return res.status(400).json({ error: 'Files and mainFile required' });
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
    }
});

module.exports = router;
