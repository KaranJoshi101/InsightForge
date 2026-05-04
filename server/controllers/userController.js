// User Controller (Admin user management and dashboard stats)
const { comparePassword, hashPassword } = require('../utils/auth');
const userModel = require('../models/userModel');

// Get all users (admin) with optional search
const getAllUsers = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = '' } = req.query;
        const { users, total } = await userModel.findUsers({ page: parseInt(page, 10), limit: parseInt(limit, 10), search });

        res.json({ users, pagination: { page: parseInt(page, 10), limit: parseInt(limit, 10), total, pages: Math.ceil(total / limit) } });
    } catch (err) {
        next(err);
    }
};

// Get a single user by id (admin only)
const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userModel.getUserById(id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// Ban user (admin only)
const banUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (parseInt(id, 10) === req.user.userId) {
            return res.status(400).json({
                error: 'You cannot ban yourself',
            });
        }
        const updated = await userModel.updateBan(id, true);
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User banned successfully', user: updated });
    } catch (err) {
        next(err);
    }
};

// Unban user (admin only)
const unbanUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updated = await userModel.updateBan(id, false);
        if (!updated) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User unbanned successfully', user: updated });
    } catch (err) {
        next(err);
    }
};

// Delete user permanently (admin only, banned users only)
const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id, 10);
        if (userId === req.user.userId) return res.status(400).json({ error: 'You cannot delete your own account' });

        const existing = await userModel.getUserForDeletion(userId);
        if (!existing) return res.status(404).json({ error: 'User not found' });
        if (existing.role === 'admin') return res.status(400).json({ error: 'Admin users cannot be deleted' });
        if (!existing.is_banned) return res.status(400).json({ error: 'Only banned users can be deleted' });

        await userModel.deleteUserById(userId);
        res.json({ message: 'User deleted successfully', id: userId });
    } catch (err) {
        next(err);
    }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await userModel.getDashboardStats();
        res.json({
            responses_per_survey: stats.responsesPerSurvey,
            survey_status_distribution: stats.surveyStatusDist,
            article_status_distribution: stats.articleStatusDist,
            survey_category_distribution: stats.surveyCategoryDist,
            survey_category_status_distribution: stats.surveyCategoryStatusDist,
            article_category_distribution: stats.articleCategoryDist,
            article_category_status_distribution: stats.articleCategoryStatusDist,
            media_status_distribution: stats.mediaStatusDist,
            training_video_status_distribution: stats.trainingVideoStatusDist,
            training_category_status_distribution: stats.trainingCategoryStatusDist,
            summary: stats.summary,
        });
    } catch (err) {
        next(err);
    }
};

// Get current user's profile
const getProfile = async (req, res, next) => {
    try {
        const user = await userModel.getProfile(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// Update current user's profile
const updateProfile = async (req, res, next) => {
    try {
        const { name, location, age, gender, phone, bio } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (age !== null && age !== undefined && age !== '') {
            const ageNum = parseInt(age);
            if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
                return res.status(400).json({ error: 'Age must be between 1 and 150' });
            }
        }

        const user = await userModel.updateProfile(req.user.userId, { name, location, age, gender, phone, bio });
        res.json({ message: 'Profile updated successfully', user });
    } catch (err) {
        next(err);
    }
};

// Change current user's password
const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                error: 'current_password and new_password are required',
            });
        }

        const user = await userModel.getPasswordHashById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const currentPasswordMatch = await comparePassword(current_password, user.password_hash);
        if (!currentPasswordMatch) {
            return res.status(400).json({
                error: 'Current password is incorrect',
            });
        }

        const isSamePassword = await comparePassword(new_password, user.password_hash);
        if (isSamePassword) {
            return res.status(400).json({
                error: 'New password must be different from current password',
            });
        }

        const newHash = await hashPassword(new_password);
        await userModel.updatePasswordHash(req.user.userId, newHash);

        return res.json({
            message: 'Password changed successfully',
        });
    } catch (err) {
        return next(err);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    banUser,
    unbanUser,
    deleteUser,
    getDashboardStats,
    getProfile,
    updateProfile,
    changePassword,
};
