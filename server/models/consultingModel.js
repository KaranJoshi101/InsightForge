const pool = require('../config/database');

async function findActiveServices() {
    const result = await pool.query(
        `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
         FROM consulting_services
         WHERE is_active = true
         ORDER BY title ASC`
    );
    return result.rows;
}

async function getServiceBySlug(slug) {
    const result = await pool.query(
        `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
         FROM consulting_services
         WHERE slug = $1 AND is_active = true`,
        [slug]
    );
    return result.rows[0] || null;
}

async function createService({ title, slug, shortDescription, heroSubtitle, heroBenefits, content, deliverables, targetAudience, isActive }) {
    const result = await pool.query(
        `INSERT INTO consulting_services
            (title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
         RETURNING id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at`,
        [title, slug, shortDescription, heroSubtitle, JSON.stringify(heroBenefits), content, deliverables, targetAudience, isActive]
    );
    return result.rows[0];
}

async function getServiceById(id) {
    const result = await pool.query('SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active FROM consulting_services WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function updateService(id, { title, slug, shortDescription, heroSubtitle, heroBenefits, content, deliverables, targetAudience, isActive }) {
    const result = await pool.query(
        `UPDATE consulting_services
         SET title = $1,
             slug = $2,
             short_description = $3,
             hero_subtitle = $4,
             hero_benefits = $5::jsonb,
             content = $6,
             deliverables = $7,
             target_audience = $8,
             is_active = $9,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $10
         RETURNING id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at`,
        [title, slug, shortDescription, heroSubtitle, JSON.stringify(heroBenefits), content, deliverables, targetAudience, isActive, id]
    );
    return result.rows[0] || null;
}

async function deleteService(id) {
    const result = await pool.query('DELETE FROM consulting_services WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
}

async function createRequest({ serviceId, userId, name, email, message, fileUrl }) {
    const result = await pool.query(
        `INSERT INTO consulting_requests
            (service_id, user_id, name, email, message, file_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, service_id, user_id, name, email, message, file_url, created_at`,
        [serviceId, userId, name, email, message, fileUrl]
    );
    return result.rows[0];
}

async function insertEvent({ serviceId, eventType, userId, sessionId, metadata }) {
    const result = await pool.query(
        `INSERT INTO consulting_events
            (service_id, event_type, user_id, session_id, metadata)
         VALUES ($1, $2, $3, $4, $5::jsonb)
         RETURNING id, service_id, event_type, user_id, session_id, metadata, created_at`,
        [serviceId, eventType, userId, sessionId, metadata ? JSON.stringify(metadata) : null]
    );
    return result.rows[0];
}

// Analytics helpers
async function getConsultingCounts(windowClause) {
    const sql = `SELECT COUNT(*) AS views, COUNT(DISTINCT COALESCE(CONCAT('u:', user_id), CONCAT('s:', NULLIF(session_id, '')), CONCAT('e:', id))) AS unique_views FROM consulting_events WHERE event_type = 'view' AND ${windowClause}`;
    const result = await pool.query(sql);
    return result.rows[0] || { views: 0, unique_views: 0 };
}

async function getRequestCounts(windowClause) {
    const sql = `SELECT COUNT(*) AS requests FROM consulting_requests WHERE ${windowClause}`;
    const result = await pool.query(sql);
    return result.rows[0] || { requests: 0 };
}

async function getTopViewedServices() {
    const result = await pool.query(
        `SELECT cs.id, cs.title, cs.slug, COUNT(*) AS views
         FROM consulting_events ce
         JOIN consulting_services cs ON cs.id = ce.service_id
         WHERE ce.event_type = 'view'
         GROUP BY cs.id, cs.title, cs.slug
         ORDER BY views DESC, cs.title ASC
         LIMIT 5`
    );
    return result.rows;
}

async function getTopRequestedServices() {
    const result = await pool.query(
        `SELECT cs.id, cs.title, cs.slug, COUNT(*) AS requests
         FROM consulting_requests cr
         JOIN consulting_services cs ON cs.id = cr.service_id
         GROUP BY cs.id, cs.title, cs.slug
         ORDER BY requests DESC, cs.title ASC
         LIMIT 5`
    );
    return result.rows;
}

async function getServiceMetrics() {
    const result = await pool.query(
        `SELECT
            cs.id,
            cs.title,
            cs.slug,
            COALESCE(v.views, 0) AS views,
            COALESCE(r.requests, 0) AS requests
         FROM consulting_services cs
         LEFT JOIN (
            SELECT service_id, COUNT(*) AS views
            FROM consulting_events
            WHERE event_type = 'view'
            GROUP BY service_id
         ) v ON v.service_id = cs.id
         LEFT JOIN (
            SELECT service_id, COUNT(*) AS requests
            FROM consulting_requests
            GROUP BY service_id
         ) r ON r.service_id = cs.id
         ORDER BY cs.title ASC`
    );
    return result.rows;
}

async function getMinDay() {
    const result = await pool.query(
        `SELECT LEAST(
            COALESCE((SELECT MIN(DATE(created_at)) FROM consulting_events WHERE event_type = 'view'), CURDATE()),
            COALESCE((SELECT MIN(DATE(created_at)) FROM consulting_requests), CURDATE())
         ) AS min_day`
    );
    return result.rows[0]?.min_day || null;
}

async function getViewsTrend() {
    const result = await pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS views
         FROM consulting_events
         WHERE event_type = 'view' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
    );
    return result.rows;
}

async function getRequestsTrend() {
    const result = await pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS requests
         FROM consulting_requests
         WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 29 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC`
    );
    return result.rows;
}

async function getServiceByIdSimple(id) {
    const result = await pool.query('SELECT id, title, slug FROM consulting_services WHERE id = $1', [id]);
    return result.rows[0] || null;
}

async function getCountsByService(id) {
    const result = await pool.query(
        `SELECT
            (SELECT COUNT(*)::int FROM consulting_events WHERE service_id = $1 AND event_type = 'view') AS views,
            (SELECT COUNT(*)::int FROM consulting_requests WHERE service_id = $1) AS requests`,
        [id]
    );
    return result.rows[0] || { views: 0, requests: 0 };
}

async function getTrendByService(id, days) {
    const result = await pool.query(
        `WITH days AS (
            SELECT generate_series(
                date_trunc('day', NOW()) - (($2::int - 1) * INTERVAL '1 day'),
                date_trunc('day', NOW()),
                INTERVAL '1 day'
            )::date AS day
          ),
          views AS (
              SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS views
              FROM consulting_events
              WHERE service_id = $1
                 AND event_type = 'view'
              GROUP BY date_trunc('day', created_at)::date
          ),
          requests AS (
              SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS requests
              FROM consulting_requests
              WHERE service_id = $1
              GROUP BY date_trunc('day', created_at)::date
          )
     SELECT
        to_char(days.day, 'YYYY-MM-DD') AS day,
              COALESCE(v.views, 0)::int AS views,
              COALESCE(r.requests, 0)::int AS requests
     FROM days
          LEFT JOIN views v ON v.day = days.day
          LEFT JOIN requests r ON r.day = days.day
     ORDER BY days.day ASC`,
        [id, days]
    );
    return result.rows;
}

async function getConsultingRequestsPaginated(limit, offset) {
    const rowsResult = await pool.query(
        `SELECT
            cr.id,
            cr.service_id,
            cs.title AS service_title,
            cs.slug AS service_slug,
            cr.user_id,
            u.name AS user_name,
            cr.name,
            cr.email,
            cr.message,
            cr.file_url,
            cr.status,
            cr.priority,
            cr.notes,
            cr.created_at
         FROM consulting_requests cr
         JOIN consulting_services cs ON cs.id = cr.service_id
         LEFT JOIN users u ON u.id = cr.user_id
         ORDER BY cr.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
    );
    const countResult = await pool.query('SELECT COUNT(*)::int AS count FROM consulting_requests');
    return { rows: rowsResult.rows, total: countResult.rows[0].count };
}

