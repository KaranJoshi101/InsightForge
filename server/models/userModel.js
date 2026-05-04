const pool = require('../config/database');

const findUsers = async ({ page = 1, limit = 20, search = '' } = {}) => {
    const offset = (page - 1) * limit;

    if (search && String(search).trim()) {
        const searchPattern = `%${String(search).trim()}%`;
        const usersResult = await pool.query(
            `SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
             FROM users
             WHERE name ILIKE $1 OR email ILIKE $1
             ORDER BY created_at DESC
             LIMIT $2 OFFSET $3`,
            [searchPattern, limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM users WHERE name ILIKE $1 OR email ILIKE $1`,
            [searchPattern]
        );

        return { users: usersResult.rows, total: parseInt(countResult.rows[0].count, 10) };
    }

    const usersResult = await pool.query(
        `SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
         FROM users
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    return { users: usersResult.rows, total: parseInt(countResult.rows[0].count, 10) };
};

const getUserById = async (id) => {
    const res = await pool.query(
        `SELECT id, name, email, role, is_banned, location, age, gender, phone, bio, created_at, updated_at
         FROM users
         WHERE id = $1`,
        [id]
    );
    return res.rows[0] || null;
};

const updateBan = async (id, value) => {
    const res = await pool.query(
        'UPDATE users SET is_banned = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, is_banned',
        [value, id]
    );
    return res.rows[0] || null;
};

const getUserForDeletion = async (id) => {
    const res = await pool.query('SELECT id, role, is_banned FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
};

const deleteUserById = async (id) => {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return true;
};

const runOptionalQuery = async (query, params = [], fallbackRows = []) => {
    try {
        return await pool.query(query, params);
    } catch (err) {
        if (err.code === '42P01') return { rows: fallbackRows };
        throw err;
    }
};

const getDashboardStats = async () => {
    const responsesPerSurvey = await pool.query(`
            SELECT s.id, s.title, COUNT(r.id)::int AS response_count
            FROM surveys s
            LEFT JOIN responses r ON s.id = r.survey_id
            GROUP BY s.id, s.title
            ORDER BY response_count DESC
            LIMIT 10
        `);

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
        `, [], []);

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
        `, [], []);

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
        `, [], []);

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
        `, [], []);

    const mediaStatusDist = await runOptionalQuery(`
            SELECT
                CASE
                    WHEN article_id IS NOT NULL OR survey_id IS NOT NULL THEN 'linked'
                    ELSE 'standalone'
                END AS status,
                COUNT(*)::int AS count
            FROM media_posts
            GROUP BY 1
        `, [], []);

    const trainingCategoryStatusDist = await runOptionalQuery(`
            SELECT
                CASE WHEN is_active THEN 'public' ELSE 'draft' END AS status,
                COUNT(*)::int AS count
            FROM training_categories
            GROUP BY is_active
        `, [], []);

    const trainingVideoStatusDist = await runOptionalQuery(`
            SELECT
                CASE WHEN is_active THEN 'active' ELSE 'inactive' END AS status,
                COUNT(*)::int AS count
            FROM training_videos
            GROUP BY is_active
        `, [], []);

    const totalUsers = await pool.query('SELECT COUNT(*)::int AS count FROM users');
    const totalSurveys = await pool.query('SELECT COUNT(*)::int AS count FROM surveys');
    const totalResponses = await pool.query('SELECT COUNT(*)::int AS count FROM responses');
    const bannedUsers = await pool.query("SELECT COUNT(*)::int AS count FROM users WHERE is_banned = true");
    const totalMediaPosts = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM media_posts', [], [{ count: 0 }]);
    const totalTrainingVideos = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM training_videos', [], [{ count: 0 }]);
    const activeTrainingVideos = await runOptionalQuery('SELECT COUNT(*)::int AS count FROM training_videos WHERE is_active = true', [], [{ count: 0 }]);

    return {
        responsesPerSurvey: responsesPerSurvey.rows,
        surveyStatusDist: surveyStatusDist.rows,
        articleStatusDist: articleStatusDist.rows,
        surveyCategoryDist: surveyCategoryDist.rows,
        surveyCategoryStatusDist: surveyCategoryStatusDist.rows,
        articleCategoryDist: articleCategoryDist.rows,
        articleCategoryStatusDist: articleCategoryStatusDist.rows,
        mediaStatusDist: mediaStatusDist.rows,
        trainingVideoStatusDist: trainingVideoStatusDist.rows,
        trainingCategoryStatusDist: trainingCategoryStatusDist.rows,
        summary: {
            total_users: totalUsers.rows[0].count,
            total_surveys: totalSurveys.rows[0].count,
            total_responses: totalResponses.rows[0].count,
            banned_users: bannedUsers.rows[0].count,
            total_media_posts: totalMediaPosts.rows[0].count,
            total_training_videos: totalTrainingVideos.rows[0].count,
            active_training_videos: activeTrainingVideos.rows[0].count,
        },
    };
};

const getProfile = async (userId) => {
    const res = await pool.query('SELECT id, name, email, role, location, age, gender, phone, bio, created_at FROM users WHERE id = $1', [userId]);
    return res.rows[0] || null;
};

const updateProfile = async (userId, fields) => {
    const { name, location, age, gender, phone, bio } = fields;
    const res = await pool.query(
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
        [name.trim(), location || null, age ? parseInt(age) : null, gender || null, phone || null, bio || null, userId]
    );
    return res.rows[0] || null;
};

const getPasswordHashById = async (userId) => {
    const res = await pool.query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
    return res.rows[0] || null;
};

const updatePasswordHash = async (userId, newHash) => {
    await pool.query(`UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [newHash, userId]);
    return true;
};

module.exports = {
    findUsers,
    getUserById,
    updateBan,
    getUserForDeletion,
    deleteUserById,
    getDashboardStats,
    getProfile,
    updateProfile,
    getPasswordHashById,
    updatePasswordHash,
};
