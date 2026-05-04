const pool = require('../config/database');

async function submitResponse(client, { survey_id, user_id, answers }) {
    const conn = client || pool;

    const surveyResult = await conn.query(
        `SELECT id, title, allow_multiple_submissions, expiry_date, submission_email_subject, submission_email_body, submission_email_attachments FROM surveys WHERE id = $1`,
        [survey_id]
    );
    if (surveyResult.rows.length === 0) return { error: 'survey_not_found' };
    const survey = surveyResult.rows[0];

    if (survey.expiry_date && new Date(survey.expiry_date) < new Date()) return { error: 'expired' };

    if (!survey.allow_multiple_submissions) {
        const existing = await conn.query('SELECT id FROM responses WHERE survey_id = $1 AND user_id = $2', [survey_id, user_id]);
        if (existing.rows.length > 0) return { error: 'already_submitted' };
    }

    const responseResult = await conn.query('INSERT INTO responses (survey_id, user_id, submitted_at) VALUES ($1, $2, NOW()) RETURNING id', [survey_id, user_id]);
    const response_id = responseResult.rows[0].id;

    const questionsResult = await conn.query('SELECT id, question_type FROM questions WHERE survey_id = $1', [survey_id]);
    const questionTypeById = new Map(questionsResult.rows.map((q) => [q.id, q.question_type]));

    for (const answer of answers) {
        const { question_id, answer_text, option_id } = answer;
        const questionType = questionTypeById.get(question_id);
        if (!questionType) return { error: 'invalid_question', question_id };
        if (questionType === 'text_only' && answer_text && !/^[A-Za-z\s]+$/.test(String(answer_text).trim())) return { error: 'invalid_text' };
        if (questionType === 'number_only' && answer_text && Number.isNaN(Number(answer_text))) return { error: 'invalid_number' };

        await conn.query('INSERT INTO answers (response_id, question_id, answer_text, option_id) VALUES ($1, $2, $3, $4)', [response_id, question_id, answer_text || null, option_id || null]);
    }

    return { response_id, survey };
}

async function getUserResponses(user_id, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const responsesResult = await pool.query(
        `SELECT r.id, r.survey_id, s.title AS survey_title, r.submitted_at
            FROM responses r
            JOIN surveys s ON r.survey_id = s.id
            WHERE r.user_id = $1
            ORDER BY r.submitted_at DESC
            LIMIT $2 OFFSET $3`,
        [user_id, limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*) FROM responses WHERE user_id = $1', [user_id]);
    const total = parseInt(countResult.rows[0].count, 10);
    return { responses: responsesResult.rows, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, pages: Math.ceil(total / limit) } };
}

async function getSurveyResponses(surveyId, { page = 1, limit = 10 } = {}) {
    const offset = (page - 1) * limit;
    const surveyResult = await pool.query('SELECT id, is_anonymous, collect_email, title FROM surveys WHERE id = $1', [surveyId]);
    if (surveyResult.rows.length === 0) return { error: 'survey_not_found' };

    const responsesResult = await pool.query('SELECT r.id, r.survey_id, r.user_id, u.name AS user_name, u.email AS user_email, r.submitted_at FROM responses r LEFT JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 ORDER BY r.submitted_at DESC LIMIT $2 OFFSET $3', [surveyId, limit, offset]);
    const countResult = await pool.query('SELECT COUNT(*) FROM responses WHERE survey_id = $1', [surveyId]);
    const responseIds = responsesResult.rows.map((r) => r.id);

    let answersByResponseId = new Map();
    if (responseIds.length > 0) {
        const answersResult = await pool.query(`SELECT a.response_id, a.id, a.question_id, q.order_index, q.question_text, q.question_type, a.answer_text, o.option_text FROM answers a JOIN questions q ON a.question_id = q.id LEFT JOIN options o ON a.option_id = o.id WHERE a.response_id = ANY($1::int[]) ORDER BY a.response_id, q.order_index, a.id`, [responseIds]);
        answersByResponseId = answersResult.rows.reduce((map, row) => {
            if (!map.has(row.response_id)) map.set(row.response_id, new Map());
            const qmap = map.get(row.response_id);
            const existing = qmap.get(row.question_id);
            if (!existing) qmap.set(row.question_id, { id: row.id, question_id: row.question_id, question_text: row.question_text, question_type: row.question_type, order_index: row.order_index, answer_text: row.answer_text, option_text: row.option_text });
            else if (row.question_type === 'checkbox' && row.option_text) existing.option_text = existing.option_text ? `${existing.option_text}, ${row.option_text}` : row.option_text;
            return map;
        }, new Map());
    }

    const surveyConfig = surveyResult.rows[0];
    const responses = responsesResult.rows.map((response) => {
        const qmap = answersByResponseId.get(response.id);
        const answers = qmap ? Array.from(qmap.values()).sort((l, r) => l.order_index - r.order_index) : [];
        const userName = surveyConfig.is_anonymous ? null : response.user_name;
        const userEmail = (surveyConfig.is_anonymous || !surveyConfig.collect_email) ? null : response.user_email;
        return { ...response, user_name: userName, user_email: userEmail, answers };
    });

    return { responses, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total: parseInt(countResult.rows[0].count, 10) } };
}

