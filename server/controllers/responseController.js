// Response Controller (Survey Responses and Answers)
const pool = require('../config/database');
const ExcelJS = require('exceljs');

// Submit survey response
const submitResponse = async (req, res, next) => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { survey_id, answers } = req.body;
        const user_id = req.user.userId;

        if (!survey_id || !answers || !Array.isArray(answers)) {
            return res.status(400).json({
                error: 'survey_id and answers array are required',
            });
        }

        // Check if survey exists
        const surveyResult = await client.query(
            'SELECT id FROM surveys WHERE id = $1',
            [survey_id]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

        // Check if user already submitted this survey
        const existingResponse = await client.query(
            'SELECT id FROM responses WHERE survey_id = $1 AND user_id = $2',
            [survey_id, user_id]
        );

        if (existingResponse.rows.length > 0) {
            return res.status(409).json({
                error: 'You have already submitted a response for this survey',
            });
        }

        // Create response record
        const responseResult = await client.query(
            'INSERT INTO responses (survey_id, user_id, submitted_at) VALUES ($1, $2, NOW()) RETURNING id',
            [survey_id, user_id]
        );

        const response_id = responseResult.rows[0].id;

        // Insert individual answers
        for (const answer of answers) {
            const { question_id, answer_text, option_id } = answer;

            await client.query(
                'INSERT INTO answers (response_id, question_id, answer_text, option_id) VALUES ($1, $2, $3, $4)',
                [response_id, question_id, answer_text || null, option_id || null]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Response submitted successfully',
            response_id,
        });
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

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM responses WHERE user_id = $1',
            [user_id]
        );

        const total = parseInt(countResult.rows[0].count);

        res.json({
            responses: responsesResult.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get responses for a survey (admin only)
const getSurveyResponses = async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const offset = (page - 1) * limit;

        // Check if survey exists
        const surveyResult = await pool.query(
            'SELECT id FROM surveys WHERE id = $1',
            [surveyId]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found',
            });
        }

        // Get responses
        const responsesResult = await pool.query(
            'SELECT r.id, r.survey_id, r.user_id, u.name AS user_name, u.email AS user_email, r.submitted_at FROM responses r LEFT JOIN users u ON r.user_id = u.id WHERE r.survey_id = $1 ORDER BY r.submitted_at DESC LIMIT $2 OFFSET $3',
            [surveyId, limit, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) FROM responses WHERE survey_id = $1',
            [surveyId]
        );

        const responseIds = responsesResult.rows.map((response) => response.id);
        let answersByResponseId = new Map();

        if (responseIds.length > 0) {
            const answersResult = await pool.query(
                `SELECT
                    a.response_id,
                    a.id,
                    a.question_id,
                    q.order_index,
                    q.question_text,
                    q.question_type,
                    a.answer_text,
                    o.option_text
                 FROM answers a
                 JOIN questions q ON a.question_id = q.id
                 LEFT JOIN options o ON a.option_id = o.id
                 WHERE a.response_id = ANY($1::int[])
                 ORDER BY a.response_id, q.order_index, a.id`,
                [responseIds]
            );

            answersByResponseId = answersResult.rows.reduce((responseMap, row) => {
                if (!responseMap.has(row.response_id)) {
                    responseMap.set(row.response_id, new Map());
                }

                const questionMap = responseMap.get(row.response_id);
                const existingAnswer = questionMap.get(row.question_id);

                if (!existingAnswer) {
                    questionMap.set(row.question_id, {
                        id: row.id,
                        question_id: row.question_id,
                        question_text: row.question_text,
                        question_type: row.question_type,
                        order_index: row.order_index,
                        answer_text: row.answer_text,
                        option_text: row.option_text,
                    });
                } else if (row.question_type === 'checkbox' && row.option_text) {
                    existingAnswer.option_text = existingAnswer.option_text
                        ? `${existingAnswer.option_text}, ${row.option_text}`
                        : row.option_text;
                }

                return responseMap;
            }, new Map());
        }

        const responses = responsesResult.rows.map((response) => {
            const questionMap = answersByResponseId.get(response.id);
            const answers = questionMap
                ? Array.from(questionMap.values()).sort((left, right) => left.order_index - right.order_index)
                : [];

            return {
                ...response,
                answers,
            };
        });

        res.json({
            responses,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: parseInt(countResult.rows[0].count),
            },
        });
    } catch (err) {
        next(err);
    }
};