async function getConsultingRequestById(id) {
    const result = await pool.query(
        `SELECT
            cr.id,
            cr.service_id,
            cs.title AS service_title,
            cs.slug AS service_slug,
            cr.user_id,
            requester.name AS user_name,
            cr.name,
            cr.email,
            cr.message,
            cr.file_url,
            cr.status,
            cr.priority,
            cr.notes,
            cr.created_at,
            cr.updated_at
         FROM consulting_requests cr
         JOIN consulting_services cs ON cs.id = cr.service_id
         LEFT JOIN users requester ON requester.id = cr.user_id
         WHERE cr.id = $1`,
        [id]
    );
    return result.rows[0] || null;
}

async function updateConsultingRequest(id, { status, priority, notes }) {
    const result = await pool.query(
        `UPDATE consulting_requests
         SET status = $1,
             priority = $2,
             notes = $3,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $4
         RETURNING id, status, priority, notes, updated_at`,
        [status, priority, notes, id]
    );
    return result.rows[0] || null;
}

async function getAllServicesAdmin() {
    const result = await pool.query(
        `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
         FROM consulting_services
         ORDER BY created_at DESC`
    );
    return result.rows;
}

module.exports = {
    findActiveServices,
    getServiceBySlug,
    createService,
    getServiceById,
    updateService,
    deleteService,
    createRequest,
    insertEvent,
    getConsultingCounts,
    getRequestCounts,
    getTopViewedServices,
    getTopRequestedServices,
    getServiceMetrics,
    getMinDay,
    getViewsTrend,
    getRequestsTrend,
    getServiceByIdSimple,
    getCountsByService,
    getTrendByService,
    getConsultingRequestsPaginated,
    getConsultingRequestById,
    updateConsultingRequest,
    getAllServicesAdmin,
};
