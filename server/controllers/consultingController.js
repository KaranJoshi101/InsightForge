const pool = require('../config/database');
const consultingModel = require('../models/consultingModel');

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

const formatDay = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

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
        const rows = await consultingModel.findActiveServices();
        res.json({ services: rows.map(mapService), count: rows.length });
    } catch (err) {
        next(err);
    }
};

const getConsultingServiceBySlug = async (req, res, next) => {
    try {
        const { slug } = req.params;

        const service = await consultingModel.getServiceBySlug(slug);
        if (!service) return res.status(404).json({ error: 'Consulting service not found' });
        return res.json({ service: mapService(service) });
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

        const created = await consultingModel.createService({ title, slug, shortDescription, heroSubtitle, heroBenefits, content, deliverables: deliverables || null, targetAudience: targetAudience || null, isActive });
        return res.status(201).json({ message: 'Consulting service created successfully', service: mapService(created) });
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

        const current = await consultingModel.getServiceById(id);
        if (!current) return res.status(404).json({ error: 'Consulting service not found' });

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

        const updated = await consultingModel.updateService(id, { title, slug, shortDescription, heroSubtitle, heroBenefits, content, deliverables, targetAudience, isActive });
        return res.json({ message: 'Consulting service updated successfully', service: mapService(updated) });
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

        const deleted = await consultingModel.deleteService(id);
        if (!deleted) return res.status(404).json({ error: 'Consulting service not found' });
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

        const service = await consultingModel.getServiceByIdSimple(serviceId);
        if (!service) return res.status(404).json({ error: 'Service not found or inactive' });

        const fileUrl = req.file ? `/uploads/consulting-requests/${req.file.filename}` : null;

        const created = await consultingModel.createRequest({ serviceId, userId, name, email, message, fileUrl });
        return res.status(201).json({ message: 'Consultation request submitted successfully', request: created });
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

        const service = await consultingModel.getServiceByIdSimple(serviceId);
        if (!service) return res.status(404).json({ error: 'Service not found or inactive' });
        const event = await consultingModel.insertEvent({ serviceId, eventType, userId, sessionId, metadata });
        res.setHeader('x-session-id', sessionId);
        return res.status(201).json({ message: 'Event tracked successfully', event });
    } catch (err) {
        return next(err);
    }
};

