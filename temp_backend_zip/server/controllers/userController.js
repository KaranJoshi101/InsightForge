// User Controller (Admin user management and dashboard stats)
const pool = require('../config/database');
const { comparePassword, hashPassword } = require('../utils/auth');

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

// Delete user permanently (admin only, banned users only)
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id, 10);

        if (userId === req.user.userId) {
            return res.status(400).json({
                error: 'You cannot delete your own account',
            });
        }

        const existing = await pool.query(
            'SELECT id, role, is_banned FROM users WHERE id = $1',
            [userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'User not found',
            });
        }

        const target = existing.rows[0];
        if (target.role === 'admin') {
            return res.status(400).json({
                error: 'Admin users cannot be deleted',
            });
        }

        if (!target.is_banned) {
            return res.status(400).json({
                error: 'Only banned users can be deleted',
            });
        }

        await pool.query('DELETE FROM users WHERE id = $1', [userId]);

        res.json({
            message: 'User deleted successfully',
            id: userId,
        });
    } catch (err) {
        next(err);
    }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res, next) => {
    try {
        const runOptionalQuery = async (query, params = [], fallbackRows = []) => {
            try {
                return await pool.query(query, params);
            } catch (err) {
                // Allow dashboard to load even if optional modules are not migrated yet.
                if (err.code === '42P01') {
                    return { rows: fallbackRows };
                }
                throw err;
            }
        };

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
        const surveyStatusDist = await runOptionalQuery(`
            SELECT effective_status AS status, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.survey_id = s.id
                        ) THEN 'published'
                        ELSE COALESCE(s.status::text, 'draft')
                    END AS effective_status
                FROM surveys s
            ) q
            GROUP BY effective_status
        `, [], []);

        // Article publish status distribution (for doughnut chart)
        const articleStatusDist = await runOptionalQuery(`
            SELECT status, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.article_id = a.id
                        ) THEN 'published'
                        WHEN a.is_published THEN 'published'
                        ELSE 'draft'
                    END AS status
                FROM articles a
            ) q
            GROUP BY status
        `, [], []);

        // Survey category distribution (survey vs feedback)
        const surveyCategoryDist = await runOptionalQuery(`
            SELECT category, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.survey_id = s.id
                        ) THEN 'feedback'
                        ELSE 'survey'
                    END AS category
                FROM surveys s
            ) q
            GROUP BY category
        `);

        // Survey category + status distribution (survey/feedback with published/draft)
        const surveyCategoryStatusDist = await runOptionalQuery(`
            SELECT category, status, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.survey_id = s.id
                        ) THEN 'feedback'
                        ELSE 'survey'
                    END AS category,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.survey_id = s.id
                        ) THEN 'published'
                        ELSE COALESCE(s.status::text, 'draft')
                    END AS status
                FROM surveys s
            ) q
            GROUP BY category, status
        `);

        // Article category distribution (article vs talks summary)
        const articleCategoryDist = await runOptionalQuery(`
            SELECT category, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.article_id = a.id
                        ) THEN 'talks_summary'
                        ELSE 'article'
                    END AS category
                FROM articles a
            ) q
            GROUP BY category
        `);

        // Article category + status distribution (article/talks summary with published/draft)
        const articleCategoryStatusDist = await runOptionalQuery(`
            SELECT category, status, COUNT(*)::int AS count
            FROM (
                SELECT
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.article_id = a.id
                        ) THEN 'talks_summary'
                        ELSE 'article'
                    END AS category,
                    CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM media_posts mp
                            WHERE mp.article_id = a.id
                        ) THEN 'published'
                        WHEN a.is_published THEN 'published'
                        ELSE 'draft'
                    END AS status
                FROM articles a
            ) q
            GROUP BY category, status
        `);

        // Media status distribution (for doughnut chart)
        const mediaStatusDist = await runOptionalQuery(`
            SELECT
                CASE
                    WHEN article_id IS NOT NULL OR survey_id IS NOT NULL THEN 'linked'
                    ELSE 'standalone'
                END AS status,
                COUNT(*)::int AS count
            FROM media_posts
            GROUP BY 1
        `);

        // Training category status distribution (for doughnut chart)
        const trainingCategoryStatusDist = await runOptionalQuery(`
            SELECT
                CASE WHEN is_active THEN 'public' ELSE 'draft' END AS status,
                COUNT(*)::int AS count
            FROM training_categories
            GROUP BY is_active
        `);

        // Training video status distribution (for doughnut chart)
        const trainingVideoStatusDist = await runOptionalQuery(`
            SELECT
                CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
                COUNT(*)::int AS count
            FROM training_videos
            GROUP BY is_active
        `);

        // Summary counts
        const totalUsers = await pool.query('SELECT COUNT(*)::int AS count FROM users');
        const totalSurveys = await pool.query('SELECT COUNT(*)::int AS count FROM surveys');
        const totalResponses = await pool.query('SELECT COUNT(*)::int AS count FROM responses');
        const bannedUsers = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_banned = true");
        const totalMediaPosts = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM media_posts', [], [{ count: 0 }]);
        const totalTrainingVideos = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM training_videos', [], [{ count: 0 }]);
        const activeTrainingVideos = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM training_videos WHERE is_active = true', [], [{ count: 0 }]);

        res.json({
            responses_per_survey: responsesPerSurvey.rows,
            survey_status_distribution: surveyStatusDist.rows,
            article_status_distribution: articleStatusDist.rows,
            survey_category_distribution: surveyCategoryDist.rows,
            survey_category_status_distribution: surveyCategoryStatusDist.rows,
            article_category_distribution: articleCategoryDist.rows,
            article_category_status_distribution: articleCategoryStatusDist.rows,
            media_status_distribution: mediaStatusDist.rows,
            training_video_status_distribution: trainingVideoStatusDist.rows,
            training_category_status_distribution: trainingCategoryStatusDist.rows,
            summary: {
                total_users: totalUsers.rows[0].count,
                total_surveys: totalSurveys.rows[0].count,
                total_responses: totalResponses.rows[0].count,
                banned_users: bannedUsers.rows[0].count,
                total_media_posts: totalMediaPosts.rows[0].count,
                total_training_videos: totalTrainingVideos.rows[0].count,
                active_training_videos: activeTrainingVideos.rows[0].count,
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

// Change current user's password
const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                error: 'current_password and new_password are required',
            });
        }

        const userResult = await pool.query(
            'SELECT id, password_hash FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult.rows[0];
        const currentPasswordMatch = await comparePassword(current_password, user.password_hash);
        if (!currentPasswordMatch) {
            return res.status(400).json({
                error: 'Current password is incorrect',
            });
        }

        const isSamePassword = await comparePassword(new_password, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'New password must be different from current password',
            });
        }

        const newHash = await hashPassword(new_password);
        await pool.query(
            `UPDATE users
             SET password_hash = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [newHash, req.user.userId]
        );

        return res.json({
            message: 'Password changed successfully',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    deleteUser,
    getDashboardStats,
    getProfile,
    updateProfile,
    changePassword,
};
