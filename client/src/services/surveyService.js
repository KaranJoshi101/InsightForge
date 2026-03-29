import api from './api';

const surveyService = {
    // Get all surveys
    getAllSurveys: (page = 1, limit = 10, status = null, excludeFeedback = false) => {
        let url = `/surveys?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (excludeFeedback) url += '&exclude_feedback=true';
        return api.get(url);
    },

    // Get survey by ID
    getSurveyById: (id) =>
        api.get(`/surveys/${id}`),

    // Create survey (admin)
    createSurvey: (titleOrPayload, description) => {
        if (typeof titleOrPayload === 'object' && titleOrPayload !== null) {
            return api.post('/surveys', titleOrPayload);
        }
        return api.post('/surveys', { title: titleOrPayload, description });
    },

    // Update survey (admin)
    updateSurvey: (id, data) =>
        api.put(`/surveys/${id}`, data),

    // Delete survey (admin)
    deleteSurvey: (id) =>
        api.delete(`/surveys/${id}`),

    // Add question to survey (admin)
    addQuestion: (surveyId, question_text, question_type, is_required = true, order_index = 1) =>
        api.post(`/surveys/${surveyId}/questions`, {
            question_text,
            question_type,
            is_required,
            order_index,
        }),

    // Add option to question (admin)
    addOption: (questionId, option_text, order_index = 1) =>
        api.post(`/surveys/questions/${questionId}/options`, {
            option_text,
            order_index,
        }),

    // Update question (admin)
    updateQuestion: (questionId, data) =>
        api.put(`/surveys/questions/${questionId}`, data),

    // Delete question (admin)
    deleteQuestion: (questionId) =>
        api.delete(`/surveys/questions/${questionId}`),

    // Update option (admin)
    updateOption: (optionId, data) =>
        api.put(`/surveys/questions/options/${optionId}`, data),

    // Delete option from question (admin)
    deleteOption: (optionId) =>
        api.delete(`/surveys/questions/options/${optionId}`),

    // Upload files used as survey submission email attachments (admin)
    uploadSurveyEmailAttachments: (files) => {
        const formData = new FormData();
        Array.from(files || []).forEach((file) => {
            formData.append('files', file);
        });
        return api.post('/surveys/email-attachments', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Publish survey (admin)
    publishSurvey: (id) =>
        api.put(`/surveys/${id}`, { status: 'published' }),

    // Unpublish survey (admin)
    unpublishSurvey: (id) =>
        api.put(`/surveys/${id}`, { status: 'draft' }),
};

export default surveyService;