async function getResponseDetails(responseId, userId, isAdmin) {
    const responseResult = await pool.query(`SELECT r.id, r.survey_id, r.user_id, u.name, u.email, s.title AS survey_title, s.is_anonymous, s.collect_email, r.submitted_at FROM responses r LEFT JOIN users u ON r.user_id = u.id JOIN surveys s ON r.survey_id = s.id WHERE r.id = $1 AND ($2::boolean = true OR r.user_id = $3)`, [responseId, isAdmin, userId]);
    if (responseResult.rows.length === 0) return null;
    const answersResult = await pool.query(`SELECT a.id, a.question_id, q.order_index, q.question_text, q.question_type, a.answer_text, a.option_id, o.option_text FROM answers a JOIN questions q ON a.question_id = q.id LEFT JOIN options o ON a.option_id = o.id WHERE a.response_id = $1 ORDER BY q.order_index`, [responseId]);
    const response = responseResult.rows[0];
    if (response.is_anonymous) { response.name = null; response.email = null; } else if (!response.collect_email) { response.email = null; }

    const answersMap = new Map();
    for (const row of answersResult.rows) {
        const existing = answersMap.get(row.question_id);
        if (!existing) answersMap.set(row.question_id, { id: row.id, question_id: row.question_id, order_index: row.order_index, question_text: row.question_text, question_type: row.question_type, answer_text: row.answer_text, option_id: row.option_id, option_text: row.option_text });
        else if (row.question_type === 'checkbox' && row.option_text) existing.option_text = existing.option_text ? `${existing.option_text}, ${row.option_text}` : row.option_text;
    }

    response.answers = Array.from(answersMap.values()).sort((l, r) => l.order_index - r.order_index);
    return response;
}

async function getSurveyAnalytics(surveyId) {
    const surveyResult = await pool.query('SELECT id, title FROM surveys WHERE id = $1', [surveyId]);
    if (surveyResult.rows.length === 0) return { error: 'survey_not_found' };

    const totalResult = await pool.query('SELECT COUNT(*) as total FROM responses WHERE survey_id = $1', [surveyId]);
    const uniqueUsersResult = await pool.query('SELECT COUNT(DISTINCT user_id) as unique_users FROM responses WHERE survey_id = $1', [surveyId]);
    const questionsResult = await pool.query('SELECT id, question_text, question_type, order_index FROM questions WHERE survey_id = $1 ORDER BY order_index', [surveyId]);

    const analytics = [];
    for (const question of questionsResult.rows) {
        const qa = { id: question.id, question_text: question.question_text, question_type: question.question_type };
        if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox') {
            const optionCountsResult = await pool.query(`SELECT o.id as option_id, o.option_text, COUNT(a.id) as count FROM options o LEFT JOIN answers a ON a.option_id = o.id AND a.response_id IN (SELECT id FROM responses WHERE survey_id = $1) WHERE o.question_id = $2 GROUP BY o.id, o.option_text, o.order_index ORDER BY o.order_index`, [surveyId, question.id]);
            const totalAnswered = optionCountsResult.rows.reduce((s, r) => s + parseInt(r.count, 10), 0);
            qa.total_answered = totalAnswered;
            qa.option_counts = optionCountsResult.rows.map(r => ({ option_id: r.option_id, option_text: r.option_text, count: parseInt(r.count, 10), percentage: totalAnswered > 0 ? Math.round((parseInt(r.count, 10) / totalAnswered) * 100) : 0 }));
        } else if (question.question_type === 'rating') {
            const ratingResult = await pool.query(`SELECT a.answer_text as rating, COUNT(*) as count FROM answers a JOIN responses r ON a.response_id = r.id WHERE a.question_id = $1 AND r.survey_id = $2 AND a.answer_text IS NOT NULL GROUP BY a.answer_text ORDER BY a.answer_text`, [question.id, surveyId]);
            const distribution = [1,2,3,4,5].map(rating => { const found = ratingResult.rows.find(rr => rr.rating === String(rating)); return { rating, count: found ? parseInt(found.count, 10) : 0 }; });
            const totalRatings = distribution.reduce((s, d) => s + d.count, 0);
            const sumRatings = distribution.reduce((s, d) => s + (d.rating * d.count), 0);
            qa.total_answered = totalRatings;
            qa.rating_distribution = distribution;
            qa.average_rating = totalRatings > 0 ? Math.round((sumRatings / totalRatings) * 10) / 10 : 0;
        } else if (question.question_type === 'text') {
            const textResult = await pool.query(`SELECT a.answer_text, u.name as user_name, r.user_id FROM answers a JOIN responses r ON a.response_id = r.id LEFT JOIN users u ON r.user_id = u.id WHERE a.question_id = $1 AND r.survey_id = $2 AND a.answer_text IS NOT NULL AND a.answer_text != '' ORDER BY r.submitted_at DESC`, [question.id, surveyId]);
            qa.total_answered = textResult.rows.length;
            qa.text_responses = textResult.rows.map(row => ({ answer_text: row.answer_text, user_name: row.user_name || 'Anonymous', user_id: row.user_id }));
        }
        analytics.push(qa);
    }

    return { survey_id: parseInt(surveyId, 10), survey_title: surveyResult.rows[0].title, total_responses: parseInt(totalResult.rows[0].total, 10), unique_users: parseInt(uniqueUsersResult.rows[0].unique_users, 10), analytics };
}

