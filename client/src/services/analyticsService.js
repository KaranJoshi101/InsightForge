import api from './api';

const PLATFORM_SESSION_KEY = 'platform_session_id';

const getOrCreateSessionId = () => {
    const existing = localStorage.getItem(PLATFORM_SESSION_KEY);
    if (existing) {
        return existing;
    }

    const generated = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(PLATFORM_SESSION_KEY, generated);
    return generated;
};

const analyticsService = {
    trackEvent(payload) {
        const sessionId = payload?.session_id || getOrCreateSessionId();

        return api.post('/analytics/events', {
            event_type: payload.event_type,
            entity_type: payload.entity_type,
            entity_id: payload.entity_id ?? null,
            metadata: payload.metadata || undefined,
            session_id: sessionId,
        }, {
            headers: {
                'x-session-id': sessionId,
            },
        });
    },

    getOverview() {
        return api.get('/analytics/overview');
    },

    getTrends() {
        return api.get('/analytics/trends');
    },

    getTopContent() {
        return api.get('/analytics/top-content');
    },

    getModuleBreakdown() {
        return api.get('/analytics/module-breakdown');
    },
};

export default analyticsService;
