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
    getPublicPlaylists() {
        return api.get('/training/playlists');
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
