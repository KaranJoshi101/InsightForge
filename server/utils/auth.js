// Authentication utilities
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const assertJwtConfiguration = () => {
    const secret = process.env.JWT_SECRET || '';

    if (!secret) {
        throw new Error('JWT_SECRET is required');
    }

    if (process.env.NODE_ENV === 'production' && secret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters in production');
    }
};

// Generate JWT Token
const generateToken = (userId, role) => {
    assertJwtConfiguration();
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Verify JWT Token
const verifyToken = (token) => {
    try {
        assertJwtConfiguration();
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
};

// Hash password
const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

// Compare password
const comparePassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};

// Extract token from Authorization header
const extractToken = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
};

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    comparePassword,
    extractToken,
};
