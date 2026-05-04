// Article Routes
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/articleController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, articleWriteValidation, articleScheduleValidation } = require('../middleware/routeValidators');

// Public routes
router.get('/', paginationQuery, validateRequest, getArticles);

// Admin routes (protected) - must come before /:id to avoid route conflicts
router.get('/admin/my-articles', authenticate, authorize, paginationQuery, validateRequest, getAdminArticles);
router.post('/', authenticate, authorize, articleWriteValidation, validateRequest, createArticle);
router.put('/:id', authenticate, authorize, idParam('id'), articleWriteValidation, validateRequest, updateArticle);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteArticle);

// Advanced article features
router.put('/:id/autosave', authenticate, authorize, idParam('id'), autosaveArticle);
router.post('/:id/drafts', authenticate, authorize, idParam('id'), validateRequest, saveArticleDraft);
router.get('/:id/drafts', authenticate, authorize, idParam('id'), validateRequest, getArticleDrafts);
router.put('/:id/metadata', authenticate, authorize, idParam('id'), updateArticleMetadata);
router.put('/:id/schedule', authenticate, authorize, idParam('id'), articleScheduleValidation, validateRequest, scheduleArticlePublish);

// Public parameterized route (must be last)
router.get('/:id', getArticleById);

module.exports = router;
