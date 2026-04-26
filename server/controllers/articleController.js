// Article Controller
const pool = require('../config/database');
const { generateUniqueSlug } = require('../utils/slug');

const publishDueScheduledArticles = async () => {
    await pool.query(
        `UPDATE articles
         SET is_published = true,
             scheduled_publish_at = NULL,
             updated_at = NOW()
         WHERE is_published = false
           AND scheduled_publish_at IS NOT NULL
           AND scheduled_publish_at <= NOW()`
    );
};

// Get published articles
const getArticles = async (req, res, next) => {
    try {
        await publishDueScheduledArticles();
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const articlesResult = await pool.query(
            `SELECT
                a.id,
                a.slug,
                a.title,
                a.content,
                a.author,
                u.name as author_name,
                CASE
                    WHEN EXISTS (SELECT 1 FROM media_posts mp WHERE mp.article_id = a.id) THEN true
                    ELSE a.is_published
                END AS is_published,
                a.created_at
             FROM articles a
             JOIN users u ON a.author = u.id
             WHERE (
                a.is_published = true
                OR EXISTS (SELECT 1 FROM media_posts mp WHERE mp.article_id = a.id)
             )
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query(
            `SELECT COUNT(*)
             FROM articles a
             WHERE (
                a.is_published = true
                OR EXISTS (SELECT 1 FROM media_posts mp WHERE mp.article_id = a.id)
             )`
        );

        res.json({
            articles: articlesResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get article by slug (or legacy ID)
const getArticleById = async (req, res, next) => {
    try {
        await publishDueScheduledArticles();
        const { id } = req.params;
        const identifier = String(id || '').trim().toLowerCase();

        const result = await pool.query(
            `SELECT
                a.id,
                a.slug,
                a.title,
                a.content,
                a.author,
                u.name as author_name,
                CASE
                    WHEN EXISTS (SELECT 1 FROM media_posts mp WHERE mp.article_id = a.id) THEN true
                    ELSE a.is_published
                END AS is_published,
                a.created_at,
                a.updated_at
             FROM articles a
             JOIN users u ON a.author = u.id
               WHERE (a.slug = $1 OR a.id::text = $1)
               AND (
                    a.is_published = true
                    OR EXISTS (SELECT 1 FROM media_posts mp WHERE mp.article_id = a.id)
               )`,
              [identifier]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Article not found',
            });
        }

        res.json({ article: result.rows[0] });
    } catch (err) {
        next(err);
    }
};

// Create article (admin only)
const createArticle = async (req, res, next) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                error: 'Title and content are required',
            });
        }

        const slug = await generateUniqueSlug(pool, 'articles', title);

        const result = await pool.query(
            'INSERT INTO articles (title, slug, content, author, is_published) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, slug, content, req.user.userId, false]
        );

        res.status(201).json({
            message: 'Article created successfully',
            article: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// Update article (admin only)
const updateArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, is_published, meta_description, tags, reading_time_minutes } = req.body;

        if (is_published === false) {
            const talkCheck = await pool.query(
                'SELECT 1 FROM media_posts WHERE article_id = $1 LIMIT 1',
                [id]
            );

            if (talkCheck.rows.length > 0) {
                return res.status(400).json({
                    error: 'Talk articles must remain published',
                });
            }
        }

        const nextSlug = title !== undefined
            ? await generateUniqueSlug(pool, 'articles', title, id)
            : undefined;

        const result = await pool.query(
            `UPDATE articles
             SET title = COALESCE($1, title),
                 slug = COALESCE($2, slug),
                 content = COALESCE($3, content),
                 is_published = COALESCE($4, is_published),
                 meta_description = COALESCE($5, meta_description),
                 tags = COALESCE($6, tags),
                 reading_time_minutes = COALESCE($7, reading_time_minutes),
                 updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [title, nextSlug, content, is_published, meta_description, tags, reading_time_minutes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Article not found',
            });
        }

        res.json({
            message: 'Article updated successfully',
            article: result.rows[0],
        });
    } catch (err) {
        next(err);
    }
};

// Delete article (admin only)
const deleteArticle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM articles WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Article not found',
            });
        }

        res.json({
            message: 'Article deleted successfully',
        });
    } catch (err) {
        next(err);
    }
};

