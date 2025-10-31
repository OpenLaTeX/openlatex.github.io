const rateLimit = require('express-rate-limit');

const guestLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { error: '5 requetes max par 15 min, reessayez plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
});

const userLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: { error: '50 requetes max par 15 min, reessayez plus tard' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = { guestLimiter, userLimiter };
