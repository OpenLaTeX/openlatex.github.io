const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { SQLquery } = require('../db/pool');
require('dotenv').config();

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email et password requis' });
    }

    try {
        const existing = await SQLquery('select uno from users where email = $1', [email]);

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email deja utilise (contrainte sql unique)' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await SQLquery(
            'insert into users (email, password) values ($1, $2)',
            [email, hashedPassword]
        );

        res.status(201).json({ message: 'utilisateur cree' });
    } catch (err) {
        console.error('erreur register:', err);
        res.status(500).json({ error: 'erreur serveur suite à register' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'email et password requis' });
    }

    try {
        const result = await SQLquery('select uno, password from users where email = $1', [email]);

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const user = result.rows[0];
        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return res.status(401).json({ error: 'Identifiants invalides.' });
        }

        const token = jwt.sign(
            { userId: user.uno },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
        });

        res.json({ token });
    } catch (err) {
        console.error('erreur login:', err);
        res.status(500).json({ error: 'erreur serveur suite à login' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'deconnecte' });
});

module.exports = router;
