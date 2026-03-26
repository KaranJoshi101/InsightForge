// Survey Routes
const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();
const {
    getAllSurveys,
    getSurveyById,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    addQuestion,
    addOption,
    updateQuestion,
    deleteQuestion,
    updateOption,
    deleteOption,
    uploadSurveyEmailAttachments,
} = require('../controllers/surveyController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery, surveyWriteValidation } = require('../middleware/routeValidators');

const uploadDir = path.join(__dirname, '..', 'uploads', 'survey-email-attachments');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.random().toString(16).slice(2);
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${random}-${safeOriginal}`);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 10,
    },
});

// Public routes
router.get('/', paginationQuery, validateRequest, getAllSurveys);
router.get('/:id', idParam('id'), validateRequest, getSurveyById);

// Admin routes (protected)
router.post('/email-attachments', authenticate, authorize, upload.array('files', 10), uploadSurveyEmailAttachments);
router.post('/', authenticate, authorize, surveyWriteValidation, validateRequest, createSurvey);
router.put('/:id', authenticate, authorize, idParam('id'), surveyWriteValidation, validateRequest, updateSurvey);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteSurvey);

// Question management
router.post('/:surveyId/questions', authenticate, authorize, idParam('surveyId'), validateRequest, addQuestion);
router.post('/questions/:questionId/options', authenticate, authorize, idParam('questionId'), validateRequest, addOption);
router.put('/questions/:questionId', authenticate, authorize, idParam('questionId'), validateRequest, updateQuestion);
router.delete('/questions/:questionId', authenticate, authorize, idParam('questionId'), validateRequest, deleteQuestion);
router.put('/questions/options/:optionId', authenticate, authorize, idParam('optionId'), validateRequest, updateOption);
router.delete('/questions/options/:optionId', authenticate, authorize, idParam('optionId'), validateRequest, deleteOption);

module.exports = router;
