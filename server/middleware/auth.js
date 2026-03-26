// Authentication Middleware
const pool = require('../config/database');
const { verifyToken, extractToken } = require('../utils/auth');

const normalizeRole = (role) => String(role || '').trim().toLowerCase();

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
const authorize = async (req, res, next) => {
    const tokenRole = normalizeRole(req.user?.role);
    if (tokenRole === 'admin') {
        return next();
    }

    // Fallback to DB role so stale tokens do not block valid admins.
    if (req.user?.userId) {
        try {
            const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
            const dbRole = normalizeRole(result.rows[0]?.role);

            if (dbRole === 'admin') {
                req.user.role = dbRole;
                return next();
            }
        } catch (_err) {
            return res.status(500).json({
                error: 'Authorization check failed',
            });
        }
    }

    return res.status(403).json({
        error: 'Forbidden',
        message: 'Only admins can perform this action',
    });
};

module.exports = {
    authenticate,
    authorize,
};
