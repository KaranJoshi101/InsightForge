// Article Routes
const express = require('express');
const router = express.Router();
const {
    getArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    getAdminArticles
} = require('../controllers/articleController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, articleWriteValidation } = require('../middleware/routeValidators');

// Public routes
router.get('/', paginationQuery, validateRequest, getArticles);

// Admin routes (protected) - must come before /:id to avoid route conflicts
router.get('/admin/my-articles', authenticate, authorize, paginationQuery, validateRequest, getAdminArticles);
router.post('/', authenticate, authorize, articleWriteValidation, validateRequest, createArticle);
router.put('/:id', authenticate, authorize, idParam('id'), articleWriteValidation, validateRequest, updateArticle);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteArticle);

// Public parameterized route (must be last)
router.get('/:id', idParam('id'), validateRequest, getArticleById);

module.exports = router;
