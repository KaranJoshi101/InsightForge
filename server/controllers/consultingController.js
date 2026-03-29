const pool = require('../config/database');

const clamp = (value, min, max, fallback) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
};

const sanitizeHtml = (value) => {
    if (typeof value !== 'string') return '';

    return value
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
        .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
        .replace(/javascript:/gi, '')
        .trim();
};

const sanitizeText = (value) => {
    if (typeof value !== 'string') return '';
    return value.replace(/\s+/g, ' ').trim();
};

const VALID_REQUEST_STATUSES = new Set(['new', 'in_progress', 'waiting_user', 'resolved', 'closed']);
const VALID_REQUEST_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);

const sanitizeBenefits = (value) => {
    if (!Array.isArray(value)) return [];

    return value
        .map((item) => sanitizeText(item))
        .filter(Boolean)
        .slice(0, 6);
};

const generateSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;

const normalizeSessionId = (req) => {
    const candidate = req.body.session_id || req.headers['x-session-id'];
    if (typeof candidate !== 'string') return generateSessionId();

    const cleaned = candidate.trim().slice(0, 120);
    return cleaned || generateSessionId();
};

const normalizeSlug = (value) => {
    const raw = sanitizeText(value).toLowerCase();
    return raw
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const mapService = (row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    short_description: row.short_description,
    hero_subtitle: row.hero_subtitle || row.short_description,
    hero_benefits: Array.isArray(row.hero_benefits) ? row.hero_benefits : [],
    content: row.content,
    deliverables: row.deliverables,
    target_audience: row.target_audience,
    is_active: row.is_active,
    created_at: row.created_at,
    updated_at: row.updated_at,
});

