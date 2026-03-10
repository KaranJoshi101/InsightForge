// User Routes (Admin)
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    getDashboardStats,
    getProfile,
    updateProfile,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, profileUpdateValidation } = require('../middleware/routeValidators');

// Profile routes (any authenticated user) - must come before /:id routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, profileUpdateValidation, validateRequest, updateProfile);

// Admin routes require admin authentication
router.get('/', authenticate, authorize, paginationQuery, validateRequest, getAllUsers);
router.get('/dashboard-stats', authenticate, authorize, getDashboardStats);
router.get('/:id', authenticate, authorize, idParam('id'), validateRequest, getUserById);
router.put('/:id/ban', authenticate, authorize, idParam('id'), validateRequest, banUser);
router.put('/:id/unban', authenticate, authorize, idParam('id'), validateRequest, unbanUser);

module.exports = router;
