const rateLimit = require('express-rate-limit');

const guestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 5,
    message: { error: '3 compilations max par minute pour les invités, reessayez plus tard ou créez un compte !' },
    standardHeaders: true,
    legacyHeaders: false,
});

const userLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    message: { error: '10 compilations max par minute pour les utilisateurs loggés, reessayez plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { guestLimiter, userLimiter };