// Get admin articles (for editing)
const getAdminArticles = async (req, res, next) => {
    try {
        await publishDueScheduledArticles();
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const articlesResult = await pool.query(
            `SELECT
                a.*,
                EXISTS (
                    SELECT 1
                    FROM media_posts mp
                    WHERE mp.article_id = a.id
                ) AS is_talk,
                CASE
                    WHEN EXISTS (
                        SELECT 1
                        FROM media_posts mp
                        WHERE mp.article_id = a.id
                    ) THEN true
                    ELSE a.is_published
                END AS effective_is_published
             FROM articles a
             ORDER BY a.created_at DESC
             LIMIT $1 OFFSET $2`,
            [limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM articles'
        );

        const normalizedArticles = articlesResult.rows.map((article) => ({
            ...article,
            is_published: article.effective_is_published,
        }));

        res.json({
            articles: normalizedArticles,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Autosave article draft
const autosaveArticle = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, meta_description, tags } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if article exists
        const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
        if (articleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Save to article_drafts table without relying on DB-level unique constraints.
        const updateResult = await pool.query(
            `UPDATE article_drafts
             SET title = $3,
                 content = $4,
                 meta_description = $5,
                 tags = $6,
                 updated_at = NOW()
             WHERE article_id = $1 AND user_id = $2
             RETURNING id, updated_at`,
            [id, userId, title, content, meta_description, tags]
        );

        let result = updateResult;
        if (updateResult.rows.length === 0) {
            result = await pool.query(
                `INSERT INTO article_drafts (article_id, user_id, title, content, meta_description, tags, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, updated_at`,
                [id, userId, title, content, meta_description, tags]
            );
        }

        return res.json({
            message: 'Draft saved successfully',
            draft: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Update article metadata (SEO fields)
const updateArticleMetadata = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { meta_description, tags, slug, reading_time_minutes } = req.body;

        const result = await pool.query(
            `UPDATE articles 
             SET meta_description = COALESCE($1, meta_description),
                 tags = COALESCE($2, tags),
                 slug = COALESCE($3, slug),
                 reading_time_minutes = COALESCE($4, reading_time_minutes),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [meta_description, tags, slug, reading_time_minutes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        return res.json({
            message: 'Article metadata updated',
            article: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Save article draft (manual save)
const saveArticleDraft = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, content, meta_description, tags } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
        if (articleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const updateResult = await pool.query(
            `UPDATE article_drafts
             SET title = $3,
                 content = $4,
                 meta_description = $5,
                 tags = $6,
                 updated_at = NOW()
             WHERE article_id = $1 AND user_id = $2
             RETURNING id, article_id, user_id, title, content, meta_description, tags, created_at, updated_at`,
            [id, userId, title || null, content || null, meta_description || null, tags || null]
        );

        let result = updateResult;
        if (updateResult.rows.length === 0) {
            result = await pool.query(
                `INSERT INTO article_drafts (article_id, user_id, title, content, meta_description, tags, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, article_id, user_id, title, content, meta_description, tags, created_at, updated_at`,
                [id, userId, title || null, content || null, meta_description || null, tags || null]
            );
        }

        return res.status(201).json({
            message: 'Draft saved successfully',
            draft: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Get article drafts for current user and article
const getArticleDrafts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
        if (articleCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        const draftsResult = await pool.query(
            `SELECT id, article_id, user_id, title, content, meta_description, tags, created_at, updated_at
             FROM article_drafts
             WHERE article_id = $1 AND user_id = $2
             ORDER BY updated_at DESC`,
            [id, userId]
        );

        return res.json({
            drafts: draftsResult.rows,
            latestDraft: draftsResult.rows[0] || null,
        });
    } catch (err) {
        return next(err);
    }
};

// Schedule article publishing
const scheduleArticlePublish = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { publish_date } = req.body;

        const publishAt = new Date(publish_date);
        if (Number.isNaN(publishAt.getTime())) {
            return res.status(400).json({ error: 'publish_date must be a valid datetime' });
        }

        if (publishAt <= new Date()) {
            return res.status(400).json({ error: 'publish_date must be in the future' });
        }

        const talkCheck = await pool.query(
            'SELECT 1 FROM media_posts WHERE article_id = $1 LIMIT 1',
            [id]
        );
        if (talkCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Talk articles are always published and cannot be scheduled' });
        }

        const result = await pool.query(
            `UPDATE articles
             SET is_published = false,
                 scheduled_publish_at = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [publishAt.toISOString(), id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        return res.json({
            message: 'Article publish scheduled successfully',
            article: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    getAdminArticles,
    autosaveArticle,
    updateArticleMetadata,
    saveArticleDraft,
    getArticleDrafts,
    scheduleArticlePublish,
};
