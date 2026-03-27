import api from './api';

const authService = {
    // Request signup OTP
    requestSignupOtp: (name, email, password) =>
        api.post('/auth/register/request-otp', { name, email, password }),

    // Verify signup OTP and complete registration
    verifySignupOtp: (email, otp) =>
        api.post('/auth/register/verify-otp', { email, otp }),

    // Register user
    register: (name, email, password) =>
        api.post('/auth/register', { name, email, password }),

    // Login user
    login: (email, password) =>
        api.post('/auth/login', { email, password }),

    // Get current user
    getCurrentUser: () =>
        api.get('/auth/me'),

    // Logout (clear local storage)
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
};

export default authService;
