// Survey Routes
const express = require('express');
const router = express.Router();
const {
    getAllSurveys,
    getSurveyById,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    addQuestion,
    addOption
} = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, surveyWriteValidation } = require('../middleware/routeValidators');

// Public routes
router.get('/', paginationQuery, validateRequest, getAllSurveys);
router.get('/:id', idParam('id'), validateRequest, getSurveyById);

// Admin routes (protected)
router.post('/', authenticate, authorize, surveyWriteValidation, validateRequest, createSurvey);
router.put('/:id', authenticate, authorize, idParam('id'), surveyWriteValidation, validateRequest, updateSurvey);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteSurvey);

// Question management
router.post('/:surveyId/questions', authenticate, authorize, idParam('surveyId'), validateRequest, addQuestion);
router.post('/questions/:questionId/options', authenticate, authorize, idParam('questionId'), validateRequest, addOption);

module.exports = router;
