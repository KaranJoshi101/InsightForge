const pool = require('../config/database');

const VALID_ENTITY_TYPES = ['survey', 'article', 'media', 'training', 'consulting'];

const generateSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

const normalizeSessionId = (req) => {
    const candidate = req.body?.session_id || req.headers['x-session-id'];
    if (typeof candidate !== 'string') return generateSessionId();

    const cleaned = candidate.trim().slice(0, 120);
    return cleaned || generateSessionId();
};

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const formatDay = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const trackPlatformEvent = async (req, res, next) => {
    try {
        const { event_type: eventType, entity_type: entityType } = req.body;
        const entityId = req.body.entity_id ?? null;
        const userId = req.user?.userId || null;
        const sessionId = normalizeSessionId(req);
        const metadata = req.body.metadata && typeof req.body.metadata === 'object'
            ? req.body.metadata
            : null;

        const result = await pool.query(
            `INSERT INTO platform_events
                (event_type, entity_type, entity_id, user_id, session_id, metadata)
             VALUES ($1, $2, $3, $4, $5, $6::jsonb)
             RETURNING id, event_type, entity_type, entity_id, user_id, session_id, metadata, created_at`,
            [
                eventType,
                entityType,
                entityId,
                userId,
                sessionId,
                metadata ? JSON.stringify(metadata) : null,
            ]
        );

        res.setHeader('x-session-id', sessionId);

        return res.status(201).json({
            message: 'Event tracked successfully',
            event: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

const getAnalyticsOverview = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                (SELECT COUNT(*)::int FROM users) AS total_users,
                (SELECT COUNT(DISTINCT session_id)::int FROM platform_events WHERE session_id IS NOT NULL) AS total_sessions,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'page_view') AS total_page_views,
                (SELECT COUNT(*)::int FROM platform_events) AS total_events,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'consulting_view') AS total_consulting_views,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'consulting_request') AS total_consulting_requests,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'survey_submit') AS total_survey_submissions,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'article_view') AS total_article_views,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'media_view') AS total_media_views,
                (SELECT COUNT(*)::int FROM platform_events WHERE event_type = 'training_view') AS total_training_views`
        );

        return res.json(result.rows[0] || {
            total_users: 0,
            total_sessions: 0,
            total_page_views: 0,
            total_events: 0,
            total_consulting_views: 0,
            total_consulting_requests: 0,
            total_survey_submissions: 0,
            total_article_views: 0,
            total_media_views: 0,
            total_training_views: 0,
        });
    } catch (err) {
        return next(err);
    }
};

const getAnalyticsTrends = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT
                DATE(created_at) AS day,
                SUM(CASE WHEN event_type = 'page_view' THEN 1 ELSE 0 END) AS page_views,
                SUM(CASE WHEN event_type = 'article_view' THEN 1 ELSE 0 END) AS article_views,
                SUM(CASE WHEN event_type = 'media_view' THEN 1 ELSE 0 END) AS media_views,
                SUM(CASE WHEN event_type = 'training_view' THEN 1 ELSE 0 END) AS training_views,
                SUM(CASE WHEN event_type = 'consulting_view' THEN 1 ELSE 0 END) AS consulting_views,
                SUM(CASE WHEN event_type = 'survey_submit' THEN 1 ELSE 0 END) AS survey_submissions,
                SUM(CASE WHEN event_type = 'consulting_request' THEN 1 ELSE 0 END) AS consulting_requests
             FROM platform_events
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
             GROUP BY DATE(created_at)
             ORDER BY DATE(created_at) ASC`
        );

        const byDay = new Map();
        for (const row of result.rows) {
            const day = formatDay(new Date(row.day));
            byDay.set(day, {
                day,
                page_views: toNumber(row.page_views),
                article_views: toNumber(row.article_views),
                media_views: toNumber(row.media_views),
                training_views: toNumber(row.training_views),
                consulting_views: toNumber(row.consulting_views),
                survey_submissions: toNumber(row.survey_submissions),
                consulting_requests: toNumber(row.consulting_requests),
            });
        }

        const daily = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 29);

        for (let i = 0; i < 30; i += 1) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);
            const key = formatDay(current);

            daily.push(byDay.get(key) || {
                day: key,
                page_views: 0,
                article_views: 0,
                media_views: 0,
                training_views: 0,
                consulting_views: 0,
                survey_submissions: 0,
                consulting_requests: 0,
            });
        }

        return res.json({
            daily,
        });
    } catch (err) {
        return next(err);
    }
};