const getConsultingServices = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
             FROM consulting_services
             WHERE is_active = true
             ORDER BY title ASC`
        );

        res.json({
            services: result.rows.map(mapService),
            count: result.rows.length,
        });
    } catch (err) {
        next(err);
    }
};

const getConsultingServiceBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const result = await pool.query(
            `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
             FROM consulting_services
             WHERE slug = $1 AND is_active = true`,
            [slug]
        );

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Consulting service not found' });
        }

        return res.json({ service: mapService(result.rows[0]) });
    } catch (err) {
        return next(err);
    }
};

const createConsultingService = async (req, res, next) => {
    try {
        const title = sanitizeText(req.body.title);
        const slug = normalizeSlug(req.body.slug || title);
        const shortDescription = sanitizeText(req.body.short_description);
        const heroSubtitle = req.body.hero_subtitle !== undefined
            ? sanitizeText(req.body.hero_subtitle)
            : shortDescription;
        const heroBenefits = req.body.hero_benefits !== undefined
            ? sanitizeBenefits(req.body.hero_benefits)
            : [];
        const content = sanitizeHtml(req.body.content);
        const deliverables = req.body.deliverables ? sanitizeHtml(req.body.deliverables) : null;
        const targetAudience = req.body.target_audience ? sanitizeHtml(req.body.target_audience) : null;
        const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : true;

        if (!title || !slug || !shortDescription || !content) {
            return res.status(400).json({
                error: 'title, slug, short_description, and content are required',
            });
        }

        const result = await pool.query(
            `INSERT INTO consulting_services
                (title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active)
             VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
             RETURNING id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at`,
            [title, slug, shortDescription, heroSubtitle, JSON.stringify(heroBenefits), content, deliverables, targetAudience, isActive]
        );

        return res.status(201).json({
            message: 'Consulting service created successfully',
            service: mapService(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A service with this slug already exists' });
        }
        return next(err);
    }
};

const updateConsultingService = async (req, res, next) => {
    try {
        const { id } = req.params;

        const currentResult = await pool.query(
            'SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active FROM consulting_services WHERE id = $1',
            [id]
        );

        if (!currentResult.rows.length) {
            return res.status(404).json({ error: 'Consulting service not found' });
        }

        const current = currentResult.rows[0];

        const title = req.body.title !== undefined ? sanitizeText(req.body.title) : current.title;
        const slug = req.body.slug !== undefined
            ? normalizeSlug(req.body.slug)
            : (req.body.title !== undefined ? normalizeSlug(req.body.title) : current.slug);
        const shortDescription = req.body.short_description !== undefined
            ? sanitizeText(req.body.short_description)
            : current.short_description;
        const heroSubtitle = req.body.hero_subtitle !== undefined
            ? sanitizeText(req.body.hero_subtitle)
            : (current.hero_subtitle || shortDescription);
        const heroBenefits = req.body.hero_benefits !== undefined
            ? sanitizeBenefits(req.body.hero_benefits)
            : (Array.isArray(current.hero_benefits) ? current.hero_benefits : []);
        const content = req.body.content !== undefined
            ? sanitizeHtml(req.body.content)
            : current.content;
        const deliverables = req.body.deliverables !== undefined
            ? (req.body.deliverables ? sanitizeHtml(req.body.deliverables) : null)
            : current.deliverables;
        const targetAudience = req.body.target_audience !== undefined
            ? (req.body.target_audience ? sanitizeHtml(req.body.target_audience) : null)
            : current.target_audience;
        const isActive = req.body.is_active !== undefined ? Boolean(req.body.is_active) : current.is_active;

        if (!title || !slug || !shortDescription || !content) {
            return res.status(400).json({
                error: 'title, slug, short_description, and content are required',
            });
        }

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

        return res.json({
            message: 'Consulting service updated successfully',
            service: mapService(result.rows[0]),
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'A service with this slug already exists' });
        }
        return next(err);
    }
};

const deleteConsultingService = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query('DELETE FROM consulting_services WHERE id = $1 RETURNING id', [id]);

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Consulting service not found' });
        }

        return res.json({ message: 'Consulting service deleted successfully' });
    } catch (err) {
        return next(err);
    }
};

const submitConsultingRequest = async (req, res, next) => {
    try {
        const serviceId = Number.parseInt(req.body.service_id, 10);
        const name = sanitizeText(req.body.name);
        const email = sanitizeText(req.body.email).toLowerCase();
        const message = sanitizeText(req.body.message);
        const userId = req.user?.userId || null;

        const serviceResult = await pool.query(
            'SELECT id FROM consulting_services WHERE id = $1 AND is_active = true',
            [serviceId]
        );

        if (!serviceResult.rows.length) {
            return res.status(404).json({ error: 'Service not found or inactive' });
        }

        const fileUrl = req.file ? `/uploads/consulting-requests/${req.file.filename}` : null;

        const result = await pool.query(
            `INSERT INTO consulting_requests
                (service_id, user_id, name, email, message, file_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING id, service_id, user_id, name, email, message, file_url, created_at`,
            [serviceId, userId, name, email, message, fileUrl]
        );

        return res.status(201).json({
            message: 'Consultation request submitted successfully',
            request: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

const trackConsultingEvent = async (req, res, next) => {
    try {
        const serviceId = Number.parseInt(req.body.service_id, 10);
        const eventType = sanitizeText(req.body.event_type).toLowerCase();
        const userId = req.user?.userId || null;
        const sessionId = normalizeSessionId(req);
        const metadata = req.body.metadata && typeof req.body.metadata === 'object'
            ? req.body.metadata
            : null;

        const serviceResult = await pool.query(
            'SELECT id FROM consulting_services WHERE id = $1 AND is_active = true',
            [serviceId]
        );

        if (!serviceResult.rows.length) {
            return res.status(404).json({ error: 'Service not found or inactive' });
        }

        const result = await pool.query(
            `INSERT INTO consulting_events
                (service_id, event_type, user_id, session_id, metadata)
             VALUES ($1, $2, $3, $4, $5::jsonb)
             RETURNING id, service_id, event_type, user_id, session_id, metadata, created_at`,
            [serviceId, eventType, userId, sessionId, metadata ? JSON.stringify(metadata) : null]
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

const getConsultingAnalyticsOverview = async (_req, res, next) => {
    try {
        const [totalsResult, viewedResult, requestedResult, metricsResult, trendResult] = await Promise.all([
            pool.query(
                `SELECT
                    (SELECT COUNT(*)::int FROM consulting_events WHERE event_type = 'view') AS total_views,
                    (SELECT COUNT(*)::int FROM consulting_requests) AS total_requests`
            ),
            pool.query(
                `SELECT cs.id, cs.title, cs.slug, COUNT(*)::int AS views
                 FROM consulting_events ce
                 JOIN consulting_services cs ON cs.id = ce.service_id
                 WHERE ce.event_type = 'view'
                 GROUP BY cs.id, cs.title, cs.slug
                 ORDER BY views DESC, cs.title ASC
                 LIMIT 5`
            ),
            pool.query(
                     `SELECT cs.id, cs.title, cs.slug, COUNT(*)::int AS requests
                      FROM consulting_requests cr
                      JOIN consulting_services cs ON cs.id = cr.service_id
                      GROUP BY cs.id, cs.title, cs.slug
                 ORDER BY requests DESC, cs.title ASC
                 LIMIT 5`
            ),
            pool.query(
                `SELECT
                    cs.id,
                    cs.title,
                    cs.slug,
                          COALESCE(cv.views, 0)::int AS views,
                          COALESCE(crq.requests, 0)::int AS requests
                 FROM consulting_services cs
                      LEFT JOIN (
                          SELECT service_id, COUNT(*)::int AS views
                          FROM consulting_events
                          WHERE event_type = 'view'
                          GROUP BY service_id
                      ) cv ON cv.service_id = cs.id
                      LEFT JOIN (
                          SELECT service_id, COUNT(*)::int AS requests
                          FROM consulting_requests
                          GROUP BY service_id
                      ) crq ON crq.service_id = cs.id
                 ORDER BY cs.title ASC`
            ),
            pool.query(
                `WITH days AS (
                    SELECT generate_series(
                        date_trunc('day', NOW()) - INTERVAL '29 days',
                        date_trunc('day', NOW()),
                        INTERVAL '1 day'
                    )::date AS day
                      ),
                      views AS (
                          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS views
                          FROM consulting_events
                          WHERE event_type = 'view'
                          GROUP BY date_trunc('day', created_at)::date
                      ),
                      requests AS (
                          SELECT date_trunc('day', created_at)::date AS day, COUNT(*)::int AS requests
                          FROM consulting_requests
                          GROUP BY date_trunc('day', created_at)::date
                      )
                 SELECT
                    to_char(days.day, 'YYYY-MM-DD') AS day,
                          COALESCE(v.views, 0)::int AS views,
                          COALESCE(r.requests, 0)::int AS requests
                 FROM days
                      LEFT JOIN views v ON v.day = days.day
                      LEFT JOIN requests r ON r.day = days.day
                 ORDER BY days.day ASC`
            ),
        ]);

        const totals = totalsResult.rows[0] || { total_views: 0, total_requests: 0 };
        const totalViews = Number(totals.total_views) || 0;
        const totalRequests = Number(totals.total_requests) || 0;
        const conversionRate = totalViews > 0 ? ((totalRequests / totalViews) * 100) : 0;

        const serviceMetrics = metricsResult.rows.map((row) => {
            const views = Number(row.views) || 0;
            const requests = Number(row.requests) || 0;
            return {
                id: row.id,
                title: row.title,
                slug: row.slug,
                views,
                requests,
                conversion_rate: views > 0 ? Number(((requests / views) * 100).toFixed(2)) : 0,
            };
        });

        return res.json({
            total_views: totalViews,
            total_requests: totalRequests,
            conversion_rate: Number(conversionRate.toFixed(2)),
            most_viewed_services: viewedResult.rows,
            most_requested_services: requestedResult.rows,
            daily_trend: trendResult.rows,
            service_metrics: serviceMetrics,
        });
    } catch (err) {
        return next(err);
    }
};

const getConsultingAnalyticsByService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const days = req.query.days === 7 ? 7 : 30;

        const serviceResult = await pool.query(
            'SELECT id, title, slug FROM consulting_services WHERE id = $1',
            [id]
        );

        if (!serviceResult.rows.length) {
            return res.status(404).json({ error: 'Consulting service not found' });
        }

        const [countsResult, trendResult] = await Promise.all([
            pool.query(
                `SELECT
                          (SELECT COUNT(*)::int FROM consulting_events WHERE service_id = $1 AND event_type = 'view') AS views,
                          (SELECT COUNT(*)::int FROM consulting_requests WHERE service_id = $1) AS requests`,
                [id]
            ),
            pool.query(
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
            ),
        ]);

        const counts = countsResult.rows[0] || { views: 0, requests: 0 };
        const views = Number(counts.views) || 0;
        const requests = Number(counts.requests) || 0;
        const conversionRate = views > 0 ? ((requests / views) * 100) : 0;

        return res.json({
            service: serviceResult.rows[0],
            views,
            requests,
            conversion_rate: Number(conversionRate.toFixed(2)),
            daily_trend: trendResult.rows,
            days,
        });
    } catch (err) {
        return next(err);
    }
};

const getConsultingRequests = async (req, res, next) => {
    try {
        const page = clamp(req.query.page, 1, 100000, 1);
        const limit = clamp(req.query.limit, 1, 100, 20);
        const offset = (page - 1) * limit;

        const [rowsResult, countResult] = await Promise.all([
            pool.query(
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
            ),
            pool.query('SELECT COUNT(*)::int AS count FROM consulting_requests'),
        ]);

        const total = countResult.rows[0].count;

        return res.json({
            requests: rowsResult.rows,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        return next(err);
    }
};

const getConsultingRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;

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

        if (!result.rows.length) {
            return res.status(404).json({ error: 'Consulting request not found' });
        }

        return res.json({ request: result.rows[0] });
    } catch (err) {
        return next(err);
    }
};

const updateConsultingRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const currentResult = await pool.query(
            `SELECT id, status, priority, notes
             FROM consulting_requests
             WHERE id = $1`,
            [id]
        );

        if (!currentResult.rows.length) {
            return res.status(404).json({ error: 'Consulting request not found' });
        }

        const current = currentResult.rows[0];

        const status = req.body.status !== undefined
            ? sanitizeText(req.body.status)
            : current.status;
        const priority = req.body.priority !== undefined
            ? sanitizeText(req.body.priority)
            : current.priority;
        const notes = req.body.notes !== undefined
            ? (req.body.notes ? sanitizeText(req.body.notes) : null)
            : current.notes;

        if (!VALID_REQUEST_STATUSES.has(status)) {
            return res.status(400).json({ error: 'Invalid request status' });
        }

        if (!VALID_REQUEST_PRIORITIES.has(priority)) {
            return res.status(400).json({ error: 'Invalid request priority' });
        }

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

        return res.json({
            message: 'Consulting request updated successfully',
            request: result.rows[0],
        });
    } catch (err) {
        return next(err);
    }
};

const getAdminConsultingServices = async (_req, res, next) => {
    try {
        const result = await pool.query(
            `SELECT id, title, slug, short_description, hero_subtitle, hero_benefits, content, deliverables, target_audience, is_active, created_at, updated_at
             FROM consulting_services
             ORDER BY created_at DESC`
        );

        return res.json({
            services: result.rows.map(mapService),
            count: result.rows.length,
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getConsultingServices,
    getConsultingServiceBySlug,
    createConsultingService,
    updateConsultingService,
    deleteConsultingService,
    submitConsultingRequest,
    trackConsultingEvent,
    getConsultingAnalyticsOverview,
    getConsultingAnalyticsByService,
    getConsultingRequests,
    getConsultingRequestById,
    updateConsultingRequestById,
    getAdminConsultingServices,
};
