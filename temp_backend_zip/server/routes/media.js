// Media Routes
const express = require('express');
const router = express.Router();
const {
    getMediaPosts,
    getAdminMediaPosts,
    createMediaPost,
    getMediaPostById,
    updateMediaPost,
    deleteMediaPost,
    publishMediaPost,
    unpublishMediaPost,
} = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam } = require('../middleware/routeValidators');

// Public route - get all media posts
router.get('/', getMediaPosts);

// Admin route - get all media posts including drafts
router.get('/admin/all', authenticate, authorize, validateRequest, getAdminMediaPosts);

// Public route - get specific media post by ID
router.get('/:id', idParam('id'), validateRequest, getMediaPostById);

// Admin routes (protected)
router.post('/', authenticate, authorize, validateRequest, createMediaPost);
router.put('/:id', authenticate, authorize, idParam('id'), validateRequest, updateMediaPost);
router.put('/:id/publish', authenticate, authorize, idParam('id'), validateRequest, publishMediaPost);
router.put('/:id/unpublish', authenticate, authorize, idParam('id'), validateRequest, unpublishMediaPost);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteMediaPost);

module.exports = router;
