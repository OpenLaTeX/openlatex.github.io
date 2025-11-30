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
            secure: true,
            sameSite: 'none'
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

router.get('/verify', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ valid: false, error: 'Session invalide' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await SQLquery('select uno, email from users where uno = $1', [decoded.userId]);

        if (result.rows.length === 0) {
            return res.status(401).json({ valid: false, error: 'Utilisateur non trouvé' });
        }

        res.json({
            valid: true,
            userId: decoded.userId,
            email: result.rows[0].email
        });
    } catch (err) {
        return res.status(401).json({ valid: false, error: 'Session invalide ou expirée' });
    }
});

module.exports = router;
