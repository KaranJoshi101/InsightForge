import api from './api';

const articleService = {
    // Get all published articles
    getArticles: (page = 1, limit = 10) =>
        api.get(`/articles?page=${page}&limit=${limit}`),

    // Get article by slug (or legacy ID)
    getArticleById: (identifier) =>
        api.get(`/articles/${identifier}`),

    // Create article (admin)
    createArticle: (title, content) =>
        api.post('/articles', { title, content }),

    // Update article (admin)
    updateArticle: (id, data) =>
        api.put(`/articles/${id}`, data),

    // Delete article (admin)
    deleteArticle: (id) =>
        api.delete(`/articles/${id}`),

    // Get admin articles (admin)
    getAdminArticles: (page = 1, limit = 100) =>
        api.get(`/articles/admin/my-articles?page=${page}&limit=${limit}`),

    // Publish article (admin)
    publishArticle: (id) =>
        api.put(`/articles/${id}`, { is_published: true }),

    // Unpublish article (admin)
    unpublishArticle: (id) =>
        api.put(`/articles/${id}`, { is_published: false }),

    // Autosave article draft (admin)
    autosaveArticle: (articleId, data) =>
        api.put(`/articles/${articleId}/autosave`, data),

    // Save article as draft (admin)
    saveDraft: (articleId, data) =>
        api.post(`/articles/${articleId}/drafts`, data),

    // Get article drafts (admin)
    getArticleDrafts: (articleId) =>
        api.get(`/articles/${articleId}/drafts`),

    // Update article metadata (SEO fields) (admin)
    updateArticleMetadata: (id, metadata) =>
        api.put(`/articles/${id}/metadata`, metadata),

    // Schedule article publishing (admin)
    scheduleArticlePublish: (id, publishDate) =>
        api.put(`/articles/${id}/schedule`, { publish_date: publishDate }),
};

export default articleService;
