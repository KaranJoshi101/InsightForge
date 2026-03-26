// Media Routes
const express = require('express');
const router = express.Router();
const {
    getMediaPosts,
    createMediaPost,
    getMediaPostById,
    updateMediaPost,
    deleteMediaPost,
} = require('../controllers/mediaController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam } = require('../middleware/routeValidators');

// Public route - get all media posts
router.get('/', getMediaPosts);

// Public route - get specific media post by ID
router.get('/:id', idParam('id'), validateRequest, getMediaPostById);

// Admin routes (protected)
router.post('/', authenticate, authorize, validateRequest, createMediaPost);
router.put('/:id', authenticate, authorize, idParam('id'), validateRequest, updateMediaPost);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteMediaPost);

module.exports = router;
