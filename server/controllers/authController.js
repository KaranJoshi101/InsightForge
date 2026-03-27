// User/Auth Controller
const crypto = require('crypto');
const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { sendSignupOtpEmail } = require('../utils/mailer');

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const purgeExpiredSignupOtps = async () => {
    await pool.query('DELETE FROM signup_otp_verifications WHERE expires_at < CURRENT_TIMESTAMP');
};

// Register new user
const register = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const safeName = typeof name === 'string' ? name.trim() : '';
        const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        // Validation
        if (!safeName || !safeEmail || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password'],
            });
        }

        // Check if user already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [safeEmail]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email already registered',
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user
        const result = await pool.query(
            'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
            [safeName, safeEmail, passwordHash, 'user']
        );

        const user = result.rows[0];
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        next(err);
    }
};

const requestRegisterOtp = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const safeName = typeof name === 'string' ? name.trim() : '';
        const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        if (!safeName || !safeEmail || !password) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['name', 'email', 'password'],
            });
        }

        await purgeExpiredSignupOtps();

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [safeEmail]);
        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                error: 'Email already registered',
            });
        }

        const passwordHash = await hashPassword(password);
        const otpCode = generateOtpCode();
        const otpHash = await hashPassword(otpCode);

        await pool.query(
            `INSERT INTO signup_otp_verifications (email, name, password_hash, otp_hash, expires_at, attempts, updated_at)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP + ($5::text || ' minutes')::interval, 0, CURRENT_TIMESTAMP)
             ON CONFLICT (email)
             DO UPDATE SET
                name = EXCLUDED.name,
                password_hash = EXCLUDED.password_hash,
                otp_hash = EXCLUDED.otp_hash,
                expires_at = EXCLUDED.expires_at,
                attempts = 0,
                updated_at = CURRENT_TIMESTAMP`,
            [safeEmail, safeName, passwordHash, otpHash, OTP_EXPIRY_MINUTES]
        );

        const emailResult = await sendSignupOtpEmail({
            to: safeEmail,
            userName: safeName,
            otpCode,
            expiresMinutes: OTP_EXPIRY_MINUTES,
        });

        if (!emailResult.sent) {
            return res.status(503).json({
                error: 'Unable to send verification email. Please try again later.',
            });
        }

        res.json({
            message: 'OTP sent to your email',
            email: safeEmail,
            expires_in_minutes: OTP_EXPIRY_MINUTES,
        });
    } catch (err) {
        next(err);
    }
};

const verifyRegisterOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const safeOtp = typeof otp === 'string' ? otp.trim() : '';

        if (!safeEmail || !safeOtp) {
            return res.status(400).json({
                error: 'Email and OTP are required',
            });
        }

        await purgeExpiredSignupOtps();

        const pendingResult = await pool.query(
            `SELECT email, name, password_hash, otp_hash, expires_at, attempts
             FROM signup_otp_verifications
             WHERE email = $1`,
            [safeEmail]
        );

        if (pendingResult.rows.length === 0) {
            return res.status(400).json({
                error: 'No pending verification found. Please request a new OTP.',
            });
        }

        const pending = pendingResult.rows[0];
        if (pending.attempts >= OTP_MAX_ATTEMPTS) {
            await pool.query('DELETE FROM signup_otp_verifications WHERE email = $1', [safeEmail]);
            return res.status(400).json({
                error: 'Too many invalid attempts. Please request a new OTP.',
            });
        }

        const otpMatches = await comparePassword(safeOtp, pending.otp_hash);
        if (!otpMatches) {
            await pool.query(
                'UPDATE signup_otp_verifications SET attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP WHERE email = $1',
                [safeEmail]
            );
            return res.status(400).json({
                error: 'Invalid OTP',
            });
        }

        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [safeEmail]);
        if (existingUser.rows.length > 0) {
            await pool.query('DELETE FROM signup_otp_verifications WHERE email = $1', [safeEmail]);
            return res.status(409).json({
                error: 'Email already registered',
            });
        }

        const createdUserResult = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, 'user')
             RETURNING id, name, email, role`,
            [pending.name, safeEmail, pending.password_hash]
        );

        await pool.query('DELETE FROM signup_otp_verifications WHERE email = $1', [safeEmail]);

        const user = createdUserResult.rows[0];
        const token = generateToken(user.id, user.role);

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        next(err);
    }
};

// Login user
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const safeEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

        // Validation
        if (!safeEmail || !password) {
            return res.status(400).json({
                error: 'Missing email or password',
            });
        }

        // Find user
        const result = await pool.query(
            'SELECT id, name, email, password_hash, role, is_banned FROM users WHERE email = $1',
            [safeEmail]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Invalid email or password',
            });
        }

        const user = result.rows[0];

        // Check if user is banned
        if (user.is_banned) {
            return res.status(403).json({
                error: 'Your account has been banned. Please contact an administrator.',
            });
        }

        // Compare passwords
        const passwordMatch = await comparePassword(password, user.password_hash);

        if (!passwordMatch) {
            return res.status(401).json({
                error: 'Invalid email or password',
            });
        }

        // Generate token
        const token = generateToken(user.id, user.role);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
            token,
        });
    } catch (err) {
        next(err);
    }
};

// Get current user
const getCurrentUser = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, is_banned, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        res.json({
            user: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    register,
    requestRegisterOtp,
    verifyRegisterOtp,
    login,
    getCurrentUser,
};
