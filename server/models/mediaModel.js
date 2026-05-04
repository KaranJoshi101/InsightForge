const pool = require('../config/database');

const MEDIA_STATUSES = ['draft', 'published'];

const normalizeMediaStatus = (value, fallback = 'draft') => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    return MEDIA_STATUSES.includes(normalized) ? normalized : fallback;
};

async function findPublished({ limit = 50 } = {}) {
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 500);
    const result = await pool.query(`SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at FROM media_posts WHERE status = 'published' ORDER BY created_at DESC LIMIT $1`, [parsedLimit]);
    return result.rows;
}

async function findAll({ limit = 100 } = {}) {
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
    const result = await pool.query(`SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at FROM media_posts ORDER BY created_at DESC LIMIT $1`, [parsedLimit]);
    return result.rows;
}

async function autoPublishLinkedContent({ surveyId, articleId }) {
    if (surveyId) {
        await pool.query(`UPDATE surveys SET status = 'published', updated_at = NOW() WHERE id = $1`, [surveyId]);
    }
    if (articleId) {
        await pool.query(`UPDATE articles SET is_published = true, updated_at = NOW() WHERE id = $1`, [articleId]);
    }
}

async function createMediaPost(fields) {
    const { title, description, image_url, size = 'medium', source = 'manual', status, external_id, article_id, survey_id } = fields;
    const validSize = ['small', 'medium', 'large'].includes(size) ? size : 'medium';
    const validSource = ['manual', 'linkedin'].includes(source) ? source : 'manual';
    const hasLinkedContent = Boolean(survey_id || article_id);
    const finalStatus = hasLinkedContent ? 'published' : normalizeMediaStatus(status, 'draft');

    const result = await pool.query(
        `INSERT INTO media_posts (title, description, image_url, size, source, status, external_id, article_id, survey_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [title, description || null, image_url, validSize, validSource, finalStatus, external_id || null, article_id || null, survey_id || null]
    );

    await autoPublishLinkedContent({ surveyId: survey_id, articleId: article_id });
    return result.rows[0];
}

async function insertMediaPosts(posts) {
    let inserted = 0;
    let skipped = 0;
    for (const post of posts) {
        try {
            const { title, description, image_url, size = 'medium', source = 'linkedin', external_id } = post;
            const result = await pool.query(`INSERT INTO media_posts (title, description, image_url, size, source, status, external_id) VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (external_id) DO NOTHING RETURNING *`, [title, description || null, image_url, size, source, 'draft', external_id]);
            if (result.rows.length > 0) inserted++; else skipped++;
        } catch (err) {
            skipped++;
            console.error(`Failed to insert post: ${err.message}`);
        }
    }
    console.log(`[Media Posts] Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
    return { inserted, skipped };
}

async function findById(id, { requirePublished = true } = {}) {
    const sql = requirePublished ? `SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at FROM media_posts WHERE id = $1 AND status = 'published'` : `SELECT id, title, description, image_url, size, source, status, article_id, survey_id, created_at FROM media_posts WHERE id = $1`;
    const res = await pool.query(sql, [id]);
    return res.rows[0] || null;
}

async function updateMediaPost(id, updates) {
    const existing = await pool.query('SELECT id, survey_id, article_id FROM media_posts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return null;
    const currentPost = existing.rows[0];

    const fields = [];
    const values = [];
    let idx = 1;

    if (typeof updates.title === 'string') { fields.push(`title = $${idx++}`); values.push(updates.title.trim()); }
    if (typeof updates.description === 'string' || updates.description === null) { fields.push(`description = $${idx++}`); values.push(updates.description); }
    if (typeof updates.image_url === 'string') { fields.push(`image_url = $${idx++}`); values.push(updates.image_url.trim()); }
    if (typeof updates.size === 'string' && ['small','medium','large'].includes(updates.size)) { fields.push(`size = $${idx++}`); values.push(updates.size); }
    if (typeof updates.source === 'string' && ['manual','linkedin'].includes(updates.source)) { fields.push(`source = $${idx++}`); values.push(updates.source); }
    if (updates.status !== undefined) { fields.push(`status = $${idx++}`); values.push(normalizeMediaStatus(updates.status)); }
    if (typeof updates.survey_id === 'number' || updates.survey_id === null) { fields.push(`survey_id = $${idx++}`); values.push(updates.survey_id); }
    if (typeof updates.article_id === 'number' || updates.article_id === null) { fields.push(`article_id = $${idx++}`); values.push(updates.article_id); }

    const nextSurveyId = updates.survey_id === undefined ? currentPost.survey_id : updates.survey_id;
    const nextArticleId = updates.article_id === undefined ? currentPost.article_id : updates.article_id;
    const hasLinkedContent = Boolean(nextSurveyId || nextArticleId);

    if (hasLinkedContent) {
        const statusFieldIndex = fields.findIndex((f) => f.startsWith('status ='));
        if (statusFieldIndex >= 0) {
            values[statusFieldIndex] = 'published';
        } else {
            fields.push(`status = $${idx++}`);
            values.push('published');
        }
    }

    if (fields.length === 0) return null;

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const sql = `UPDATE media_posts SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, title, description, image_url, size, source, status, article_id, survey_id, created_at`;
    const result = await pool.query(sql, values);

    await autoPublishLinkedContent({ surveyId: nextSurveyId, articleId: nextArticleId });
    return result.rows[0];
}

async function publishMediaPost(id) {
    const result = await pool.query(`UPDATE media_posts SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, title, status`, [id]);
    return result.rows[0] || null;
}

async function unpublishMediaPost(id) {
    const existing = await pool.query('SELECT id, survey_id, article_id FROM media_posts WHERE id = $1', [id]);
    if (existing.rows.length === 0) return null;
    const post = existing.rows[0];
    await autoPublishLinkedContent({ surveyId: post.survey_id, articleId: post.article_id });
    const result = await pool.query(`UPDATE media_posts SET status = 'draft', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING id, title, status`, [id]);
    return result.rows[0] || null;
}

async function deleteMediaPost(id) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query('DELETE FROM media_posts WHERE id = $1 RETURNING id, survey_id, article_id', [id]);
        if (result.rows.length === 0) { await client.query('ROLLBACK'); return null; }
        const deletedPost = result.rows[0];

        if (deletedPost.survey_id) {
            const remainingSurveyLinks = await client.query('SELECT 1 FROM media_posts WHERE survey_id = $1 LIMIT 1', [deletedPost.survey_id]);
            if (remainingSurveyLinks.rows.length === 0) {
                await client.query(`UPDATE surveys SET status = 'draft', updated_at = NOW() WHERE id = $1`, [deletedPost.survey_id]);
            }
        }

        if (deletedPost.article_id) {
            const remainingArticleLinks = await client.query('SELECT 1 FROM media_posts WHERE article_id = $1 LIMIT 1', [deletedPost.article_id]);
            if (remainingArticleLinks.rows.length === 0) {
                await client.query(`UPDATE articles SET is_published = false, updated_at = NOW() WHERE id = $1`, [deletedPost.article_id]);
            }
        }

        await client.query('COMMIT');
        return deletedPost;
    } catch (err) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    findPublished,
    findAll,
    createMediaPost,
    insertMediaPosts,
    findById,
    updateMediaPost,
    publishMediaPost,
    unpublishMediaPost,
    deleteMediaPost,
    autoPublishLinkedContent,
};
