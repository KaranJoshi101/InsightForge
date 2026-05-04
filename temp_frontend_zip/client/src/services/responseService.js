import api from './api';

const responseService = {
    // Submit survey response
    submitResponse: (survey_id, answers) =>
        api.post('/responses', { survey_id, answers }),

    // Get user's responses
    getUserResponses: (page = 1, limit = 10) =>
        api.get(`/responses/user?page=${page}&limit=${limit}`),

    // Get survey responses (admin)
    getSurveyResponses: (surveyId, page = 1, limit = 10) =>
        api.get(`/responses/survey/${surveyId}?page=${page}&limit=${limit}`),

    // Get response details
    getResponseDetails: (responseId) =>
        api.get(`/responses/${responseId}`),

    // Get survey analytics (admin)
    getSurveyAnalytics: (surveyId) =>
        api.get(`/responses/survey/${surveyId}/analytics`),

    // Export survey responses as Excel (admin)
    exportSurveyResponses: (surveyId) =>
        api.get(`/responses/survey/${surveyId}/export`, { responseType: 'blob' }),

    // Get survey demographics (admin)
    getSurveyDemographics: (surveyId) =>
        api.get(`/responses/survey/${surveyId}/demographics`),
};

export default responseService;
