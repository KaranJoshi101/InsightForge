// User Routes (Admin)
const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    deleteUser,
    getDashboardStats,
    getProfile,
    updateProfile,
    changePassword,
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, profileUpdateValidation, changePasswordValidation } = require('../middleware/routeValidators');

// Profile routes (any authenticated user) - must come before /:id routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, profileUpdateValidation, validateRequest, updateProfile);
router.put('/profile/password', authenticate, changePasswordValidation, validateRequest, changePassword);

// Admin routes require admin authentication
router.get('/', authenticate, authorize, paginationQuery, validateRequest, getAllUsers);
router.get('/dashboard-stats', authenticate, authorize, getDashboardStats);
router.get('/:id', authenticate, authorize, idParam('id'), validateRequest, getUserById);
router.put('/:id/ban', authenticate, authorize, idParam('id'), validateRequest, banUser);
router.put('/:id/unban', authenticate, authorize, idParam('id'), validateRequest, unbanUser);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteUser);

module.exports = router;
