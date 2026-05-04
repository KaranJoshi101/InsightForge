const pool = require('../config/database');
const { generateUniqueSlug } = require('../utils/slug');

const findSurveys = async ({ page = 1, limit = 10, status, exclude_feedback } = {}) => {
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

    if (String(exclude_feedback || '').toLowerCase() === 'true') {
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
    const normalizedSurveys = surveys.rows.map((survey) => ({ ...survey, status: survey.effective_status || survey.status }));

    return { surveys: normalizedSurveys, total };
};

const getSurveyByIdentifier = async (identifier) => {
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

    if (surveyResult.rows.length === 0) return null;
    const survey = surveyResult.rows[0];

    const questionsResult = await pool.query(`SELECT q.* FROM questions q WHERE q.survey_id = $1 ORDER BY q.order_index`, [survey.id]);
    const optionsResult = await pool.query(`SELECT o.* FROM options o JOIN questions q ON q.id = o.question_id WHERE q.survey_id = $1 ORDER BY o.order_index`, [survey.id]);

    const optionsByQuestionId = optionsResult.rows.reduce((acc, option) => {
        const list = acc.get(option.question_id) || [];
        list.push(option);
        acc.set(option.question_id, list);
        return acc;
    }, new Map());

    survey.status = survey.effective_status || survey.status;
    survey.questions = questionsResult.rows.map((question) => ({ ...question, options: optionsByQuestionId.get(question.id) || [] }));

    return survey;
};

const createSurvey = async (fields, userId) => {
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
    } = fields;

    const result = await pool.query(
        `INSERT INTO surveys
             (title, slug, description, created_by, status, allow_multiple_submissions, is_anonymous, collect_email, expiry_date, submission_email_subject, submission_email_body, submission_email_attachments)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
             RETURNING *`,
        [
            title,
            await generateUniqueSlug(pool, 'surveys', title),
            description || null,
            userId,
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

    return result.rows[0];
};

const updateSurvey = async (id, fields) => {
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
    } = fields;

    const f = [];
    const v = [];
    let idx = 1;

    if (title !== undefined) {
        f.push(`title = $${idx++}`); v.push(title);
        f.push(`slug = $${idx++}`); v.push(await generateUniqueSlug(pool, 'surveys', title, id));
    }
    if (description !== undefined) { f.push(`description = $${idx++}`); v.push(description); }

    if (status !== undefined) {
        if (status === 'draft') {
            const feedbackCheck = await pool.query('SELECT 1 FROM media_posts WHERE survey_id = $1 LIMIT 1', [id]);
            if (feedbackCheck.rows.length > 0) return { error: 'feedback_must_remain_published' };
        }
        f.push(`status = $${idx++}`); v.push(status);
    }

    if (submission_email_subject !== undefined) { f.push(`submission_email_subject = $${idx++}`); v.push(submission_email_subject); }
    if (submission_email_body !== undefined) { f.push(`submission_email_body = $${idx++}`); v.push(submission_email_body); }
    if (submission_email_attachments !== undefined) { f.push(`submission_email_attachments = $${idx++}::jsonb`); v.push(JSON.stringify(Array.isArray(submission_email_attachments) ? submission_email_attachments : [])); }
    if (allow_multiple_submissions !== undefined) { f.push(`allow_multiple_submissions = $${idx++}`); v.push(Boolean(allow_multiple_submissions)); }
    if (is_anonymous !== undefined) { f.push(`is_anonymous = $${idx++}`); v.push(Boolean(is_anonymous)); }
    if (collect_email !== undefined) { f.push(`collect_email = $${idx++}`); v.push(Boolean(collect_email)); }
    if (expiry_date !== undefined) { f.push(`expiry_date = $${idx++}`); v.push(expiry_date || null); }

    if (f.length === 0) return { error: 'no_fields' };

    f.push('updated_at = NOW()'); v.push(id);

    const result = await pool.query(`UPDATE surveys SET ${f.join(', ')} WHERE id = $${idx} RETURNING *`, v);
    if (result.rows.length === 0) return null;
    return result.rows[0];
};

const deleteSurvey = async (id) => {
    const result = await pool.query('DELETE FROM surveys WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
};

const addQuestion = async (surveyId, fields) => {
    const { question_text, question_type, is_required, order_index, description, help_text } = fields;
    const res = await pool.query(
        `INSERT INTO questions (survey_id, question_text, question_type, is_required, order_index, description, help_text) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [surveyId, question_text, question_type, is_required !== false, order_index || 1, description || null, help_text || null]
    );
    return res.rows[0];
};

const addOption = async (questionId, fields) => {
    const { option_text, order_index } = fields;
    const res = await pool.query('INSERT INTO options (question_id, option_text, order_index) VALUES ($1,$2,$3) RETURNING *', [questionId, option_text, order_index || 1]);
    return res.rows[0];
};

const updateQuestion = async (questionId, fields) => {
    const { question_text, question_type, is_required, order_index, description, help_text } = fields;
    const res = await pool.query(`UPDATE questions SET question_text = COALESCE($1, question_text), question_type = COALESCE($2, question_type), is_required = COALESCE($3, is_required), order_index = COALESCE($4, order_index), description = COALESCE($5, description), help_text = COALESCE($6, help_text), updated_at = NOW() WHERE id = $7 RETURNING *`, [question_text, question_type, is_required, order_index, description, help_text, questionId]);
    return res.rows[0] || null;
};

const deleteQuestion = async (questionId) => {
    const res = await pool.query('DELETE FROM questions WHERE id = $1 RETURNING id', [questionId]);
    return res.rows[0] || null;
};

const updateOption = async (optionId, fields) => {
    const { option_text, order_index } = fields;
    const res = await pool.query(`UPDATE options SET option_text = COALESCE($1, option_text), order_index = COALESCE($2, order_index) WHERE id = $3 RETURNING *`, [option_text, order_index, optionId]);
    return res.rows[0] || null;
};

const deleteOption = async (optionId) => {
    const res = await pool.query('DELETE FROM options WHERE id = $1 RETURNING id', [optionId]);
    return res.rows[0] || null;
};

const autosaveSurvey = async (id, userId, fields) => {
    const { title, description, questions, settings } = fields;
    const check = await pool.query('SELECT id FROM surveys WHERE id = $1', [id]);
    if (check.rows.length === 0) return { error: 'not_found' };

    const updateResult = await pool.query(`UPDATE survey_drafts SET title = $3, description = $4, questions = $5, survey_settings = $6, updated_at = NOW() WHERE survey_id = $1 AND user_id = $2 RETURNING id, updated_at`, [id, userId, title, description, JSON.stringify(questions || []), JSON.stringify(settings || {})]);
    if (updateResult.rows.length > 0) return updateResult.rows[0];

    const insertResult = await pool.query(`INSERT INTO survey_drafts (survey_id, user_id, title, description, questions, survey_settings, updated_at) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING id, updated_at`, [id, userId, title, description, JSON.stringify(questions || []), JSON.stringify(settings || {})]);
    return insertResult.rows[0];
};

const updateSurveySettings = async (id, fields) => {
    const { allow_multiple_submissions, is_anonymous, collect_email, expiry_date } = fields;
    const res = await pool.query(`UPDATE surveys SET allow_multiple_submissions = COALESCE($1, allow_multiple_submissions), is_anonymous = COALESCE($2, is_anonymous), collect_email = COALESCE($3, collect_email), expiry_date = COALESCE($4, expiry_date), updated_at = NOW() WHERE id = $5 RETURNING *`, [allow_multiple_submissions, is_anonymous, collect_email, expiry_date, id]);
    return res.rows[0] || null;
};

const checkUserSubmission = async (surveyId, userId) => {
    if (!userId) return false;
    const res = await pool.query(`SELECT COUNT(*) as count FROM responses WHERE survey_id = $1 AND user_id = $2`, [surveyId, userId]);
    return parseInt(res.rows[0].count, 10) > 0;
};

const getSurveyResponses = async (surveyId, page = 1, limit = 20) => {
    const offset = (page - 1) * limit;
    const countResult = await pool.query('SELECT COUNT(*) FROM responses WHERE survey_id = $1', [surveyId]);
    const total = parseInt(countResult.rows[0].count, 10);
    const result = await pool.query(`SELECT r.*, u.username, u.email FROM responses r LEFT JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3`, [surveyId, limit, offset]);
    return { data: result.rows, pagination: { total, page: parseInt(page, 10), limit: parseInt(limit, 10), pages: Math.ceil(total / limit) } };
};

module.exports = {
    findSurveys,
    getSurveyByIdentifier,
    createSurvey,
    updateSurvey,
    deleteSurvey,
    addQuestion,
    addOption,
    updateQuestion,
    deleteQuestion,
    updateOption,
    deleteOption,
    autosaveSurvey,
    updateSurveySettings,
    checkUserSubmission,
    getSurveyResponses,
};
