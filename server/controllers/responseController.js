// Response Controller (Survey Responses and Answers)
const pool = require('../config/database');
const ExcelJS = require('exceljs');
const { sendSurveySubmissionEmail } = require('../utils/mailer');

// Submit survey response
const responseModel = require('../models/responseModel');
const submitResponse = async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { survey_id, answers } = req.body;
        const user_id = req.user.userId;
        if (!survey_id || !answers || !Array.isArray(answers)) return res.status(400).json({ error: 'survey_id and answers array are required' });

        const result = await responseModel.submitResponse(client, { survey_id, user_id, answers });
        if (result.error) {
            await client.query('ROLLBACK');
            if (result.error === 'survey_not_found') return res.status(404).json({ error: 'Survey not found' });
            if (result.error === 'expired') return res.status(400).json({ error: 'This survey has expired and no longer accepts responses' });
            if (result.error === 'already_submitted') return res.status(409).json({ error: 'You have already submitted a response for this survey' });
            if (result.error === 'invalid_question') return res.status(400).json({ error: `Invalid question_id: ${result.question_id}` });
            if (result.error === 'invalid_text') return res.status(400).json({ error: 'text_only questions accept letters and spaces only' });
            if (result.error === 'invalid_number') return res.status(400).json({ error: 'number_only questions accept numeric values only' });
            return res.status(400).json({ error: 'Invalid submission' });
        }

        await client.query('COMMIT');

        // send email
        const { survey } = result;
        const userProfile = await responseModel.getUserBasicProfile(client, user_id) || {};
        if (userProfile.email) {
            sendSurveySubmissionEmail({
                to: userProfile.email,
                userName: userProfile.name,
                surveyTitle: survey.title,
                submittedAt: new Date(),
                templateSubject: survey.submission_email_subject,
                templateBody: survey.submission_email_body,
                templateAttachments: survey.submission_email_attachments,
            }).catch((mailErr) => console.warn(`⚠️ Survey submission email failed for user ${user_id}: ${mailErr.message}`));
        }

        res.status(201).json({ message: 'Response submitted successfully', response_id: result.response_id });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

// Get current user's responses across all surveys
const getUserResponses = async (req, res, next) => {
    try {
        const user_id = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        const result = await responseModel.getUserResponses(user_id, { page, limit });
        res.json({ responses: result.responses, pagination: result.pagination });
    } catch (err) {
        next(err);
    }
};

// Get responses for a survey (admin only)
const getSurveyResponses = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const result = await responseModel.getSurveyResponses(surveyId, { page, limit });
        if (result.error === 'survey_not_found') return res.status(404).json({ error: 'Survey not found' });
        res.json({ responses: result.responses, pagination: result.pagination });
    } catch (err) {
        next(err);
    }
};

// Get response details with answers
const getResponseDetails = async (req, res, next) => {
    try {
        const { responseId } = req.params;
        const isAdmin = req.user.role === 'admin';
        const response = await responseModel.getResponseDetails(responseId, req.user.userId, isAdmin);
        if (!response) return res.status(404).json({ error: 'Response not found' });
        res.json({ response });
    } catch (err) {
        next(err);
    }
};

// Get analytics for a survey
const getSurveyAnalytics = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const result = await responseModel.getSurveyAnalytics(surveyId);
        if (result.error === 'survey_not_found') return res.status(404).json({ error: 'Survey not found' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// Export raw survey responses as Excel file (admin only)
const exportSurveyResponses = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const result = await responseModel.exportSurveyResponses(surveyId);
        if (result.error === 'survey_not_found') return res.status(404).json({ error: 'Survey not found' });

        const { survey, questions, rows } = result;

        // Group answers by response_id
        const responsesMap = new Map();
        for (const row of rows) {
            if (!responsesMap.has(row.response_id)) {
                responsesMap.set(row.response_id, {
                    user_name: row.user_name || 'Anonymous',
                    user_email: row.user_email || 'N/A',
                    submitted_at: row.submitted_at,
                    answers: {},
                });
            }
            const answer = row.option_text || row.answer_text || '';
            const existing = responsesMap.get(row.response_id).answers[row.question_id];
            responsesMap.get(row.response_id).answers[row.question_id] = existing ? `${existing}, ${answer}` : answer;
        }

        // Build Excel workbook
        const workbook = new ExcelJS.Workbook();
        const sheetName = survey.title.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        const columns = [
            { header: 'Respondent Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Submitted At', key: 'submitted_at', width: 22 },
        ];

        questions.forEach((q) => {
            columns.push({ header: q.question_text, key: `q_${q.id}`, width: 30 });
        });

        worksheet.columns = columns;

        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003594' } };
        headerRow.alignment = { vertical: 'middle', wrapText: true };

        for (const [, resp] of responsesMap) {
            const row = { name: resp.user_name, email: resp.user_email, submitted_at: new Date(resp.submitted_at).toLocaleString() };
            questions.forEach((q) => { row[`q_${q.id}`] = resp.answers[q.id] || ''; });
            worksheet.addRow(row);
        }

        const filename = `${survey.title.replace(/[^a-zA-Z0-9 ]/g, '')}-responses.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};

// Get demographic analytics for a survey's respondents (admin only)
const getSurveyDemographics = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const result = await responseModel.getSurveyDemographics(surveyId);
        if (result.error === 'survey_not_found') return res.status(404).json({ error: 'Survey not found' });
        res.json(result);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    submitResponse,
    getUserResponses,
    getSurveyResponses,
    getResponseDetails,
    getSurveyAnalytics,
    exportSurveyResponses,
    getSurveyDemographics,
};
