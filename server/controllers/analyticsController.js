const pool = require('../config/database');
const analyticsModel = require('../models/analyticsModel');

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

        const event = await analyticsModel.insertPlatformEvent({ event_type: eventType, entity_type: entityType, entity_id: entityId, user_id: userId, session_id: sessionId, metadata });
        res.setHeader('x-session-id', sessionId);
        return res.status(201).json({ message: 'Event tracked successfully', event });
    } catch (err) {
        return next(err);
    }
};

const getAnalyticsOverview = async (_req, res, next) => {
    try {
        const overview = await analyticsModel.getOverview();
        return res.json(overview || {
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
        const rows = await analyticsModel.getTrends();
        const byDay = new Map();
        for (const row of rows) {
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

        return res.json({ daily });
    } catch (err) {
        return next(err);
    }
};

const getTopContent = async (_req, res, next) => {
    try {
        const [topSurveys, topArticles, topConsulting, topMedia, topTraining] = await analyticsModel.getTopContent();
        return res.json({
            top_surveys: topSurveys.map((r) => ({ ...r, submissions: toNumber(r.submissions) })),
            top_articles: topArticles.map((r) => ({ ...r, views: toNumber(r.views) })),
            top_consulting: topConsulting.map((r) => ({ id: r.id, title: r.title, views: toNumber(r.views), requests: toNumber(r.requests), total_engagement: toNumber(r.total_engagement) })),
            top_media: topMedia.map((r) => ({ ...r, views: toNumber(r.views) })),
            top_training: topTraining.map((r) => ({ ...r, views: toNumber(r.views) })),
        });
    } catch (err) {
        return next(err);
    }
};

const getModuleBreakdown = async (_req, res, next) => {
    try {
        const rows = await analyticsModel.getModuleBreakdown(VALID_ENTITY_TYPES);
        const byType = new Map(rows.map((row) => [row.entity_type, toNumber(row.events)]));
        const mapped = VALID_ENTITY_TYPES.map((entityType) => ({ entity_type: entityType, events: byType.get(entityType) || 0 }));
        const total = mapped.reduce((acc, row) => acc + toNumber(row.events), 0);
        const modules = mapped.map((row) => ({ entity_type: row.entity_type, events: toNumber(row.events), percentage: total > 0 ? Number(((toNumber(row.events) / total) * 100).toFixed(2)) : 0 }));
        return res.json({ total_events: total, modules });
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