// Get response details with answers
const getResponseDetails = async (req, res, next) => {
    try {
        const { responseId } = req.params;
        const isAdmin = req.user.role === 'admin';

        const responseResult = await pool.query(
            `SELECT r.id, r.survey_id, r.user_id, u.name, u.email, s.title AS survey_title, r.submitted_at
             FROM responses r
             LEFT JOIN users u ON r.user_id = u.id
             JOIN surveys s ON r.survey_id = s.id
             WHERE r.id = $1 AND ($2::boolean = true OR r.user_id = $3)`,
            [responseId, isAdmin, req.user.userId]
        );

        if (responseResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Response not found',
            });
        }

        const answersResult = await pool.query(
            `SELECT
                a.id,
                a.question_id,
                q.order_index,
                q.question_text,
                q.question_type,
                a.answer_text,
                a.option_id,
                o.option_text
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            LEFT JOIN options o ON a.option_id = o.id
            WHERE a.response_id = $1
            ORDER BY q.order_index`,
            [responseId]
        );

        const response = responseResult.rows[0];
        const answersMap = new Map();

        for (const row of answersResult.rows) {
            const existingAnswer = answersMap.get(row.question_id);

            if (!existingAnswer) {
                answersMap.set(row.question_id, {
                    id: row.id,
                    question_id: row.question_id,
                    order_index: row.order_index,
                    question_text: row.question_text,
                    question_type: row.question_type,
                    answer_text: row.answer_text,
                    option_id: row.option_id,
                    option_text: row.option_text,
                });
                continue;
            }

            if (row.question_type === 'checkbox' && row.option_text) {
                existingAnswer.option_text = existingAnswer.option_text
                    ? `${existingAnswer.option_text}, ${row.option_text}`
                    : row.option_text;
            }
        }

        response.answers = Array.from(answersMap.values()).sort(
            (left, right) => left.order_index - right.order_index
        );

        res.json({ response });
    } catch (err) {
        next(err);
    }
};

