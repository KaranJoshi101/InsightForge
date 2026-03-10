// User/Auth Controller
const pool = require('../config/database');
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');

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
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
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
    login,
    getCurrentUser,
};