const getConsultingAnalyticsOverview = async (req, res, next) => {
    try {
        const period = ['7d', '30d', 'all'].includes(req.query.period)
            ? req.query.period
            : '30d';

        const getWindowClause = (windowPeriod) => {
            if (windowPeriod === '7d') {
                return "created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
            }

            if (windowPeriod === '30d') {
                return "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
            }

            return '1 = 1';
        };

        const [totalsAll, totals7d, totals30d] = await Promise.all([
            consultingModel.getConsultingCounts(getWindowClause('all')),
            consultingModel.getConsultingCounts(getWindowClause('7d')),
            consultingModel.getConsultingCounts(getWindowClause('30d')),
        ]);

        const [requestsAll, requests7d, requests30d] = await Promise.all([
            consultingModel.getRequestCounts(getWindowClause('all')),
            consultingModel.getRequestCounts(getWindowClause('7d')),
            consultingModel.getRequestCounts(getWindowClause('30d')),
        ]);

        const [viewedResult, requestedResult, metricsResult, minDayResult, viewsTrendResult, requestsTrendResult] = await Promise.all([
            consultingModel.getTopViewedServices(),
            consultingModel.getTopRequestedServices(),
            consultingModel.getServiceMetrics(),
            consultingModel.getMinDay(),
            consultingModel.getViewsTrend(),
            consultingModel.getRequestsTrend(),
        ]);
        const totalViews = Number(totalsAll.rows[0]?.views) || 0;
        const totalRequests = Number(requestsAll.rows[0]?.requests) || 0;
        const totalViews7d = Number(totals7d.rows[0]?.views) || 0;
        const totalRequests7d = Number(requests7d.rows[0]?.requests) || 0;
        const totalViews30d = Number(totals30d.rows[0]?.views) || 0;
        const totalRequests30d = Number(requests30d.rows[0]?.requests) || 0;
        const totalUniqueViews = Number(totalsAll.rows[0]?.unique_views) || 0;
        const totalUniqueViews7d = Number(totals7d.rows[0]?.unique_views) || 0;
        const totalUniqueViews30d = Number(totals30d.rows[0]?.unique_views) || 0;
        const conversionRate = totalViews > 0 ? ((totalRequests / totalViews) * 100) : 0;
        const conversionRateUnique = totalUniqueViews > 0 ? ((totalRequests / totalUniqueViews) * 100) : 0;
        const conversionRate7d = totalViews7d > 0 ? ((totalRequests7d / totalViews7d) * 100) : 0;
        const conversionRateUnique7d = totalUniqueViews7d > 0 ? ((totalRequests7d / totalUniqueViews7d) * 100) : 0;
        const conversionRate30d = totalViews30d > 0 ? ((totalRequests30d / totalViews30d) * 100) : 0;
        const conversionRateUnique30d = totalUniqueViews30d > 0 ? ((totalRequests30d / totalUniqueViews30d) * 100) : 0;

        const selectedTotalsByPeriod = {
            all: {
                total_views: totalViews,
                total_requests: totalRequests,
                total_unique_views: totalUniqueViews,
            },
            '30d': {
                total_views: totalViews30d,
                total_requests: totalRequests30d,
                total_unique_views: totalUniqueViews30d,
            },
            '7d': {
                total_views: totalViews7d,
                total_requests: totalRequests7d,
                total_unique_views: totalUniqueViews7d,
            },
        };

        const selectedTotals = selectedTotalsByPeriod[period] || selectedTotalsByPeriod['30d'];
        const selectedConversion = selectedTotals.total_views > 0
            ? ((selectedTotals.total_requests / selectedTotals.total_views) * 100)
            : 0;
        const selectedConversionUnique = selectedTotals.total_unique_views > 0
            ? ((selectedTotals.total_requests / selectedTotals.total_unique_views) * 100)
            : 0;

        const trendStart = (() => {
            if (period === '7d') {
                const date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 6);
                return date;
            }

            if (period === '30d') {
                const date = new Date();
                date.setHours(0, 0, 0, 0);
                date.setDate(date.getDate() - 29);
                return date;
            }

            const minDay = minDayResult.rows[0]?.min_day;
            const date = minDay ? new Date(minDay) : new Date();
            date.setHours(0, 0, 0, 0);
            return date;
        })();

        const viewsByDay = new Map(viewsTrendResult.rows.map((row) => [formatDay(new Date(row.day)), Number(row.views) || 0]));
        const requestsByDay = new Map(requestsTrendResult.rows.map((row) => [formatDay(new Date(row.day)), Number(row.requests) || 0]));
        const dailyTrend = [];
        const trendEnd = new Date();
        trendEnd.setHours(0, 0, 0, 0);

        for (let cursor = new Date(trendStart); cursor <= trendEnd; cursor.setDate(cursor.getDate() + 1)) {
            const key = formatDay(cursor);
            dailyTrend.push({
                day: key,
                views: viewsByDay.get(key) || 0,
                requests: requestsByDay.get(key) || 0,
            });
        }

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

        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

        return res.json({
            selected_period: period,
            total_views: totalViews,
            total_requests: totalRequests,
            conversion_rate: Number(conversionRate.toFixed(2)),
            total_unique_views: totalUniqueViews,
            conversion_rate_unique: Number(conversionRateUnique.toFixed(2)),
            period_metrics: {
                total_views: selectedTotals.total_views,
                total_requests: selectedTotals.total_requests,
                total_unique_views: selectedTotals.total_unique_views,
                conversion_rate: Number(selectedConversion.toFixed(2)),
                conversion_rate_unique: Number(selectedConversionUnique.toFixed(2)),
            },
            last_7_days: {
                total_views: totalViews7d,
                total_requests: totalRequests7d,
                total_unique_views: totalUniqueViews7d,
                conversion_rate: Number(conversionRate7d.toFixed(2)),
                conversion_rate_unique: Number(conversionRateUnique7d.toFixed(2)),
            },
            last_30_days: {
                total_views: totalViews30d,
                total_requests: totalRequests30d,
                total_unique_views: totalUniqueViews30d,
                conversion_rate: Number(conversionRate30d.toFixed(2)),
                conversion_rate_unique: Number(conversionRateUnique30d.toFixed(2)),
            },
            most_viewed_services: viewedResult.rows,
            most_requested_services: requestedResult.rows,
            daily_trend: dailyTrend,
            service_metrics: serviceMetrics,
        });
    } catch (err) {
        return next(err);
    }
};

const getConsultingAnalyticsByService = async (req, res, next) => {
    try {
        const { id } = req.params;
        const parsedDays = Number.parseInt(req.query.days, 10);
        const days = parsedDays === 7 ? 7 : 30;

        const service = await consultingModel.getServiceByIdSimple(id);
        if (!service) return res.status(404).json({ error: 'Consulting service not found' });

        const counts = await consultingModel.getCountsByService(id);
        const views = Number(counts.views) || 0;
        const requests = Number(counts.requests) || 0;
        const conversionRate = views > 0 ? ((requests / views) * 100) : 0;
        const trend = await consultingModel.getTrendByService(id, days);

        return res.json({ service, views, requests, conversion_rate: Number(conversionRate.toFixed(2)), daily_trend: trend, days });
    } catch (err) {
        return next(err);
    }
};

const getConsultingRequests = async (req, res, next) => {
    try {
        const page = clamp(req.query.page, 1, 100000, 1);
        const limit = clamp(req.query.limit, 1, 100, 20);
        const offset = (page - 1) * limit;

        const { rows, total } = await consultingModel.getConsultingRequestsPaginated(limit, offset);
        return res.json({ requests: rows, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (err) {
        return next(err);
    }
};

const getConsultingRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const request = await consultingModel.getConsultingRequestById(id);
        if (!request) return res.status(404).json({ error: 'Consulting request not found' });
        return res.json({ request });
    } catch (err) {
        return next(err);
    }
};

const updateConsultingRequestById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const current = await consultingModel.getConsultingRequestById(id);
        if (!current) return res.status(404).json({ error: 'Consulting request not found' });

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

        const updated = await consultingModel.updateConsultingRequest(id, { status, priority, notes });
        return res.json({ message: 'Consulting request updated successfully', request: updated });
    } catch (err) {
        return next(err);
    }
};

const getAdminConsultingServices = async (_req, res, next) => {
    try {
        const rows = await consultingModel.getAllServicesAdmin();
        return res.json({ services: rows.map(mapService), count: rows.length });
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
