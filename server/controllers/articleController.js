// Article Controller
const articleModel = require('../models/articleModel');

const publishDueScheduledArticles = articleModel.publishDueScheduledArticles;

// Get published articles
const getArticles = async (req, res, next) => {
    try {
        await publishDueScheduledArticles();
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        const { articles, total } = await articleModel.getPublishedArticles(parseInt(limit, 10), offset);

        res.json({
            articles,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
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

        const article = await articleModel.getArticleByIdentifier(identifier);
        if (!article) return res.status(404).json({ error: 'Article not found' });

        res.json({ article });
    } catch (err) {
        next(err);
    }
};

// Create article (admin only)
const createArticle = async (req, res, next) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

        const article = await articleModel.createArticle(title, content, req.user.userId);

        res.status(201).json({ message: 'Article created successfully', article });
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
            const hasTalkPost = await articleModel.hasMediaPostForArticle(id);
            if (hasTalkPost) return res.status(400).json({ error: 'Talk articles must remain published' });
        }

        const updated = await articleModel.updateArticle(id, { title, content, is_published, meta_description, tags, reading_time_minutes });
        if (!updated) return res.status(404).json({ error: 'Article not found' });

        res.json({ message: 'Article updated successfully', article: updated });
    } catch (err) {
        next(err);
    }
};

// Delete article (admin only)
const deleteArticle = async (req, res, next) => {
    try {
        const { id } = req.params;

        const deleted = await articleModel.deleteArticle(id);
        if (!deleted) return res.status(404).json({ error: 'Article not found' });

        res.json({ message: 'Article deleted successfully' });
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

        const { articles, total } = await articleModel.getAdminArticles(parseInt(limit, 10), offset);

        res.json({ articles, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total } });
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

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const saved = await articleModel.autosaveArticle(id, userId, { title, content, meta_description, tags });
        if (saved && saved.error === 'not_found') return res.status(404).json({ error: 'Article not found' });

        return res.json({ message: 'Draft saved successfully', draft: saved });
    } catch (err) {
        return next(err);
    }
};

// Update article metadata (SEO fields)
const updateArticleMetadata = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { meta_description, tags, slug, reading_time_minutes } = req.body;

        const updated = await articleModel.updateArticleMetadata(id, { meta_description, tags, slug, reading_time_minutes });
        if (!updated) return res.status(404).json({ error: 'Article not found' });

        return res.json({ message: 'Article metadata updated', article: updated });
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

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const saved = await articleModel.saveArticleDraft(id, userId, { title, content, meta_description, tags });
        if (saved && saved.error === 'not_found') return res.status(404).json({ error: 'Article not found' });

        return res.status(201).json({ message: 'Draft saved successfully', draft: saved });
    } catch (err) {
        return next(err);
    }
};

// Get article drafts for current user and article
const getArticleDrafts = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await articleModel.getArticleDrafts(id, userId);
        if (result && result.error === 'not_found') return res.status(404).json({ error: 'Article not found' });

        return res.json({ drafts: result.drafts, latestDraft: result.latestDraft });
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
        if (Number.isNaN(publishAt.getTime())) return res.status(400).json({ error: 'publish_date must be a valid datetime' });
        if (publishAt <= new Date()) return res.status(400).json({ error: 'publish_date must be in the future' });

        const hasTalkPost = await articleModel.hasMediaPostForArticle(id);
        if (hasTalkPost) return res.status(400).json({ error: 'Talk articles are always published and cannot be scheduled' });

        const updated = await articleModel.scheduleArticlePublish(id, publishAt);
        if (!updated) return res.status(404).json({ error: 'Article not found' });

        return res.json({ message: 'Article publish scheduled successfully', article: updated });
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
