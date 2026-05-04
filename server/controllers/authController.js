// User/Auth Controller
const crypto = require('crypto');
const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { sendSignupOtpEmail } = require('../utils/mailer');
const authModel = require('../models/authModel');

const OTP_EXPIRY_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;

const generateOtpCode = () => String(crypto.randomInt(100000, 1000000));

const purgeExpiredSignupOtps = authModel.purgeExpiredSignupOtps;

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
        const existingUser = await authModel.findUserByEmail(safeEmail);
        if (existingUser) {
            return res.status(409).json({
                error: 'Email already registered',
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user
        const user = await authModel.insertUser(safeName, safeEmail, passwordHash, 'user');
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

        const existingUser = await authModel.findUserByEmail(safeEmail);
        if (existingUser) {
            return res.status(409).json({
                error: 'Email already registered',
            });
        }

        const passwordHash = await hashPassword(password);
        const otpCode = generateOtpCode();
        const otpHash = await hashPassword(otpCode);

        await authModel.insertOrUpdateSignupOtp(safeEmail, safeName, passwordHash, otpHash, OTP_EXPIRY_MINUTES);

        // Send email asynchronously (fire-and-forget) so user gets immediate response
        const emailResult = await sendSignupOtpEmail({
            to: safeEmail,
            userName: safeName,
            otpCode,
            expiresMinutes: OTP_EXPIRY_MINUTES,
        });

        if (!emailResult.sent) {
            return res.status(503).json({
                error: 'Unable to deliver OTP email right now. Please try again in a moment.',
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

        const pending = await authModel.getPendingOtpByEmail(safeEmail);
        if (!pending) {
            return res.status(400).json({
                error: 'No pending verification found. Please request a new OTP.',
            });
        }
        if (pending.attempts >= OTP_MAX_ATTEMPTS) {
            await authModel.deleteSignupOtp(safeEmail);
            return res.status(400).json({
                error: 'Too many invalid attempts. Please request a new OTP.',
            });
        }

        const otpMatches = await comparePassword(safeOtp, pending.otp_hash);
        if (!otpMatches) {
            await authModel.incrementOtpAttempts(safeEmail);
            return res.status(400).json({
                error: 'Invalid OTP',
            });
        }
        const existingUser = await authModel.findUserByEmail(safeEmail);
        if (existingUser) {
            await authModel.deleteSignupOtp(safeEmail);
            return res.status(409).json({
                error: 'Email already registered',
            });
        }
        const user = await authModel.createUserFromPending(pending.name, safeEmail, pending.password_hash);
        await authModel.deleteSignupOtp(safeEmail);

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
        const user = await authModel.findUserByEmailForAuth(safeEmail);
        if (!user) {
            return res.status(401).json({
                error: 'Invalid email or password',
            });
        }


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
        const user = await authModel.getUserById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json({ user });
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
