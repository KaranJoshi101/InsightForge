// Media Controller
const pool = require('../config/database');

const MEDIA_STATUSES = ['draft', 'published'];

const normalizeMediaStatus = (value, fallback = 'draft') => {
    if (typeof value !== 'string') {
        return fallback;
    }

    const normalized = value.trim().toLowerCase();
    return MEDIA_STATUSES.includes(normalized) ? normalized : fallback;
};

const autoPublishLinkedContent = async ({ surveyId, articleId }) => {
    if (surveyId) {
        await pool.query(
            `UPDATE surveys
             SET status = 'published', updated_at = NOW()
             WHERE id = $1`,
            [surveyId]
        );
    }

    if (articleId) {
        await pool.query(
            `UPDATE articles
             SET is_published = true, updated_at = NOW()
             WHERE id = $1`,
            [articleId]
        );
    }
};

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
            `SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at
             FROM media_posts
             WHERE status = 'published'
             ORDER BY created_at DESC
             LIMIT $1`,
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
 * Get all media posts for admin view, including drafts
 */
const getAdminMediaPosts = async (req, res, next) => {
    try {
        const { limit = 100 } = req.query;
        const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);

        const result = await pool.query(
            `SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at
             FROM media_posts
             ORDER BY created_at DESC
             LIMIT $1`,
            [parsedLimit]
        );

        res.json({
            posts: result.rows,
            count: result.rows.length,
        });
    } catch (err) {
        if (err.code === '42P01') {
            return res.json({ posts: [], count: 0 });
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
        const {
            title,
            description,
            image_url,
            size = 'medium',
            source = 'manual',
            status,
            external_id,
            article_id,
            survey_id,
        } = req.body;

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

        const hasLinkedContent = Boolean(survey_id || article_id);
        const requestedStatus = normalizeMediaStatus(status, 'draft');
        const finalStatus = hasLinkedContent ? 'published' : requestedStatus;

        const result = await pool.query(
            `INSERT INTO media_posts
                (title, description, image_url, size, source, status, external_id, article_id, survey_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                title,
                description || null,
                image_url,
                validSize,
                validSource,
                finalStatus,
                external_id || null,
                article_id || null,
                survey_id || null,
            ]
        );

        await autoPublishLinkedContent({ surveyId: survey_id, articleId: article_id });

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
                    `INSERT INTO media_posts (title, description, image_url, size, source, status, external_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)
                     ON CONFLICT (external_id) DO NOTHING
                     RETURNING *`,
                    [title, description || null, image_url, size, source, 'draft', external_id]
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
            `SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at
             FROM media_posts
             WHERE id = $1 AND status = 'published'`,
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
        const { title, description, image_url, size, source, status, survey_id, article_id } = req.body;

        const existing = await pool.query('SELECT id, survey_id, article_id FROM media_posts WHERE id = $1', [id]);
        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        const currentPost = existing.rows[0];

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
        if (status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(normalizeMediaStatus(status));
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

        const nextSurveyId = survey_id === undefined ? currentPost.survey_id : survey_id;
        const nextArticleId = article_id === undefined ? currentPost.article_id : article_id;
        const hasLinkedContent = Boolean(nextSurveyId || nextArticleId);

        if (hasLinkedContent) {
            const statusFieldIndex = fields.findIndex((field) => field.startsWith('status ='));
            if (statusFieldIndex >= 0) {
                values[statusFieldIndex] = 'published';
            } else {
                fields.push(`status = $${idx++}`);
                values.push('published');
            }
        }

        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);

        const result = await pool.query(
            `UPDATE media_posts
             SET ${fields.join(', ')}
             WHERE id = $${idx}
             RETURNING id, title, description, image_url, size, source, status, article_id, survey_id, created_at`,
            values
        );

        await autoPublishLinkedContent({
            surveyId: nextSurveyId,
            articleId: nextArticleId,
        });

        res.json({
            message: 'Media post updated successfully',
            post: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Publish a media post (admin only)
 */
const publishMediaPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            `UPDATE media_posts
             SET status = 'published', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, title, status`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        res.json({
            message: 'Media post published successfully',
            post: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

/**
 * Unpublish a media post (admin only)
 */
const unpublishMediaPost = async (req, res, next) => {
    try {
        const { id } = req.params;

        const existing = await pool.query(
            'SELECT id, survey_id, article_id FROM media_posts WHERE id = $1',
            [id]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        const post = existing.rows[0];

        // Media card visibility is independent from linked content lifecycle.
        // Keep linked feedback/talk entities published even when media is moved to draft.
        await autoPublishLinkedContent({
            surveyId: post.survey_id,
            articleId: post.article_id,
        });

        const result = await pool.query(
            `UPDATE media_posts
             SET status = 'draft', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1
             RETURNING id, title, status`,
            [id]
        );

        res.json({
            message: 'Media post moved to draft successfully',
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

        await pool.query('BEGIN');

        const result = await pool.query(
            'DELETE FROM media_posts WHERE id = $1 RETURNING id, survey_id, article_id',
            [id]
        );

        if (result.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({
                error: 'Media post not found',
            });
        }

        const deletedPost = result.rows[0];

        if (deletedPost.survey_id) {
            const remainingSurveyLinks = await pool.query(
                'SELECT 1 FROM media_posts WHERE survey_id = $1 LIMIT 1',
                [deletedPost.survey_id]
            );

            if (remainingSurveyLinks.rows.length === 0) {
                await pool.query(
                    `UPDATE surveys
                     SET status = 'draft', updated_at = NOW()
                     WHERE id = $1`,
                    [deletedPost.survey_id]
                );
            }
        }

        if (deletedPost.article_id) {
            const remainingArticleLinks = await pool.query(
                'SELECT 1 FROM media_posts WHERE article_id = $1 LIMIT 1',
                [deletedPost.article_id]
            );

            if (remainingArticleLinks.rows.length === 0) {
                await pool.query(
                    `UPDATE articles
                     SET is_published = false, updated_at = NOW()
                     WHERE id = $1`,
                    [deletedPost.article_id]
                );
            }
        }

        await pool.query('COMMIT');

        res.json({
            message: 'Media post deleted successfully',
            id: deletedPost.id,
        });
    } catch (err) {
        try {
            await pool.query('ROLLBACK');
        } catch (_rollbackErr) {
            // Ignore rollback errors and continue with original error handling.
        }
        next(err);
    }
};

module.exports = {
    getMediaPosts,
    getAdminMediaPosts,
    createMediaPost,
    getMediaPostById,
    updateMediaPost,
    publishMediaPost,
    unpublishMediaPost,
    deleteMediaPost,
    insertMediaPosts,
};
