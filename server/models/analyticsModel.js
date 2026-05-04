const pool = require('../config/database');

async function insertPlatformEvent({ event_type, entity_type, entity_id, user_id, session_id, metadata }) {
    const result = await pool.query(
        `INSERT INTO platform_events (event_type, entity_type, entity_id, user_id, session_id, metadata) VALUES ($1,$2,$3,$4,$5,$6::jsonb) RETURNING id, event_type, entity_type, entity_id, user_id, session_id, metadata, created_at`,
        [event_type, entity_type, entity_id, user_id, session_id, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
}

async function getOverview() {
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
    return result.rows[0] || null;
}

async function getTrends() {
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
    return result.rows;
}

async function getTopContent() {
    const queries = [
        `SELECT s.id, s.title, COUNT(*) AS submissions FROM platform_events pe JOIN surveys s ON s.id = pe.entity_id WHERE pe.event_type = 'survey_submit' AND pe.entity_type = 'survey' GROUP BY s.id, s.title ORDER BY submissions DESC, s.title ASC LIMIT 5`,
        `SELECT a.id, a.title, COUNT(*) AS views FROM platform_events pe JOIN articles a ON a.id = pe.entity_id WHERE pe.event_type = 'article_view' AND pe.entity_type = 'article' GROUP BY a.id, a.title ORDER BY views DESC, a.title ASC LIMIT 5`,
        `SELECT cs.id, cs.title, SUM(CASE WHEN pe.event_type = 'consulting_view' THEN 1 ELSE 0 END) AS views, SUM(CASE WHEN pe.event_type = 'consulting_request' THEN 1 ELSE 0 END) AS requests, COUNT(*) AS total_engagement FROM platform_events pe JOIN consulting_services cs ON cs.id = pe.entity_id WHERE pe.entity_type = 'consulting' AND pe.event_type IN ('consulting_view', 'consulting_request') GROUP BY cs.id, cs.title ORDER BY total_engagement DESC, cs.title ASC LIMIT 5`,
        `SELECT mp.id, mp.title, COUNT(*) AS views FROM platform_events pe JOIN media_posts mp ON mp.id = pe.entity_id WHERE pe.event_type = 'media_view' AND pe.entity_type = 'media' GROUP BY mp.id, mp.title ORDER BY views DESC, mp.title ASC LIMIT 5`,
        `SELECT tc.id, tc.name AS title, COUNT(*) AS views FROM platform_events pe JOIN training_categories tc ON tc.id = pe.entity_id WHERE pe.event_type = 'training_view' AND pe.entity_type = 'training' GROUP BY tc.id, tc.name ORDER BY views DESC, tc.name ASC LIMIT 5`,
    ];

    const results = await Promise.all(queries.map((q) => pool.query(q)));
    return results.map((r) => r.rows);
}

async function getModuleBreakdown(entityTypes) {
    const placeholders = entityTypes.map((_, idx) => `$${idx + 1}`).join(', ');
    const result = await pool.query(`SELECT entity_type, COUNT(*) AS events FROM platform_events WHERE entity_type IN (${placeholders}) GROUP BY entity_type ORDER BY entity_type ASC`, entityTypes);
    return result.rows;
}

module.exports = {
    insertPlatformEvent,
    getOverview,
    getTrends,
    getTopContent,
    getModuleBreakdown,
};
