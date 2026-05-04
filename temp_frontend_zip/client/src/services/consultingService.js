import api from './api';

const CONSULTING_SESSION_KEY = 'consulting_session_id';

const getOrCreateSessionId = () => {
    const existing = localStorage.getItem(CONSULTING_SESSION_KEY);
    if (existing) {
        return existing;
    }

    const generated = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(CONSULTING_SESSION_KEY, generated);
    return generated;
};

const consultingService = {
    getServices() {
        return api.get('/consulting');
    },

    getServiceBySlug(slug) {
        return api.get(`/consulting/${slug}`);
    },

    submitRequest(payload) {
        const formData = new FormData();
        formData.append('service_id', String(payload.service_id));
        formData.append('name', payload.name);
        formData.append('email', payload.email);
        formData.append('message', payload.message);

        if (payload.file) {
            formData.append('file', payload.file);
        }

        return api.post('/consulting/request', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    trackEvent(payload) {
        const sessionId = payload?.session_id || getOrCreateSessionId();

        return api.post('/consulting/events', {
            service_id: payload.service_id,
            event_type: payload.event_type,
            session_id: sessionId,
            metadata: payload.metadata || undefined,
        }, {
            headers: {
                'x-session-id': sessionId,
            },
        });
    },

    getAdminServices() {
        return api.get('/consulting/admin/services');
    },

    createService(payload) {
        return api.post('/consulting', payload);
    },

    updateService(id, payload) {
        return api.put(`/consulting/${id}`, payload);
    },

    deleteService(id) {
        return api.delete(`/consulting/${id}`);
    },

    getRequests(page = 1, limit = 20) {
        return api.get('/consulting/requests', {
            params: { page, limit },
        });
    },

    getRequestById(id) {
        return api.get(`/consulting/requests/${id}`);
    },

    updateRequest(id, payload) {
        return api.put(`/consulting/requests/${id}`, payload);
    },

    getAnalyticsOverview(period = '30d') {
        return api.get('/consulting/analytics/overview', {
            params: { period },
        });
    },

    getServiceAnalytics(serviceId, days = 30) {
        return api.get(`/consulting/analytics/service/${serviceId}`, {
            params: { days },
        });
    },
};

export default consultingService;