// Get analytics for a survey
const getSurveyAnalytics = async (req, res, next) => {
    try {
        const { surveyId } = req.params;

        // Verify survey exists and get title
        const surveyResult = await pool.query(
            'SELECT id, title FROM surveys WHERE id = $1',
            [surveyId]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Total responses
        const totalResult = await pool.query(
            'SELECT COUNT(*) as total FROM responses WHERE survey_id = $1',
            [surveyId]
        );
        const totalResponses = parseInt(totalResult.rows[0].total);

        // Unique respondents
        const uniqueUsersResult = await pool.query(
            'SELECT COUNT(DISTINCT user_id) as unique_users FROM responses WHERE survey_id = $1',
            [surveyId]
        );
        const uniqueUsers = parseInt(uniqueUsersResult.rows[0].unique_users);

        // Get all questions for this survey
        const questionsResult = await pool.query(
            'SELECT id, question_text, question_type, order_index FROM questions WHERE survey_id = $1 ORDER BY order_index',
            [surveyId]
        );

        // Build per-question analytics
        const analytics = [];

        for (const question of questionsResult.rows) {
            const questionAnalytics = {
                id: question.id,
                question_text: question.question_text,
                question_type: question.question_type,
            };

            if (question.question_type === 'multiple_choice' || question.question_type === 'checkbox') {
                // Count answers per option, including options with 0 answers
                const optionCountsResult = await pool.query(
                    `SELECT o.id as option_id, o.option_text,
                            COUNT(a.id) as count
                     FROM options o
                     LEFT JOIN answers a ON a.option_id = o.id
                         AND a.response_id IN (SELECT id FROM responses WHERE survey_id = $1)
                     WHERE o.question_id = $2
                     GROUP BY o.id, o.option_text, o.order_index
                     ORDER BY o.order_index`,
                    [surveyId, question.id]
                );

                const totalAnswered = optionCountsResult.rows.reduce(
                    (sum, row) => sum + parseInt(row.count), 0
                );

                questionAnalytics.total_answered = totalAnswered;
                questionAnalytics.option_counts = optionCountsResult.rows.map(row => ({
                    option_id: row.option_id,
                    option_text: row.option_text,
                    count: parseInt(row.count),
                    percentage: totalAnswered > 0
                        ? Math.round((parseInt(row.count) / totalAnswered) * 100)
                        : 0,
                }));

            } else if (question.question_type === 'rating') {
                // Get rating distribution
                const ratingResult = await pool.query(
                    `SELECT a.answer_text as rating, COUNT(*) as count
                     FROM answers a
                     JOIN responses r ON a.response_id = r.id
                     WHERE a.question_id = $1 AND r.survey_id = $2
                       AND a.answer_text IS NOT NULL
                     GROUP BY a.answer_text
                     ORDER BY a.answer_text`,
                    [question.id, surveyId]
                );

                // Build full 1-5 distribution with zeros for missing ratings
                const distribution = [1, 2, 3, 4, 5].map(rating => {
                    const found = ratingResult.rows.find(r => r.rating === String(rating));
                    return {
                        rating,
                        count: found ? parseInt(found.count) : 0,
                    };
                });

                const totalRatings = distribution.reduce((sum, d) => sum + d.count, 0);
                const sumRatings = distribution.reduce((sum, d) => sum + (d.rating * d.count), 0);

                questionAnalytics.total_answered = totalRatings;
                questionAnalytics.rating_distribution = distribution;
                questionAnalytics.average_rating = totalRatings > 0
                    ? Math.round((sumRatings / totalRatings) * 10) / 10
                    : 0;

            } else if (question.question_type === 'text') {
                // Get text responses
                const textResult = await pool.query(
                    `SELECT a.answer_text, u.name as user_name
                                                , r.user_id
                     FROM answers a
                     JOIN responses r ON a.response_id = r.id
                     LEFT JOIN users u ON r.user_id = u.id
                     WHERE a.question_id = $1 AND r.survey_id = $2
                       AND a.answer_text IS NOT NULL AND a.answer_text != ''
                     ORDER BY r.submitted_at DESC`,
                    [question.id, surveyId]
                );

                questionAnalytics.total_answered = textResult.rows.length;
                questionAnalytics.text_responses = textResult.rows.map(row => ({
                    answer_text: row.answer_text,
                    user_name: row.user_name || 'Anonymous',
                    user_id: row.user_id,
                }));
            }

            analytics.push(questionAnalytics);
        }

        res.json({
            survey_id: parseInt(surveyId),
            survey_title: surveyResult.rows[0].title,
            total_responses: totalResponses,
            unique_users: uniqueUsers,
            analytics,
        });
    } catch (err) {
        next(err);
    }
};

// Export raw survey responses as Excel file (admin only)
const exportSurveyResponses = async (req, res, next) => {
    try {
        const { surveyId } = req.params;

        // Get survey info
        const surveyResult = await pool.query(
            'SELECT id, title FROM surveys WHERE id = $1',
            [surveyId]
        );

        if (surveyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        const survey = surveyResult.rows[0];

        // Get all questions for this survey
        const questionsResult = await pool.query(
            'SELECT id, question_text, question_type, order_index FROM questions WHERE survey_id = $1 ORDER BY order_index',
            [surveyId]
        );

        const questions = questionsResult.rows;

        // Get all responses with user info and answers
        const rawResult = await pool.query(
            `SELECT
                r.id AS response_id,
                u.name AS user_name,
                u.email AS user_email,
                r.submitted_at,
                a.question_id,
                a.answer_text,
                o.option_text
            FROM responses r
            LEFT JOIN users u ON r.user_id = u.id
            JOIN answers a ON a.response_id = r.id
            LEFT JOIN options o ON a.option_id = o.id
            WHERE r.survey_id = $1
            ORDER BY r.submitted_at, a.question_id`,
            [surveyId]
        );

        // Group answers by response_id
        const responsesMap = new Map();
        for (const row of rawResult.rows) {
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
            // Handle checkbox questions that may have multiple selected options
            responsesMap.get(row.response_id).answers[row.question_id] =
                existing ? `${existing}, ${answer}` : answer;
        }

        // Build Excel workbook
        const workbook = new ExcelJS.Workbook();
        const sheetName = survey.title.substring(0, 31);
        const worksheet = workbook.addWorksheet(sheetName);

        // Define columns
        const columns = [
            { header: 'Respondent Name', key: 'name', width: 20 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Submitted At', key: 'submitted_at', width: 22 },
        ];

        questions.forEach((q) => {
            columns.push({
                header: q.question_text,
                key: `q_${q.id}`,
                width: 30,
            });
        });

        worksheet.columns = columns;

        // Style header row
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF003594' },
        };
        headerRow.alignment = { vertical: 'middle', wrapText: true };

        // Add data rows
        for (const [, resp] of responsesMap) {
            const row = {
                name: resp.user_name,
                email: resp.user_email,
                submitted_at: new Date(resp.submitted_at).toLocaleString(),
            };

            questions.forEach((q) => {
                row[`q_${q.id}`] = resp.answers[q.id] || '';
            });

            worksheet.addRow(row);
        }

        // Set response headers for file download
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

        // Verify survey exists
        const surveyResult = await pool.query(
            'SELECT id, title FROM surveys WHERE id = $1',
            [surveyId]
        );
        if (surveyResult.rows.length === 0) {
            return res.status(404).json({ error: 'Survey not found' });
        }

        // Gender distribution
        const genderResult = await pool.query(
            `SELECT u.gender, COUNT(*)::int AS count
            FROM responses r
            JOIN users u ON r.user_id = u.id
            WHERE r.survey_id = $1 AND u.gender IS NOT NULL AND u.gender != ''
            GROUP BY u.gender
            ORDER BY count DESC`,
            [surveyId]
        );

        // Age group distribution
        const ageResult = await pool.query(
            `SELECT
                CASE
                    WHEN u.age < 18 THEN 'Under 18'
                    WHEN u.age BETWEEN 18 AND 24 THEN '18-24'
                    WHEN u.age BETWEEN 25 AND 34 THEN '25-34'
                    WHEN u.age BETWEEN 35 AND 44 THEN '35-44'
                    WHEN u.age BETWEEN 45 AND 54 THEN '45-54'
                    ELSE '55+'
                END AS age_group,
                COUNT(*)::int AS count
            FROM responses r
            JOIN users u ON r.user_id = u.id
            WHERE r.survey_id = $1 AND u.age IS NOT NULL
            GROUP BY age_group
            ORDER BY MIN(u.age)`,
            [surveyId]
        );

        // Location distribution (top 10)
        const locationResult = await pool.query(
            `SELECT u.location, COUNT(*)::int AS count
            FROM responses r
            JOIN users u ON r.user_id = u.id
            WHERE r.survey_id = $1 AND u.location IS NOT NULL AND u.location != ''
            GROUP BY u.location
            ORDER BY count DESC
            LIMIT 10`,
            [surveyId]
        );

        res.json({
            gender_distribution: genderResult.rows,
            age_distribution: ageResult.rows,
            location_distribution: locationResult.rows,
        });
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
