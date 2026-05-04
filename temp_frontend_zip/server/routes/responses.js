// Response Routes
const express = require('express');
const router = express.Router();
const {
    submitResponse,
    getUserResponses,
    getSurveyResponses,
    getResponseDetails,
    getSurveyAnalytics,
    exportSurveyResponses,
    getSurveyDemographics
} = require('../controllers/responseController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, submitResponseValidation } = require('../middleware/routeValidators');

// Public routes
router.post('/', authenticate, submitResponseValidation, validateRequest, submitResponse);

// User routes
router.get('/user', authenticate, paginationQuery, validateRequest, getUserResponses);

// Admin routes (protected)
// More specific routes must come before less specific ones
router.get('/survey/:surveyId/export', authenticate, authorize, idParam('surveyId'), validateRequest, exportSurveyResponses);
router.get('/survey/:surveyId/demographics', authenticate, authorize, idParam('surveyId'), validateRequest, getSurveyDemographics);
router.get('/survey/:surveyId/analytics', authenticate, authorize, idParam('surveyId'), validateRequest, getSurveyAnalytics);
router.get('/survey/:surveyId', authenticate, authorize, idParam('surveyId'), paginationQuery, validateRequest, getSurveyResponses);
router.get('/:responseId', authenticate, idParam('responseId'), validateRequest, getResponseDetails);

module.exports = router;
