const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//limite basee sur l'ip
const guestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 3,
    message: { error: '3 compilations max par minute pour les invités, réessayez plus tard ou créez un compte.' },
    standardHeaders: true,
    legacyHeaders: false,
});

//limite basee sur le token JWT (identifiant de l'utilisateur) pour éviter qu'un invité du même réseau ne le bloque
const userLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: '10 compilations max par minute pour les utilisateurs connectés, réessayez plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
    keyGenerator: (req) => {
        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                console.log('rate limit par userId:', decoded.userId);
                return `user-${decoded.userId}`;
            } catch (err) {
                console.log('token invalide, rate limit par IP:', err.message);
                return req.ip;
            }
        }
        console.log('pas de token, rate limit par IP:', req.ip);
        return req.ip;
    }
});

const defaultProtectionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: 'Trop de requêtes, réessayez dans une minute.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { error: 'Trop de tentatives, réessayez dans 5 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { defaultProtectionLimiter, guestLimiter, userLimiter, authLimiter };
