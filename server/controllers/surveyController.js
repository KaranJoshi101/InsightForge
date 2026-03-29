// Survey Controller
const pool = require('../config/database');
const path = require('path');

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
        const offset = (page - 1) * limit;

        let query = `SELECT s.*, 
                (SELECT COUNT(*)::int FROM questions q WHERE q.survey_id = s.id) AS question_count,
                EXISTS (
                        SELECT 1
                        FROM media_posts mp
                        WHERE mp.survey_id = s.id
                     ) AS is_feedback
                     FROM surveys s`;
        let countQuery = 'SELECT COUNT(*) FROM surveys s';
        const params = [];
        const whereClauses = [];

        if (status) {
            params.push(status);
            whereClauses.push(`s.status = $${params.length}`);
        }

        const shouldExcludeFeedback = String(exclude_feedback || '').toLowerCase() === 'true';
        if (shouldExcludeFeedback) {
            whereClauses.push(`NOT EXISTS (SELECT 1 FROM media_posts mp WHERE mp.survey_id = s.id)`);
        }

        if (whereClauses.length > 0) {
            const whereSql = ` WHERE ${whereClauses.join(' AND ')}`;
            query += whereSql;
            countQuery += whereSql;
        }

        query += ' ORDER BY s.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

        const surveys = await pool.query(query, [...params, limit, offset]);
        const countResult = await pool.query(countQuery, params);
        const total = parseInt(countResult.rows[0].count, 10);

        res.json({
            surveys: surveys.rows,
            pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get survey by ID with questions
const getSurveyById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const surveyResult = await pool.query(
            `SELECT s.*, EXISTS (
                SELECT 1
                FROM media_posts mp
                WHERE mp.survey_id = s.id
             ) AS is_feedback
             FROM surveys s
             WHERE s.id = $1`,
            [id]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

        const questionsResult = await pool.query(
            `SELECT q.*, json_agg(json_build_object('id', o.id, 'option_text', o.option_text, 'order_index', o.order_index)) as options
             FROM questions q
             LEFT JOIN options o ON q.id = o.question_id
             WHERE q.survey_id = $1
             GROUP BY q.id
             ORDER BY q.order_index`,
            [id]
        );

        const survey = surveyResult.rows[0];
        survey.questions = questionsResult.rows;

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
            submission_email_subject,
            submission_email_body,
            submission_email_attachments,
        } = req.body;

        if (!title) {
            return res.status(400).json({
                error: 'Title is required',
            });
        }

        const result = await pool.query(
            `INSERT INTO surveys
             (title, description, created_by, status, submission_email_subject, submission_email_body, submission_email_attachments)
             VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
             RETURNING *`,
            [
                title,
                description || null,
                req.user.userId,
                'draft',
                submission_email_subject || null,
                submission_email_body || null,
                JSON.stringify(Array.isArray(submission_email_attachments) ? submission_email_attachments : []),
            ]
        );

        return res.status(201).json({
            message: 'Survey created successfully',
            survey: result.rows[0],
        });
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
            submission_email_subject,
            submission_email_body,
            submission_email_attachments,
        } = req.body;

        const fields = [];
        const values = [];
        let idx = 1;

        if (title !== undefined) {
            fields.push(`title = $${idx++}`);
            values.push(title);
        }

        if (description !== undefined) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }

        if (status !== undefined) {
            fields.push(`status = $${idx++}`);
            values.push(status);
        }

        if (submission_email_subject !== undefined) {
            fields.push(`submission_email_subject = $${idx++}`);
            values.push(submission_email_subject);
        }

        if (submission_email_body !== undefined) {
            fields.push(`submission_email_body = $${idx++}`);
            values.push(submission_email_body);
        }

        if (submission_email_attachments !== undefined) {
            fields.push(`submission_email_attachments = $${idx++}::jsonb`);
            values.push(JSON.stringify(Array.isArray(submission_email_attachments) ? submission_email_attachments : []));
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        fields.push('updated_at = NOW()');
        values.push(id);

        const result = await pool.query(
            `UPDATE surveys SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
            values
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

        return res.json({
            message: 'Survey updated successfully',
            survey: result.rows[0],
        });
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

        const result = await pool.query(
            'DELETE FROM surveys WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

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
        const { question_text, question_type, is_required, order_index } = req.body;

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

        const result = await pool.query(
            'INSERT INTO questions (survey_id, question_text, question_type, is_required, order_index) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [surveyId, question_text, question_type, is_required !== false, order_index || 1]
        );

        return res.status(201).json({
            message: 'Question added successfully',
            question: result.rows[0],
        });
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

        const result = await pool.query(
            'INSERT INTO options (question_id, option_text, order_index) VALUES ($1, $2, $3) RETURNING *',
            [questionId, option_text, order_index || 1]
        );

        return res.status(201).json({
            message: 'Option added successfully',
            option: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Update question
const updateQuestion = async (req, res, next) => {
    try {
        const { questionId } = req.params;
        const { question_text, question_type, is_required, order_index } = req.body;

        if (question_type && !ALLOWED_QUESTION_TYPES.has(question_type)) {
            return res.status(400).json({
                error: 'Invalid question_type',
            });
        }

        const result = await pool.query(
            `UPDATE questions
             SET question_text = COALESCE($1, question_text),
                 question_type = COALESCE($2, question_type),
                 is_required = COALESCE($3, is_required),
                 order_index = COALESCE($4, order_index),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [question_text, question_type, is_required, order_index, questionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

        return res.json({
            message: 'Question updated successfully',
            question: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Delete question
const deleteQuestion = async (req, res, next) => {
    try {
        const { questionId } = req.params;

        const result = await pool.query(
            'DELETE FROM questions WHERE id = $1 RETURNING id',
            [questionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Question not found' });
        }

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

        const result = await pool.query(
            `UPDATE options
             SET option_text = COALESCE($1, option_text),
                 order_index = COALESCE($2, order_index)
             WHERE id = $3
             RETURNING *`,
            [option_text, order_index, optionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Option not found' });
        }

        return res.json({
            message: 'Option updated successfully',
            option: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Delete option
const deleteOption = async (req, res, next) => {
    try {
        const { optionId } = req.params;

        const result = await pool.query(
            'DELETE FROM options WHERE id = $1 RETURNING id',
            [optionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Option not found' });
        }

        return res.json({ message: 'Option deleted successfully' });
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
};
