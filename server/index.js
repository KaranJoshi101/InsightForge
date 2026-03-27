// Main Express Server
const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Route imports
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const responseRoutes = require('./routes/responses');
const articleRoutes = require('./routes/articles');
const userRoutes = require('./routes/users');
const mediaRoutes = require('./routes/media');
const trainingRoutes = require('./routes/training');

// Middleware imports
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/requestLogger');
const {
  corsOptions,
  globalRateLimit,
  securityHeaders,
} = require('./middleware/security');
const pool = require('./config/database');

const app = express();

const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const assertSecurityConfig = () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (!process.env.CORS_ORIGINS && !process.env.CLIENT_URL) {
    throw new Error('Set CORS_ORIGINS (or CLIENT_URL) in production');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Set a strong JWT_SECRET (>= 32 chars) in production');
  }
};

assertSecurityConfig();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.disable('x-powered-by');
if (parseBoolean(process.env.TRUST_PROXY, false)) {
  app.set('trust proxy', 1);
}
app.use(securityHeaders);
app.use(globalRateLimit);
app.use(require('cors')(corsOptions));
const bodyLimit = process.env.NODE_ENV !== 'production' ? '50mb' : '100kb';
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(requestLogger);
app.use('/uploads', express.static(uploadsDir, {
  index: false,
  dotfiles: 'deny',
  fallthrough: false,
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/training', trainingRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Survey Application API is running',
        timestamp: new Date().toISOString(),
    });
});

app.get('/api/health/db', async (req, res) => {
  try {
    const requiredTables = [
      'users',
      'surveys',
      'questions',
      'responses',
      'answers',
      'articles',
      'signup_otp_verifications',
    ];

    const checks = await Promise.all(
      requiredTables.map(async (tableName) => {
        const result = await pool.query(
          'SELECT to_regclass($1) AS table_name',
          [`public.${tableName}`]
        );

        return {
          table: tableName,
          exists: Boolean(result.rows[0]?.table_name),
        };
      })
    );

    const missingTables = checks.filter((item) => !item.exists).map((item) => item.table);

    res.status(missingTables.length ? 503 : 200).json({
      status: missingTables.length ? 'DEGRADED' : 'OK',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      checks,
      missingTables,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Survey Application API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
          databaseHealth: '/api/health/db',
            auth: '/api/auth',
            surveys: '/api/surveys',
            responses: '/api/responses',
            articles: '/api/articles',
            media: '/api/media',
            training: '/api/training',
        },
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
    });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const ensureSignupOtpTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS signup_otp_verifications (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(100) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_signup_otp_email
      ON signup_otp_verifications (email)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_signup_otp_expires_at
      ON signup_otp_verifications (expires_at)
  `);
};

const PORT = Number(process.env.SERVER_PORT || 5000);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error('SERVER_PORT must be a valid port number between 1 and 65535');
}

let server;

const startServer = async () => {
  await ensureSignupOtpTable();

  server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║     🚀 Survey Application API Server Started      ║
╚═══════════════════════════════════════════════════╝

📍 Server running on: http://localhost:${PORT}
🗄️  Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}
📊 Environment: ${process.env.NODE_ENV}

Available Endpoints:
  GET  /                  - API info
  GET  /api/health        - Health check

Auth:
  POST /api/auth/register - Register new user
  POST /api/auth/login    - Login user
  GET  /api/auth/me       - Get current user (protected)

Surveys:
  GET  /api/surveys       - Get all surveys
  GET  /api/surveys/:id   - Get survey details
  POST /api/surveys       - Create survey (admin)
  PUT  /api/surveys/:id   - Update survey (admin)
  DELETE /api/surveys/:id - Delete survey (admin)

Responses:
  GET  /api/responses/:surveyId  - Get survey responses
  POST /api/responses            - Submit response
  GET  /api/responses/:id        - Get response details

Articles:
  GET  /api/articles     - Get published articles
  GET  /api/articles/:id - Get article details
  POST /api/articles     - Create article (admin)
  PUT  /api/articles/:id  - Update article (admin)
  DELETE /api/articles/:id - Delete article (admin)

    `);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Set SERVER_PORT to a free port or stop the process using it.`);
      process.exit(1);
    }

    console.error('❌ Server failed to start:', err.message);
    process.exit(1);
  });
};

startServer().catch((err) => {
  console.error('❌ Server bootstrap failed:', err.message);
  process.exit(1);
});

const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Closing HTTP server...`);
  server.close(() => {
    console.log('HTTP server closed. Exiting process.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

module.exports = app;
