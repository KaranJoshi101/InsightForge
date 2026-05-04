// Survey Controller
const path = require('path');
const surveyModel = require('../models/surveyModel');

const ALLOWED_QUESTION_TYPES = new Set([
    'multiple_choice',
    'text',
    'rating',
    'checkbox',
    'text_only',
    'number_only',
]);

// Get all surveys (with pagination)
const getAllSurveys = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, exclude_feedback } = req.query;
        const { surveys, total } = await surveyModel.findSurveys({ page: parseInt(page, 10), limit: parseInt(limit, 10), status, exclude_feedback });

        res.json({ surveys, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, pages: Math.ceil(total / limit) } });
    } catch (err) {
        next(err);
    }
};

// Get survey by ID with questions
const getSurveyById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const identifier = String(id || '').trim().toLowerCase();
        const survey = await surveyModel.getSurveyByIdentifier(identifier);
        if (!survey) return res.status(404).json({ error: 'Survey not found' });
        return res.json({ survey });
    } catch (err) {
        return next(err);
    }
};

// Create survey (admin only)
const createSurvey = async (req, res, next) => {
    try {
        const {
            title,
            description,
            allow_multiple_submissions,
            is_anonymous,
            collect_email,
            expiry_date,
            submission_email_subject,
            submission_email_body,
            submission_email_attachments,
        } = req.body;

        if (!title) {
            return res.status(400).json({
                error: 'Title is required',
            });
        }

        const survey = await surveyModel.createSurvey({ title, description, allow_multiple_submissions, is_anonymous, collect_email, expiry_date, submission_email_subject, submission_email_body, submission_email_attachments }, req.user.userId);
        return res.status(201).json({ message: 'Survey created successfully', survey });
    } catch (err) {
        return next(err);
    }
};

// Update survey (admin only)
const updateSurvey = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            status,
            allow_multiple_submissions,
            is_anonymous,
            collect_email,
            expiry_date,
            submission_email_subject,
            submission_email_body,
            submission_email_attachments,
        } = req.body;

        const updated = await surveyModel.updateSurvey(id, { title, description, status, allow_multiple_submissions, is_anonymous, collect_email, expiry_date, submission_email_subject, submission_email_body, submission_email_attachments });
        if (updated && updated.error === 'feedback_must_remain_published') return res.status(400).json({ error: 'Feedback surveys must remain published' });
        if (!updated) return res.status(404).json({ error: 'Survey not found' });
        return res.json({ message: 'Survey updated successfully', survey: updated });
    } catch (err) {
        return next(err);
    }
};

const uploadSurveyEmailAttachments = async (req, res, next) => {
    try {
        const files = Array.isArray(req.files) ? req.files : [];

        if (files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const attachments = files.map((file) => ({
            name: file.originalname,
            path: `/uploads/survey-email-attachments/${path.basename(file.path)}`,
            url: `${req.protocol}://${req.get('host')}/uploads/survey-email-attachments/${path.basename(file.path)}`,
            size: file.size,
            mimeType: file.mimetype,
        }));

        return res.status(201).json({
            message: 'Attachments uploaded successfully',
            attachments,
        });
    } catch (err) {
        return next(err);
    }
};

// Delete survey (admin only)
const deleteSurvey = async (req, res, next) => {
    try {
        const { id } = req.params;

        const deleted = await surveyModel.deleteSurvey(id);
        if (!deleted) return res.status(404).json({ error: 'Survey not found' });

        return res.json({
            message: 'Survey deleted successfully',
        });
    } catch (err) {
        return next(err);
    }
};

// Add question to survey
const addQuestion = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const { question_text, question_type, is_required, order_index, description, help_text } = req.body;

        if (!question_text || !question_type) {
            return res.status(400).json({
                error: 'question_text and question_type are required',
            });
        }

        if (!ALLOWED_QUESTION_TYPES.has(question_type)) {
            return res.status(400).json({
                error: 'Invalid question_type',
            });
        }

        const question = await surveyModel.addQuestion(surveyId, { question_text, question_type, is_required, order_index, description, help_text });
        return res.status(201).json({ message: 'Question added successfully', question });
    } catch (err) {
        return next(err);
    }
};

// Add options to question
const addOption = async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const { option_text, order_index } = req.body;

        if (!option_text) {
            return res.status(400).json({
                error: 'option_text is required',
            });
        }

        const option = await surveyModel.addOption(questionId, { option_text, order_index });
        return res.status(201).json({ message: 'Option added successfully', option });
    } catch (err) {
        return next(err);
    }
};

// Update question
const updateQuestion = async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const { question_text, question_type, is_required, order_index, description, help_text } = req.body;

        if (question_type && !ALLOWED_QUESTION_TYPES.has(question_type)) {
            return res.status(400).json({
                error: 'Invalid question_type',
            });
        }

        const updated = await surveyModel.updateQuestion(questionId, { question_text, question_type, is_required, order_index, description, help_text });
        if (!updated) return res.status(404).json({ error: 'Question not found' });
        return res.json({ message: 'Question updated successfully', question: updated });
    } catch (err) {
        return next(err);
    }
};

// Delete question
const deleteQuestion = async (req, res, next) => {
    try {
        const { questionId } = req.params;

        const deleted = await surveyModel.deleteQuestion(questionId);
        if (!deleted) return res.status(404).json({ error: 'Question not found' });
        return res.json({ message: 'Question deleted successfully' });
    } catch (err) {
        return next(err);
    }
};

// Update option
const updateOption = async (req, res, next) => {
    try {
        const { optionId } = req.params;
        const { option_text, order_index } = req.body;

        const updated = await surveyModel.updateOption(optionId, { option_text, order_index });
        if (!updated) return res.status(404).json({ error: 'Option not found' });
        return res.json({ message: 'Option updated successfully', option: updated });
    } catch (err) {
        return next(err);
    }
};

// Delete option
const deleteOption = async (req, res, next) => {
    try {
        const { optionId } = req.params;

        const deleted = await surveyModel.deleteOption(optionId);
        if (!deleted) return res.status(404).json({ error: 'Option not found' });
        return res.json({ message: 'Option deleted successfully' });
    } catch (err) {
        return next(err);
    }
};

// Autosave survey draft
const autosaveSurvey = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, questions, settings } = req.body;
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const saved = await surveyModel.autosaveSurvey(id, userId, { title, description, questions, settings });
        if (saved && saved.error === 'not_found') return res.status(404).json({ error: 'Survey not found' });
        return res.json({ message: 'Draft saved successfully', draft: saved });
    } catch (err) {
        return next(err);
    }
};

// Update survey settings
const updateSurveySettings = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { allow_multiple_submissions, is_anonymous, collect_email, expiry_date } = req.body;
        const updated = await surveyModel.updateSurveySettings(id, { allow_multiple_submissions, is_anonymous, collect_email, expiry_date });
        if (!updated) return res.status(404).json({ error: 'Survey not found' });
        return res.json({ message: 'Survey settings updated', survey: updated });
    } catch (err) {
        return next(err);
    }
};

// Check if user already submitted survey
const checkUserSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;
        const hasSubmitted = await surveyModel.checkUserSubmission(id, userId);
        return res.json({ hasSubmitted });
    } catch (err) {
        return next(err);
    }
};

// Get survey responses with pagination
const getSurveyResponses = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await surveyModel.getSurveyResponses(id, page, limit);
        return res.json(result);
    } catch (err) {
        return next(err);
    }
};

module.exports = {
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
    autosaveSurvey,
    updateSurveySettings,
    checkUserSubmission,
    getSurveyResponses,
};
