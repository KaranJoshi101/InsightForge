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

const getPublishedArticles = async (limit, offset) => {
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

    return {
        articles: articlesResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
    };
};

const getArticleByIdentifier = async (identifier) => {
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

    return result.rows[0] || null;
};

const hasMediaPostForArticle = async (articleId) => {
    const result = await pool.query('SELECT 1 FROM media_posts WHERE article_id = $1 LIMIT 1', [articleId]);
    return result.rows.length > 0;
};

const createArticle = async (title, content, authorId) => {
    const slug = await generateUniqueSlug(pool, 'articles', title);
    const result = await pool.query(
        'INSERT INTO articles (title, slug, content, author, is_published) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [title, slug, content, authorId, false]
    );
    return result.rows[0];
};

const updateArticle = async (id, fields) => {
    const { title, content, is_published, meta_description, tags, reading_time_minutes } = fields;

    let nextSlug;
    if (title !== undefined) {
        nextSlug = await generateUniqueSlug(pool, 'articles', title, id);
    }

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

    return result.rows[0] || null;
};

const deleteArticle = async (id) => {
    const result = await pool.query('DELETE FROM articles WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

const getAdminArticles = async (limit, offset) => {
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

    const countResult = await pool.query('SELECT COUNT(*) FROM articles');

    const normalizedArticles = articlesResult.rows.map((article) => ({
        ...article,
        is_published: article.effective_is_published,
    }));

    return { articles: normalizedArticles, total: parseInt(countResult.rows[0].count, 10) };
};

const autosaveArticle = async (id, userId, fields) => {
    const { title, content, meta_description, tags } = fields;

    const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (articleCheck.rows.length === 0) return { error: 'not_found' };

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

    if (updateResult.rows.length > 0) return updateResult.rows[0];

    const insertResult = await pool.query(
        `INSERT INTO article_drafts (article_id, user_id, title, content, meta_description, tags, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, updated_at`,
        [id, userId, title, content, meta_description, tags]
    );

    return insertResult.rows[0];
};

const saveArticleDraft = async (id, userId, fields) => {
    const { title, content, meta_description, tags } = fields;

    const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (articleCheck.rows.length === 0) return { error: 'not_found' };

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

    if (updateResult.rows.length > 0) return updateResult.rows[0];

    const insertResult = await pool.query(
        `INSERT INTO article_drafts (article_id, user_id, title, content, meta_description, tags, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, article_id, user_id, title, content, meta_description, tags, created_at, updated_at`,
        [id, userId, title || null, content || null, meta_description || null, tags || null]
    );

    return insertResult.rows[0];
};

const getArticleDrafts = async (id, userId) => {
    const articleCheck = await pool.query('SELECT id FROM articles WHERE id = $1', [id]);
    if (articleCheck.rows.length === 0) return { error: 'not_found' };

    const draftsResult = await pool.query(
        `SELECT id, article_id, user_id, title, content, meta_description, tags, created_at, updated_at
             FROM article_drafts
             WHERE article_id = $1 AND user_id = $2
             ORDER BY updated_at DESC`,
        [id, userId]
    );

    return { drafts: draftsResult.rows, latestDraft: draftsResult.rows[0] || null };
};

const updateArticleMetadata = async (id, fields) => {
    const { meta_description, tags, slug, reading_time_minutes } = fields;
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

    return result.rows[0] || null;
};

const scheduleArticlePublish = async (id, publishAt) => {
    const result = await pool.query(
        `UPDATE articles
             SET is_published = false,
                 scheduled_publish_at = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
        [publishAt.toISOString(), id]
    );

    return result.rows[0] || null;
};

module.exports = {
    publishDueScheduledArticles,
    getPublishedArticles,
    getArticleByIdentifier,
    hasMediaPostForArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    getAdminArticles,
    autosaveArticle,
    saveArticleDraft,
    getArticleDrafts,
    updateArticleMetadata,
    scheduleArticlePublish,
};
