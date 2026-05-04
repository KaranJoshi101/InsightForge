import api from './api';

const userService = {
    // Get current user's profile
    getProfile: () =>
        api.get('/users/profile'),

    // Update current user's profile
    updateProfile: (data) =>
        api.put('/users/profile', data),

    // Change current user's password
    changePassword: (current_password, new_password, confirm_new_password) =>
        api.put('/users/profile/password', {
            current_password,
            new_password,
            confirm_new_password,
        }),

    // Get all users (admin)
    getAllUsers: (page = 1, limit = 20, search = '') => {
        let url = `/users?page=${page}&limit=${limit}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        return api.get(url);
    },

    // Get a single user (admin)
    getUserById: (id) =>
        api.get(`/users/${id}`),

    // Ban user (admin)
    banUser: (id) =>
        api.put(`/users/${id}/ban`),

    // Unban user (admin)
    unbanUser: (id) =>
        api.put(`/users/${id}/unban`),

    // Delete user permanently (admin)
    deleteUser: (id) =>
        api.delete(`/users/${id}`),

    // Get dashboard stats (admin)
    getDashboardStats: () =>
        api.get('/users/dashboard-stats'),
};

export default userService;
