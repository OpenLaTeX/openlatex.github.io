const express = require('express');
const { SQLquery } = require('../db/pool');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const isBinaryFileType = (fileType) => {
    return ['png', 'jpg', 'pdf'].includes(fileType);
};

const contentToBuffer = (content, fileType) => {
    if (isBinaryFileType(fileType)) {
        return Buffer.from(content, 'base64');
    }
    return Buffer.from(content, 'utf-8');
};

const bufferToContent = (buffer, fileType) => {
    if (isBinaryFileType(fileType)) {
        return buffer.toString('base64');
    }
    return buffer.toString('utf-8');
};

// demande tous les projets de l'utilisateur
router.get('/', async (req, res) => {
    try {
        const result = await SQLquery(
            'select pno, name, description, created_at from projects where uno = $1 order by created_at desc',
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

    if (name.length > 15) {
        return res.status(400).json({ error: 'le nom du projet ne doit pas depasser 15 caracteres' });
    }

    try {
        await SQLquery('BEGIN');
        try {
            const projectResult = await SQLquery(
                'insert into projects (uno, name, description) values ($1, $2, $3) returning pno',
                [req.userId, name, description || null]
            );

            const projectId = projectResult.rows[0].pno;

            const values = [];
            const params = [projectId];
            let paramIndex = 2;

            for (const file of files) {
                const contentBuffer = contentToBuffer(file.content, file.file_type);
                values.push(`($1, $${paramIndex}, $${paramIndex+1}, $${paramIndex+2})`);
                params.push(file.filename, contentBuffer, file.file_type);
                paramIndex += 3;
            }

            if (values.length > 0) {
                await SQLquery(
                    `insert into files (pno, filename, content, file_type) values ${values.join(', ')}`,
                    params
                );
            }

            await SQLquery('COMMIT');

            res.status(201).json({ pno: projectId, message: 'projet cree' });
        } catch (err) {
            await SQLquery('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error('erreur create project:', err);
        res.status(500).json({ error: 'erreur serveur' });
    }
});


// demande d'un projet par son identifiant
router.get('/:pno', async (req, res) => {
    const { pno } = req.params;

    try {
        const projectResult = await SQLquery('select pno, uno, name, description, created_at from projects where pno = $1',[pno]);

        if (projectResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        const project = projectResult.rows[0];

        if (project.uno !== req.userId) {
            return res.status(403).json({ error: "Accès interdit car le token de l'utilisateur de la requête ne correspond pas à celui du propriétaire du projet" });
        }

        const filesResult = await SQLquery('select fno, filename, content, file_type, created_at from files where pno = $1',[pno]);

        const files = filesResult.rows.map(file => ({
            fno: file.fno,
            filename: file.filename,
            content: bufferToContent(file.content, file.file_type),
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

    if (name.length > 15) {
        return res.status(400).json({ error: 'le nom du projet ne doit pas depasser 15 caracteres' });
    }

    try {
        const checkResult = await SQLquery(
            'select uno from projects where pno = $1',
            [pno]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        if (checkResult.rows[0].uno !== req.userId) {
            return res.status(403).json({ error: 'acces interdit' });
        }

        await SQLquery('BEGIN');
        try {
            await SQLquery(
                'update projects set name = $1, description = $2 where pno = $3',
                [name, description || null, pno]
            );

            await SQLquery('delete from files where pno = $1', [pno]);

            const values = [];
            const params = [pno];
            let paramIndex = 2;

            for (const file of files) {
                const contentBuffer = contentToBuffer(file.content, file.file_type);
                values.push(`($1, $${paramIndex}, $${paramIndex+1}, $${paramIndex+2})`);
                params.push(file.filename, contentBuffer, file.file_type);
                paramIndex += 3;
            }

            if (values.length > 0) {
                await SQLquery(
                    `insert into files (pno, filename, content, file_type) values ${values.join(', ')}`,
                    params
                );
            }

            await SQLquery('COMMIT');
        } catch (err) {
            await SQLquery('ROLLBACK');
            throw err;
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
            'select uno from projects where pno = $1',
            [pno]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'projet non trouve' });
        }

        if (checkResult.rows[0].uno !== req.userId) {
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
