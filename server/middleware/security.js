const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const isDev = process.env.NODE_ENV !== 'production';

const getAllowedOrigins = () => {
    const configured = process.env.CORS_ORIGINS || process.env.CLIENT_URL || '';

    return configured
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
};

// In development: allow all origins. In production: strict allowlist.
const corsOptions = isDev
    ? { origin: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'], credentials: true }
    : {
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            const allowedOrigins = getAllowedOrigins();
            if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error('CORS policy blocked this origin'));
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 86400,
      };

// In development: no rate limiting (pass-through middleware).
const _noLimit = (_req, _res, next) => next();

const globalRateLimit = isDev
    ? _noLimit
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: Number(process.env.RATE_LIMIT_MAX || 300),
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests. Please try again later.' },
      });

const authRateLimit = isDev
    ? _noLimit
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many authentication attempts. Please try again later.' },
      });

// In development: skip Helmet (avoids header conflicts with React dev server / HMR).
const securityHeaders = isDev
    ? (_req, _res, next) => next()
    : helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false,
      });

module.exports = {
    corsOptions,
    globalRateLimit,
    authRateLimit,
    securityHeaders,
};
