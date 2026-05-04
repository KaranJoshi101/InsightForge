// Media Controller
const mediaModel = require('../models/mediaModel');

const MEDIA_STATUSES = ['draft', 'published'];
const normalizeMediaStatus = (value, fallback = 'draft') => {
    if (typeof value !== 'string') return fallback;
    const normalized = value.trim().toLowerCase();
    return MEDIA_STATUSES.includes(normalized) ? normalized : fallback;
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

        const posts = await mediaModel.findPublished({ limit: parsedLimit });
        res.json({ posts, count: posts.length });
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

        const posts = await mediaModel.findAll({ limit: parsedLimit });
        res.json({ posts, count: posts.length });
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

        const post = await mediaModel.createMediaPost({ title, description, image_url, size: validSize, source: validSource, status: finalStatus, external_id, article_id, survey_id });
        res.status(201).json({ message: 'Media post created successfully', post });
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

                const r = await mediaModel.insertMediaPosts([post]);
                inserted += r.inserted;
                skipped += r.skipped;
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

        const post = await mediaModel.findById(id); // default requires published
        if (!post) return res.status(404).json({ error: 'Media post not found' });
        res.json({ post });
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

        const post = await mediaModel.updateMediaPost(id, { title, description, image_url, size, source, status, survey_id, article_id });
        if (!post) return res.status(404).json({ error: 'Media post not found' });
        res.json({ message: 'Media post updated successfully', post });
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

        const post = await mediaModel.publishMediaPost(id);
        if (!post) return res.status(404).json({ error: 'Media post not found' });
        res.json({ message: 'Media post published successfully', post });
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

        const post = await mediaModel.unpublishMediaPost(id);
        if (!post) return res.status(404).json({ error: 'Media post not found' });
        res.json({ message: 'Media post moved to draft successfully', post });
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

        const deletedPost = await mediaModel.deleteMediaPost(id);
        if (!deletedPost) return res.status(404).json({ error: 'Media post not found' });
        res.json({ message: 'Media post deleted successfully', id: deletedPost.id });
    } catch (err) {
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
