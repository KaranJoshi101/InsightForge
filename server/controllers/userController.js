// User Controller (Admin user management and dashboard stats)
const pool = require('../config/database');

// Get all users (admin) with optional search
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const offset = (page - 1) * limit;

        let query;
        let countQuery;
        let params;
        let countParams;

        if (search.trim()) {
            const searchPattern = `%${search.trim()}%`;
            query = `
                SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
                FROM users
                WHERE name ILIKE $1 OR email ILIKE $1
                ORDER BY created_at DESC
                LIMIT $2 OFFSET $3
            `;
            countQuery = `
                SELECT COUNT(*) FROM users
                WHERE name ILIKE $1 OR email ILIKE $1
            `;
            params = [searchPattern, limit, offset];
            countParams = [searchPattern];
        } else {
            query = `
                SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
                FROM users
                ORDER BY created_at DESC
                LIMIT $1 OFFSET $2
            `;
            countQuery = 'SELECT COUNT(*) FROM users';
            params = [limit, offset];
            countParams = [];
        }

        const usersResult = await pool.query(query, params);
        const countResult = await pool.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            users: usersResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get a single user by id (admin only)
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
             FROM users
             WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// Ban user (admin only)
const banUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({
                error: 'You cannot ban yourself',
            });
        }

        const result = await pool.query(
            'UPDATE users SET is_banned = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, is_banned',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        res.json({
            message: 'User banned successfully',
            user: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// Unban user (admin only)
const unbanUser = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE users SET is_banned = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, name, email, role, is_banned',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        res.json({
            message: 'User unbanned successfully',
            user: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res, next) => {
    try {
        // Responses per survey (for bar chart)
        const responsesPerSurvey = await pool.query(`
            SELECT s.id, s.title, COUNT(r.id)::int AS response_count
            FROM surveys s
            LEFT JOIN responses r ON s.id = r.survey_id
            GROUP BY s.id, s.title
            ORDER BY response_count DESC
            LIMIT 10
        `);

        // Survey status distribution (for doughnut chart)
        const surveyStatusDist = await pool.query(`
            SELECT status::text, COUNT(*)::int AS count
            FROM surveys
            GROUP BY status
        `);

        // Article publish status distribution (for doughnut chart)
        const articleStatusDist = await pool.query(`
            SELECT
                CASE WHEN is_published THEN 'published' ELSE 'draft' END AS status,
                COUNT(*)::int AS count
            FROM articles
            GROUP BY is_published
        `);

        // Summary counts
        const totalUsers = await pool.query('SELECT COUNT(*)::int AS count FROM users');
        const totalSurveys = await pool.query('SELECT COUNT(*)::int AS count FROM surveys');
        const totalResponses = await pool.query('SELECT COUNT(*)::int AS count FROM responses');
        const bannedUsers = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_banned = true");

        res.json({
            responses_per_survey: responsesPerSurvey.rows,
            survey_status_distribution: surveyStatusDist.rows,
            article_status_distribution: articleStatusDist.rows,
            summary: {
                total_users: totalUsers.rows[0].count,
                total_surveys: totalSurveys.rows[0].count,
                total_responses: totalResponses.rows[0].count,
                banned_users: bannedUsers.rows[0].count,
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get current user's profile
const getProfile = async (req, res, next) => {
    try {
        const result = await pool.query(
            'SELECT id, name, email, role, location, age, gender, phone, bio, created_at FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// Update current user's profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, location, age, gender, phone, bio } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (age !== null && age !== undefined && age !== '') {
            const ageNum = parseInt(age);
            if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
                return res.status(400).json({ error: 'Age must be between 1 and 150' });
            }
        }

        const result = await pool.query(
            `UPDATE users SET
                name = $1,
                location = $2,
                age = $3,
                gender = $4,
                phone = $5,
                bio = $6,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $7
            RETURNING id, name, email, role, location, age, gender, phone, bio, created_at`,
            [
                name.trim(),
                location || null,
                age ? parseInt(age) : null,
                gender || null,
                phone || null,
                bio || null,
                req.user.userId,
            ]
        );

        res.json({
            message: 'Profile updated successfully',
            user: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    getDashboardStats,
    getProfile,
    updateProfile,
};
