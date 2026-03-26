const express = require('express');
const router = express.Router();
const {
    getPublicTrainingVideos,
    getAdminTrainingVideos,
    createTrainingVideo,
    updateTrainingVideo,
    deleteTrainingVideo,
    getPublicPlaylists,
    getAdminPlaylists,
    getPlaylistItems,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylistItemOrder,
} = require('../controllers/trainingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery } = require('../middleware/routeValidators');

// Public route
router.get('/', paginationQuery, validateRequest, getPublicTrainingVideos);

// Public routes - playlists
router.get('/playlists', getPublicPlaylists);
router.get('/playlists/:playlistId/items', idParam('playlistId'), validateRequest, getPlaylistItems);

// Admin routes - videos
router.get('/admin', authenticate, authorize, paginationQuery, validateRequest, getAdminTrainingVideos);
router.post('/', authenticate, authorize, validateRequest, createTrainingVideo);
router.put('/:id', authenticate, authorize, idParam('id'), validateRequest, updateTrainingVideo);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteTrainingVideo);

// Admin routes - playlists
router.get('/admin/playlists', authenticate, authorize, paginationQuery, validateRequest, getAdminPlaylists);
router.post('/admin/playlists', authenticate, authorize, validateRequest, createPlaylist);
router.put('/admin/playlists/:id', authenticate, authorize, idParam('id'), validateRequest, updatePlaylist);
router.delete('/admin/playlists/:id', authenticate, authorize, idParam('id'), validateRequest, deletePlaylist);

// Admin routes - playlist items
router.post('/admin/playlists/:playlistId/items', authenticate, authorize, idParam('playlistId'), validateRequest, addVideoToPlaylist);
router.delete('/admin/playlists/:playlistId/items/:itemId', authenticate, authorize, idParam('playlistId'), idParam('itemId'), validateRequest, removeVideoFromPlaylist);
router.put('/admin/playlists/:playlistId/items/:itemId', authenticate, authorize, idParam('playlistId'), idParam('itemId'), validateRequest, updatePlaylistItemOrder);

module.exports = router;
