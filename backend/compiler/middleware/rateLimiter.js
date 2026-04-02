const rateLimit = require('express-rate-limit');
require('dotenv').config();

// contournement par secret administrateur (pour les load tests)
const bypassRateLimit = (req) =>
    process.env.TEST_BYPASS_SECRET &&
    req.headers['x-test-key'] === process.env.TEST_BYPASS_SECRET;

const guestLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10,
    message: { error: '10 compilations max per minute for guests, try again later or create an account.' },
    standardHeaders: true,
    legacyHeaders: false,
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

module.exports = { defaultProtectionLimiter, guestLimiter, authLimiter };
