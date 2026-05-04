import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    const jwtLikePattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (token && jwtLikePattern.test(token)) {
        config.headers.Authorization = `Bearer ${token}`;
    } else if (token) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
    return config;
});

// Handle response errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const requestUrl = String(error.config?.url || '');
        const isAuthFormRequest = requestUrl.includes('/auth/login')
            || requestUrl.includes('/auth/register')
            || requestUrl.includes('/auth/register/request-otp')
            || requestUrl.includes('/auth/register/verify-otp');

        const status = error.response?.status;
        const message = String(error.response?.data?.error || error.response?.data?.message || '').toLowerCase();
        const code = String(error.response?.data?.code || '');

        if (!isAuthFormRequest && status === 403 && (code === 'ACCOUNT_BANNED' || message.includes('banned'))) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
            return Promise.reject(error);
        }

        if (!isAuthFormRequest && error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
