// Auth Routes
const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const { validateRequest } = require('../middleware/validateRequest');
const { registerValidation, loginValidation } = require('../middleware/routeValidators');

// Public routes
router.post('/register', authRateLimit, registerValidation, validateRequest, register);
router.post('/login', authRateLimit, loginValidation, validateRequest, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
