// Auth Routes
const express = require('express');
const router = express.Router();
const {
	requestRegisterOtp,
	verifyRegisterOtp,
	login,
	getCurrentUser,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authRateLimit } = require('../middleware/security');
const { validateRequest } = require('../middleware/validateRequest');
const {
	registerValidation,
	loginValidation,
	verifySignupOtpValidation,
} = require('../middleware/routeValidators');

// Public routes
router.post('/register', authRateLimit, registerValidation, validateRequest, requestRegisterOtp);
router.post('/register/request-otp', authRateLimit, registerValidation, validateRequest, requestRegisterOtp);
router.post('/register/verify-otp', authRateLimit, verifySignupOtpValidation, validateRequest, verifyRegisterOtp);
router.post('/login', authRateLimit, loginValidation, validateRequest, login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);

module.exports = router;