const getTopContent = async (_req, res, next) => {
    try {
        const [
            topSurveys,
            topArticles,
            topConsulting,
            topMedia,
            topTraining,
        ] = await Promise.all([
            pool.query(
                `SELECT s.id, s.title, COUNT(*) AS submissions
                 FROM platform_events pe
                 JOIN surveys s ON s.id = pe.entity_id
                 WHERE pe.event_type = 'survey_submit' AND pe.entity_type = 'survey'
                 GROUP BY s.id, s.title
                 ORDER BY submissions DESC, s.title ASC
                 LIMIT 5`
            ),
            pool.query(
                `SELECT a.id, a.title, COUNT(*) AS views
                 FROM platform_events pe
                 JOIN articles a ON a.id = pe.entity_id
                 WHERE pe.event_type = 'article_view' AND pe.entity_type = 'article'
                 GROUP BY a.id, a.title
                 ORDER BY views DESC, a.title ASC
                 LIMIT 5`
            ),
            pool.query(
                `SELECT
                    cs.id,
                    cs.title,
                    SUM(CASE WHEN pe.event_type = 'consulting_view' THEN 1 ELSE 0 END) AS views,
                    SUM(CASE WHEN pe.event_type = 'consulting_request' THEN 1 ELSE 0 END) AS requests,
                    COUNT(*) AS total_engagement
                 FROM platform_events pe
                 JOIN consulting_services cs ON cs.id = pe.entity_id
                 WHERE pe.entity_type = 'consulting'
                   AND pe.event_type IN ('consulting_view', 'consulting_request')
                 GROUP BY cs.id, cs.title
                 ORDER BY total_engagement DESC, cs.title ASC
                 LIMIT 5`
            ),
            pool.query(
                `SELECT mp.id, mp.title, COUNT(*) AS views
                 FROM platform_events pe
                 JOIN media_posts mp ON mp.id = pe.entity_id
                 WHERE pe.event_type = 'media_view' AND pe.entity_type = 'media'
                 GROUP BY mp.id, mp.title
                 ORDER BY views DESC, mp.title ASC
                 LIMIT 5`
            ),
            pool.query(
                `SELECT tc.id, tc.name AS title, COUNT(*) AS views
                 FROM platform_events pe
                 JOIN training_categories tc ON tc.id = pe.entity_id
                 WHERE pe.event_type = 'training_view' AND pe.entity_type = 'training'
                 GROUP BY tc.id, tc.name
                 ORDER BY views DESC, tc.name ASC
                 LIMIT 5`
            ),
        ]);

        return res.json({
            top_surveys: topSurveys.rows.map((r) => ({ ...r, submissions: toNumber(r.submissions) })),
            top_articles: topArticles.rows.map((r) => ({ ...r, views: toNumber(r.views) })),
            top_consulting: topConsulting.rows.map((r) => ({
                id: r.id,
                title: r.title,
                views: toNumber(r.views),
                requests: toNumber(r.requests),
                total_engagement: toNumber(r.total_engagement),
            })),
            top_media: topMedia.rows.map((r) => ({ ...r, views: toNumber(r.views) })),
            top_training: topTraining.rows.map((r) => ({ ...r, views: toNumber(r.views) })),
        });
    } catch (err) {
        return next(err);
    }
};

const getModuleBreakdown = async (_req, res, next) => {
    try {
        const placeholders = VALID_ENTITY_TYPES.map((_, idx) => `$${idx + 1}`).join(', ');
        const result = await pool.query(
            `SELECT entity_type, COUNT(*) AS events
             FROM platform_events
             WHERE entity_type IN (${placeholders})
             GROUP BY entity_type
             ORDER BY entity_type ASC`,
            VALID_ENTITY_TYPES
        );

        const byType = new Map(result.rows.map((row) => [row.entity_type, toNumber(row.events)]));
        const rows = VALID_ENTITY_TYPES.map((entityType) => ({
            entity_type: entityType,
            events: byType.get(entityType) || 0,
        }));

        const total = rows.reduce((acc, row) => acc + toNumber(row.events), 0);
        const modules = rows.map((row) => {
            const events = toNumber(row.events);
            return {
                entity_type: row.entity_type,
                events,
                percentage: total > 0 ? Number(((events / total) * 100).toFixed(2)) : 0,
            };
        });

        return res.json({
            total_events: total,
            modules,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    trackPlatformEvent,
    getAnalyticsOverview,
    getAnalyticsTrends,
    getTopContent,
    getModuleBreakdown,
};
