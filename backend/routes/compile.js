const express = require('express');
const { SQLquery } = require('../db/pool');
const authMiddleware = require('../middleware/auth');
const FileManager = require('../services/FileManager');
const Compiler = require('../services/Compiler');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
    const { pno, mainFile } = req.body;

    if (!pno || !mainFile) {
        return res.status(400).json({ error: 'pno et mainFile requis' });
    }

    try {
        const projectResult = await SQLquery(
            'select user_id from projects where pno = $1',
            [pno]
        );

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        if (projectResult.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'acces interdit' });
        }

        const filesResult = await SQLquery(
            'select filename, content, file_type from file where project_id = $1',
            [pno]
        );

        if (filesResult.rows.length === 0) {
            return res.status(400).json({ error: 'aucun fichier dans le projet' });
        }

        const files = filesResult.rows.map(file => ({
            path: file.filename,
            content: file.content.toString('utf-8')
        }));

        console.log('compilation projet', pno);
        console.log('fichiers:', files.length);

        const workDir = await FileManager.createProjectDir(pno);
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
    } catch (err) {
        console.error('erreur compilation:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});

module.exports = router;
