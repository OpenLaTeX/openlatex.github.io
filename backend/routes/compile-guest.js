const express = require('express');
const FileManager = require('../compiler/FileManager');
const Compiler = require('../compiler/Compiler');

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
            res.json({
                pdf: result.pdf.toString('base64'),
                logs: result.logs || '',
                hasErrors: result.hasErrors || false
            });
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
