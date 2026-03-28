import api from './api';

const trainingService = {
    getPublicTrainingVideos(limit = 6) {
        return api.get('/training', { params: { limit } });
    },

    getAdminTrainingVideos(page = 1, limit = 20) {
        return api.get('/training/admin', { params: { page, limit } });
    },

    createTrainingVideo(payload) {
        return api.post('/training', payload);
    },

    updateTrainingVideo(id, payload) {
        return api.put(`/training/${id}`, payload);
    },

    deleteTrainingVideo(id) {
        return api.delete(`/training/${id}`);
    },

    // Playlist methods
    getPublicCategories() {
        return api.get('/training/categories');
    },

    getCategoryNotes(categoryId) {
        return api.get(`/training/categories/${categoryId}/notes`);
    },

    getPublicPlaylists() {
        return api.get('/training/playlists');
    },

    getAdminCategories() {
        return api.get('/training/admin/categories');
    },

    createCategory(payload) {
        return api.post('/training/admin/categories', payload);
    },

    updateCategory(id, payload) {
        return api.put(`/training/admin/categories/${id}`, payload);
    },

    deleteCategory(id) {
        return api.delete(`/training/admin/categories/${id}`);
    },

    getAdminCategoryNotes(categoryId) {
        return api.get(`/training/admin/categories/${categoryId}/notes`);
    },

    createCategoryNote(categoryId, payload) {
        return api.post(`/training/admin/categories/${categoryId}/notes`, payload);
    },

    uploadCategoryNoteDocument(file) {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/training/admin/notes/upload-document', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    updateCategoryNote(id, payload) {
        return api.put(`/training/admin/notes/${id}`, payload);
    },

    deleteCategoryNote(id) {
        return api.delete(`/training/admin/notes/${id}`);
    },

    getAdminPlaylists(page = 1, limit = 20) {
        return api.get('/training/admin/playlists', { params: { page, limit } });
    },

    getPlaylistItems(playlistId) {
        return api.get(`/training/playlists/${playlistId}/items`);
    },

    createPlaylist(payload) {
        return api.post('/training/admin/playlists', payload);
    },

    updatePlaylist(id, payload) {
        return api.put(`/training/admin/playlists/${id}`, payload);
    },

    deletePlaylist(id) {
        return api.delete(`/training/admin/playlists/${id}`);
    },

    addVideoToPlaylist(playlistId, payload) {
        return api.post(`/training/admin/playlists/${playlistId}/items`, payload);
    },

    removeVideoFromPlaylist(playlistId, itemId) {
        return api.delete(`/training/admin/playlists/${playlistId}/items/${itemId}`);
    },

    updatePlaylistItemOrder(playlistId, itemId, payload) {
        return api.put(`/training/admin/playlists/${playlistId}/items/${itemId}`, payload);
    },
};

export default trainingService;
