// Authentication Middleware
const { verifyToken, extractToken } = require('../utils/auth');

const authenticate = (req, res, next) => {
    try {
        const token = extractToken(req.headers.authorization);

        if (!token) {
            return res.status(401).json({
                error: 'No token provided',
                message: 'Please provide a valid JWT token',
            });
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token',
        });
    }
};

// Authorization Middleware (check if user is admin)
const authorize = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Only admins can perform this action',
        });
    }
    next();
};

module.exports = {
    authenticate,
    authorize,
};
