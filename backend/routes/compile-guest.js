const express = require('express');
const FileManager = require('../services/FileManager');
const Compiler = require('../services/Compiler');

const router = express.Router();

router.post('/', async (req, res) => {
    const { files, mainFile } = req.body;
    console.log('compilation invitee (Pas de sauvegarde SQL)');
    console.log('fichiers:', files?.length);

    if (!files || !mainFile) {
        return res.status(400).json({ error: 'files et mainFile requis' });
    }

    const projectId = Date.now().toString();
    let workDir;

    try {
        workDir = await FileManager.createProjectDir(projectId);
        await FileManager.writeFiles(workDir, files);

        const result = await Compiler.compile(workDir, mainFile);

        if (result.success) {
            res.setHeader('Content-Type', 'application/pdf');
            res.send(result.pdf);
        } else {
            res.status(500).json({
                error: result.error,
                logs: result.logs
            });
        }

        await FileManager.cleanup(workDir);
    } catch (error) {
        console.error('erreur compilation:', error);
        if (workDir) {
            await FileManager.cleanup(workDir);
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
