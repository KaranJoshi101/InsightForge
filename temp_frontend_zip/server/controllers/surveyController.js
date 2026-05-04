// Survey Controller
const pool = require('../config/database');
const path = require('path');
const { generateUniqueSlug } = require('../utils/slug');

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

        const feedbackExistsSql = `EXISTS (
                        SELECT 1
                        FROM media_posts mp
                        WHERE mp.survey_id = s.id
                     )`;
        const effectiveStatusSql = `CASE
                        WHEN ${feedbackExistsSql} THEN 'published'::survey_status
                        ELSE s.status
                     END`;

        let query = `SELECT s.*, 
                (SELECT COUNT(*)::int FROM questions q WHERE q.survey_id = s.id) AS question_count,
                ${feedbackExistsSql} AS is_feedback,
                ${effectiveStatusSql}::text AS effective_status
                     FROM surveys s`;
        let countQuery = 'SELECT COUNT(*) FROM surveys s';
        const params = [];
        const whereClauses = [];

        if (status) {
            params.push(status);
            whereClauses.push(`${effectiveStatusSql}::text = $${params.length}`);
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
        const normalizedSurveys = surveys.rows.map((survey) => ({
            ...survey,
            status: survey.effective_status || survey.status,
        }));

        res.json({
            surveys: normalizedSurveys,
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
        const identifier = String(id || '').trim().toLowerCase();

        const surveyResult = await pool.query(
            `SELECT s.*, EXISTS (
                SELECT 1
                FROM media_posts mp
                WHERE mp.survey_id = s.id
             ) AS is_feedback,
             CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM media_posts mp
                    WHERE mp.survey_id = s.id
                ) THEN 'published'::survey_status
                ELSE s.status
             END::text AS effective_status
             FROM surveys s
             WHERE (s.slug = $1 OR s.id::text = $1)`,
            [identifier]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

        const survey = surveyResult.rows[0];

        const questionsResult = await pool.query(
            `SELECT q.*
             FROM questions q
             WHERE q.survey_id = $1
             ORDER BY q.order_index`,
            [survey.id]
        );

        const optionsResult = await pool.query(
            `SELECT o.*
             FROM options o
             JOIN questions q ON q.id = o.question_id
             WHERE q.survey_id = $1
             ORDER BY o.order_index`,
            [survey.id]
        );

        const optionsByQuestionId = optionsResult.rows.reduce((acc, option) => {
            const list = acc.get(option.question_id) || [];
            list.push(option);
            acc.set(option.question_id, list);
            return acc;
        }, new Map());

        survey.status = survey.effective_status || survey.status;
        survey.questions = questionsResult.rows.map((question) => ({
            ...question,
            options: optionsByQuestionId.get(question.id) || [],
        }));

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

        const result = await pool.query(
            `INSERT INTO surveys
             (title, slug, description, created_by, status, allow_multiple_submissions, is_anonymous, collect_email, expiry_date, submission_email_subject, submission_email_body, submission_email_attachments)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
             RETURNING *`,
            [
                title,
                await generateUniqueSlug(pool, 'surveys', title),
                description || null,
                req.user.userId,
                'draft',
                allow_multiple_submissions === true,
                is_anonymous === true,
                collect_email === true,
                expiry_date || null,
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
            allow_multiple_submissions,
            is_anonymous,
            collect_email,
            expiry_date,
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

            fields.push(`slug = $${idx++}`);
            values.push(await generateUniqueSlug(pool, 'surveys', title, id));
        }

        if (description !== undefined) {
            fields.push(`description = $${idx++}`);
            values.push(description);
        }

        if (status !== undefined) {
            if (status === 'draft') {
                const feedbackCheck = await pool.query(
                    'SELECT 1 FROM media_posts WHERE survey_id = $1 LIMIT 1',
                    [id]
                );

                if (feedbackCheck.rows.length > 0) {
                    return res.status(400).json({
                        error: 'Feedback surveys must remain published',
                    });
                }
            }
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

        if (allow_multiple_submissions !== undefined) {
            fields.push(`allow_multiple_submissions = $${idx++}`);
            values.push(Boolean(allow_multiple_submissions));
        }

        if (is_anonymous !== undefined) {
            fields.push(`is_anonymous = $${idx++}`);
            values.push(Boolean(is_anonymous));
        }

        if (collect_email !== undefined) {
            fields.push(`collect_email = $${idx++}`);
            values.push(Boolean(collect_email));
        }

        if (expiry_date !== undefined) {
            fields.push(`expiry_date = $${idx++}`);
            values.push(expiry_date || null);
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

        const result = await pool.query(
            `INSERT INTO questions
             (survey_id, question_text, question_type, is_required, order_index, description, help_text)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                surveyId,
                question_text,
                question_type,
                is_required !== false,
                order_index || 1,
                description || null,
                help_text || null,
            ]
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
        const { question_text, question_type, is_required, order_index, description, help_text } = req.body;

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
                 description = COALESCE($5, description),
                 help_text = COALESCE($6, help_text),
                 updated_at = NOW()
             WHERE id = $7
             RETURNING *`,
            [question_text, question_type, is_required, order_index, description, help_text, questionId]
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

// Autosave survey draft
const autosaveSurvey = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { title, description, questions, settings } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check if survey exists
        const surveyCheck = await pool.query('SELECT id FROM surveys WHERE id = $1', [id]);
        if (surveyCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Save to survey_drafts table without relying on DB-level unique constraints.
        const updateResult = await pool.query(
            `UPDATE survey_drafts
             SET title = $3,
                 description = $4,
                 questions = $5,
                 survey_settings = $6,
                 updated_at = NOW()
             WHERE survey_id = $1 AND user_id = $2
             RETURNING id, updated_at`,
            [id, userId, title, description, JSON.stringify(questions || []), JSON.stringify(settings || {})]
        );

        let result = updateResult;
        if (updateResult.rows.length === 0) {
            result = await pool.query(
                `INSERT INTO survey_drafts (survey_id, user_id, title, description, questions, survey_settings, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, NOW())
                 RETURNING id, updated_at`,
                [id, userId, title, description, JSON.stringify(questions || []), JSON.stringify(settings || {})]
            );
        }

        return res.json({
            message: 'Draft saved successfully',
            draft: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Update survey settings
const updateSurveySettings = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            allow_multiple_submissions,
            is_anonymous,
            collect_email,
            expiry_date,
        } = req.body;

        const result = await pool.query(
            `UPDATE surveys 
             SET allow_multiple_submissions = COALESCE($1, allow_multiple_submissions),
                 is_anonymous = COALESCE($2, is_anonymous),
                 collect_email = COALESCE($3, collect_email),
                 expiry_date = COALESCE($4, expiry_date),
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [allow_multiple_submissions, is_anonymous, collect_email, expiry_date, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        return res.json({
            message: 'Survey settings updated',
            survey: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

// Check if user already submitted survey
const checkUserSubmission = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId;

        if (!userId) {
            return res.json({ hasSubmitted: false });
        }

        const result = await pool.query(
            `SELECT COUNT(*) as count FROM responses 
             WHERE survey_id = $1 AND user_id = $2`,
            [id, userId]
        );

        const hasSubmitted = parseInt(result.rows[0].count, 10) > 0;

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
        const offset = (page - 1) * limit;

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM responses WHERE survey_id = $1',
            [id]
        );
        const total = parseInt(countResult.rows[0].count, 10);

        const result = await pool.query(
            `SELECT r.*, u.username, u.email 
             FROM responses r
             LEFT JOIN users u ON r.user_id = u.id
             WHERE r.survey_id = $1
             ORDER BY r.created_at DESC
             LIMIT $2 OFFSET $3`,
            [id, limit, offset]
        );

        return res.json({
            data: result.rows,
            pagination: {
                total,
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                pages: Math.ceil(total / limit),
            },
        });
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