async function exportSurveyResponses(surveyId) {
    const surveyResult = await pool.query('SELECT id, title FROM surveys WHERE id = $1', [surveyId]);
    if (surveyResult.rows.length === 0) return { error: 'survey_not_found' };

    const questionsResult = await pool.query('SELECT id, question_text, question_type, order_index FROM questions WHERE survey_id = $1 ORDER BY order_index', [surveyId]);
    const rawResult = await pool.query(`SELECT r.id AS response_id, u.name AS user_name, u.email AS user_email, r.submitted_at, a.question_id, a.answer_text, o.option_text FROM responses r LEFT JOIN users u ON r.user_id = u.id JOIN answers a ON a.response_id = r.id LEFT JOIN options o ON a.option_id = o.id WHERE r.survey_id = $1 ORDER BY r.submitted_at, a.question_id`, [surveyId]);

    return { survey: surveyResult.rows[0], questions: questionsResult.rows, rows: rawResult.rows };
}

async function getSurveyDemographics(surveyId) {
    const surveyResult = await pool.query('SELECT id, title FROM surveys WHERE id = $1', [surveyId]);
    if (surveyResult.rows.length === 0) return { error: 'survey_not_found' };

    const genderResult = await pool.query(`SELECT u.gender, COUNT(*)::int AS count FROM responses r JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 AND u.gender IS NOT NULL AND u.gender != '' GROUP BY u.gender ORDER BY count DESC`, [surveyId]);
    const ageResult = await pool.query(`SELECT CASE WHEN u.age < 18 THEN 'Under 18' WHEN u.age BETWEEN 18 AND 24 THEN '18-24' WHEN u.age BETWEEN 25 AND 34 THEN '25-34' WHEN u.age BETWEEN 35 AND 44 THEN '35-44' WHEN u.age BETWEEN 45 AND 54 THEN '45-54' ELSE '55+' END AS age_group, COUNT(*)::int AS count FROM responses r JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 AND u.age IS NOT NULL GROUP BY age_group ORDER BY MIN(u.age)`, [surveyId]);
    const locationResult = await pool.query(`SELECT u.location, COUNT(*)::int AS count FROM responses r JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 AND u.location IS NOT NULL AND u.location != '' GROUP BY u.location ORDER BY count DESC LIMIT 10`, [surveyId]);

    return { gender_distribution: genderResult.rows, age_distribution: ageResult.rows, location_distribution: locationResult.rows };
}

async function getUserBasicProfile(conn, userId) {
    const runner = conn || pool;
    const result = await runner.query('SELECT name, email FROM users WHERE id = $1', [userId]);
    return result.rows[0] || null;
}

module.exports = {
    submitResponse,
    getUserResponses,
    getSurveyResponses,
    getResponseDetails,
    getSurveyAnalytics,
    exportSurveyResponses,
    getSurveyDemographics,
    getUserBasicProfile,
};
