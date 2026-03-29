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
            `WITH days AS (
                SELECT generate_series(
                    date_trunc('day', NOW()) - INTERVAL '29 days',
                    date_trunc('day', NOW()),
                    INTERVAL '1 day'
                )::date AS day
             )
             SELECT
                to_char(days.day, 'YYYY-MM-DD') AS day,
                COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'page_view'), 0)::int AS page_views,
                     COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'article_view'), 0)::int AS article_views,
                     COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'media_view'), 0)::int AS media_views,
                     COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'training_view'), 0)::int AS training_views,
                     COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'consulting_view'), 0)::int AS consulting_views,
                COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'survey_submit'), 0)::int AS survey_submissions,
                COALESCE(COUNT(*) FILTER (WHERE pe.event_type = 'consulting_request'), 0)::int AS consulting_requests
             FROM days
             LEFT JOIN platform_events pe
                ON pe.created_at >= days.day
               AND pe.created_at < days.day + INTERVAL '1 day'
             GROUP BY days.day
             ORDER BY days.day ASC`
        );

        return res.json({
            daily: result.rows,
        });
    } catch (err) {
        return next(err);
    }
};

const getTopContent = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `WITH top_surveys AS (
                SELECT s.id, s.title, COUNT(*)::int AS submissions
                FROM platform_events pe
                JOIN surveys s ON s.id = pe.entity_id
                WHERE pe.event_type = 'survey_submit'
                  AND pe.entity_type = 'survey'
                GROUP BY s.id, s.title
                ORDER BY submissions DESC, s.title ASC
                LIMIT 5
             ),
             top_articles AS (
                SELECT a.id, a.title, COUNT(*)::int AS views
                FROM platform_events pe
                JOIN articles a ON a.id = pe.entity_id
                WHERE pe.event_type = 'article_view'
                  AND pe.entity_type = 'article'
                GROUP BY a.id, a.title
                ORDER BY views DESC, a.title ASC
                LIMIT 5
             ),
             top_consulting AS (
                SELECT
                    cs.id,
                    cs.title,
                    COUNT(*) FILTER (WHERE pe.event_type = 'consulting_view')::int AS views,
                    COUNT(*) FILTER (WHERE pe.event_type = 'consulting_request')::int AS requests,
                    COUNT(*)::int AS total_engagement
                FROM platform_events pe
                JOIN consulting_services cs ON cs.id = pe.entity_id
                WHERE pe.entity_type = 'consulting'
                  AND pe.event_type IN ('consulting_view', 'consulting_request')
                GROUP BY cs.id, cs.title
                ORDER BY total_engagement DESC, cs.title ASC
                LIMIT 5
             ),
             top_media AS (
                SELECT mp.id, mp.title, COUNT(*)::int AS views
                FROM platform_events pe
                JOIN media_posts mp ON mp.id = pe.entity_id
                WHERE pe.event_type = 'media_view'
                  AND pe.entity_type = 'media'
                GROUP BY mp.id, mp.title
                ORDER BY views DESC, mp.title ASC
                LIMIT 5
             ),
             top_training AS (
                SELECT tc.id, tc.name AS title, COUNT(*)::int AS views
                FROM platform_events pe
                JOIN training_categories tc ON tc.id = pe.entity_id
                WHERE pe.event_type = 'training_view'
                  AND pe.entity_type = 'training'
                GROUP BY tc.id, tc.name
                ORDER BY views DESC, tc.name ASC
                LIMIT 5
             )
             SELECT
                COALESCE((SELECT jsonb_agg(row_to_json(top_surveys)) FROM top_surveys), '[]'::jsonb) AS top_surveys,
                COALESCE((SELECT jsonb_agg(row_to_json(top_articles)) FROM top_articles), '[]'::jsonb) AS top_articles,
                COALESCE((SELECT jsonb_agg(row_to_json(top_consulting)) FROM top_consulting), '[]'::jsonb) AS top_consulting,
                COALESCE((SELECT jsonb_agg(row_to_json(top_media)) FROM top_media), '[]'::jsonb) AS top_media,
                COALESCE((SELECT jsonb_agg(row_to_json(top_training)) FROM top_training), '[]'::jsonb) AS top_training`
        );

        const row = result.rows[0] || {};
        return res.json({
            top_surveys: row.top_surveys || [],
            top_articles: row.top_articles || [],
            top_consulting: row.top_consulting || [],
            top_media: row.top_media || [],
            top_training: row.top_training || [],
        });
    } catch (err) {
        return next(err);
    }
};

const getModuleBreakdown = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `WITH entities AS (
                SELECT unnest(ARRAY['survey','article','media','training','consulting']) AS entity_type
             ),
             counts AS (
                SELECT entity_type, COUNT(*)::int AS events
                FROM platform_events
                WHERE entity_type = ANY($1::text[])
                GROUP BY entity_type
             )
             SELECT
                e.entity_type,
                COALESCE(c.events, 0)::int AS events
             FROM entities e
             LEFT JOIN counts c ON c.entity_type = e.entity_type
             ORDER BY e.entity_type ASC`,
            [VALID_ENTITY_TYPES]
        );

        const total = result.rows.reduce((acc, row) => acc + toNumber(row.events), 0);
        const modules = result.rows.map((row) => {
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
