const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// contournement par secret administrateur (pour les load tests)
const bypassRateLimit = (req) =>
    process.env.TEST_BYPASS_SECRET &&
    req.headers['x-test-key'] === process.env.TEST_BYPASS_SECRET;

const tokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.cookies.token;
    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.userId = decoded.userId;
        } catch (_) {}
    }
    next();
};

//limite basee sur l'ip
const guestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: '10 compilations max per minute for guests, try again later or create an account.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: bypassRateLimit,
});

//limite basee sur le token JWT (identifiant de l'utilisateur) pour éviter qu'un invité du même réseau ne le bloque
const userLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: '30 compilations max per minute for logged-in users, try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `user-${req.userId}`,
    skip: bypassRateLimit,
});

const defaultProtectionLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 30,
    message: { error: 'Too many requests, try again in one minute.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: bypassRateLimit,
});

const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 15,
    message: { error: 'Too many attempts, try again in 5 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { defaultProtectionLimiter, guestLimiter, userLimiter, authLimiter, tokenMiddleware };
