const express = require('express');
const { SQLquery } = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// demande tous les projets de l'utilisateur
router.get('/', async (req, res) => {
    try {
        const result = await SQLquery(
            'select pno, name, description, created_at from projects where user_id = $1 order by created_at desc',
            [req.userId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('erreur get projects:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});

// cree un projet
router.post('/', async (req, res) => {
    const { name, description, files } = req.body;

    if (!name || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'name et files requis !' });
    }

    try {
        const projectResult = await SQLquery(
            'insert into projects (user_id, name, description) values ($1, $2, $3) returning pno',
            [req.userId, name, description || null]
        );

        const projectId = projectResult.rows[0].pno;

        for (const file of files) {
            const contentBuffer = Buffer.from(file.content, 'utf-8');
            await SQLquery(
                'insert into file (project_id, filename, content, file_type) values ($1, $2, $3, $4)',
                [projectId, file.filename, contentBuffer, file.file_type]
            );
        }

        res.status(201).json({ pno: projectId, message: 'projet cree' });
    } catch (err) {
        console.error('erreur create project:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});


// demande d'un projet par son identifiant
router.get('/:pno', async (req, res) => {
    const { pno } = req.params;

    try {
        const projectResult = await SQLquery('select pno, user_id, name, description, created_at from projects where pno = $1',[pno]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        const project = projectResult.rows[0];

        if (project.user_id !== req.userId) {
            return res.status(403).json({ error: 'acces interdit (pas cense se produire)' });
        }

        const filesResult = await SQLquery('select fno, filename, content, file_type, created_at from file where project_id = $1',[pno]);

        const files = filesResult.rows.map(file => ({
            fno: file.fno,
            filename: file.filename,
            content: file.content.toString('utf-8'),
            file_type: file.file_type,
            created_at: file.created_at
        }));

        res.json({
            pno: project.pno,
            name: project.name,
            description: project.description,
            created_at: project.created_at,
            files
        });
    } catch (err) {
        console.error('erreur get project:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});

// mise à jour d'un projet par son identifiant
router.put('/:pno', async (req, res) => {
    const { pno } = req.params;
    const { name, description, files } = req.body;

    if (!name || !files || !Array.isArray(files)) {
        return res.status(400).json({ error: 'name et files requis' });
    }

    try {
        const checkResult = await SQLquery(
            'select user_id from projects where pno = $1',
            [pno]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        if (checkResult.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'acces interdit' });
        }

        await SQLquery(
            'update projects set name = $1, description = $2 where pno = $3',
            [name, description || null, pno]
        );

        await SQLquery('delete from file where project_id = $1', [pno]);

        // insere tous les fichiers
        for (const file of files) {
            // convertit en Byte (utile pour les images)
            const contentBuffer = Buffer.from(file.content, 'utf-8');
            await SQLquery(
                'insert into file (project_id, filename, content, file_type) values ($1, $2, $3, $4)',
                [pno, file.filename, contentBuffer, file.file_type]
            );
        }

        res.json({ message: 'projet mis a jour' });
    } catch (err) {
        console.error('erreur update project:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});

// delete par identifiant (assez simple)
router.delete('/:pno', async (req, res) => {
    const { pno } = req.params;

    try {
        const checkResult = await SQLquery(
            'select user_id from projects where pno = $1',
            [pno]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        if (checkResult.rows[0].user_id !== req.userId) {
            return res.status(403).json({ error: 'acces interdit' });
        }

        await SQLquery('delete from projects where pno = $1', [pno]);

        res.json({ message: 'projet supprime' });
    } catch (err) {
        console.error('erreur delete project:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});

module.exports = router;
