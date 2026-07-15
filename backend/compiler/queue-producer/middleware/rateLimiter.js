const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

module.exports = { defaultProtectionLimiter, guestLimiter };
