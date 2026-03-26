// Media Controller
const pool = require('../config/database');

/**
 * Get all media posts ordered by created_at DESC
 * Supports pagination via query params
 */
const getMediaPosts = async (req, res, next) => {
    try {
        const { limit = 50 } = req.query;

        // Validate limit
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 500);

        const result = await pool.query(
            'SELECT id, title, description, image_url, size, source, article_id, survey_id, created_at FROM media_posts ORDER BY created_at DESC LIMIT $1',
            [parsedLimit]
        );

        res.json({
            posts: result.rows,
            count: result.rows.length,
        });
    } catch (err) {
        if (err.code === '42P01') {
            // If migration is not yet applied, fail gracefully for the UI.
            return res.json({
                posts: [],
                count: 0,
            });
        }
        next(err);
    }
};

/**
 * Create a new media post (admin only)
 * Body: { title, description, image_url, size = 'medium', source = 'manual' }
 */
const createMediaPost = async (req, res, next) => {
    try {
        const { title, description, image_url, size = 'medium', source = 'manual', external_id, article_id, survey_id } = req.body;

        // Validate required fields
        if (!title || !image_url) {
            return res.status(400).json({
                error: 'Title and image_url are required',
            });
        }

        // Validate size enum
        const validSizes = ['small', 'medium', 'large'];
        const validSize = validSizes.includes(size) ? size : 'medium';

        // Validate source enum
        const validSources = ['manual', 'linkedin'];
        const validSource = validSources.includes(source) ? source : 'manual';

        const result = await pool.query(
            'INSERT INTO media_posts (title, description, image_url, size, source, external_id, article_id, survey_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, description || null, image_url, validSize, validSource, external_id || null, article_id || null, survey_id || null]
        );

        res.status(201).json({
            message: 'Media post created successfully',
            post: result.rows[0],
        });
    } catch (err) {
        // Handle unique constraint violation on external_id
        if (err.code === '23505') {
            return res.status(409).json({
                error: 'Media post with this external ID already exists',
            });
        }
        next(err);
    }
};

/**
 * Insert multiple media posts (used for LinkedIn batch sync)
 * Avoids duplicates using external_id
 */
const insertMediaPosts = async (posts) => {
    try {
        let inserted = 0;
        let skipped = 0;

        for (const post of posts) {
            try {
                const { title, description, image_url, size = 'medium', source = 'linkedin', external_id } = post;

                const result = await pool.query(
                    'INSERT INTO media_posts (title, description, image_url, size, source, external_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (external_id) DO NOTHING RETURNING *',
                    [title, description || null, image_url, size, source, external_id]
                );

                if (result.rows.length > 0) {
                    inserted++;
                } else {
                    skipped++;
                }
            } catch (err) {
                skipped++;
                console.error(`Failed to insert post: ${err.message}`);
            }
        }

        console.log(`[Media Posts] Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
        return { inserted, skipped };
    } catch (err) {
        console.error('[Media Posts] Batch insert error:', err.message);
        throw err;
    }
};

/**
 * Get media post by ID
 */
const getMediaPostById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'SELECT id, title, description, image_url, size, source, article_id, survey_id, created_at FROM media_posts WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        res.json({ post: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

/**
 * Update a media post (admin only)
 * Body: { title, description, image_url, size, source }
 */
const updateMediaPost = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, image_url, size, source, survey_id, article_id } = req.body;

        const existing = await pool.query('SELECT id FROM media_posts WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        const fields = [];
        const values = [];
        let idx = 1;

        if (typeof title === 'string') {
            fields.push(`title = $${idx++}`);
            values.push(title.trim());
        }
        if (typeof description === 'string' || description === null) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }
        if (typeof image_url === 'string') {
            fields.push(`image_url = $${idx++}`);
            values.push(image_url.trim());
        }
        if (typeof size === 'string' && ['small', 'medium', 'large'].includes(size)) {
            fields.push(`size = $${idx++}`);
            values.push(size);
        }
        if (typeof source === 'string' && ['manual', 'linkedin'].includes(source)) {
            fields.push(`source = $${idx++}`);
            values.push(source);
        }
        if (typeof survey_id === 'number' || survey_id === null) {
            fields.push(`survey_id = $${idx++}`);
            values.push(survey_id);
        }
        if (typeof article_id === 'number' || article_id === null) {
            fields.push(`article_id = $${idx++}`);
            values.push(article_id);
        }

        if (fields.length === 0) {
            return res.status(400).json({
                error: 'No valid fields provided for update',
            });
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(
            `UPDATE media_posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, title, description, image_url, size, source, article_id, survey_id, created_at`,
            values
        );

        res.json({
            message: 'Media post updated successfully',
            post: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Delete a media post (admin only)
 */
const deleteMediaPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM media_posts WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        res.json({
            message: 'Media post deleted successfully',
            id: result.rows[0].id,
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    getMediaPosts,
    createMediaPost,
    getMediaPostById,
    updateMediaPost,
    deleteMediaPost,
    insertMediaPosts,
};
