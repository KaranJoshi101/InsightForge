const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
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
    getPublicTrainingCategories,
    getAdminTrainingCategories,
    createTrainingCategory,
    updateTrainingCategory,
    deleteTrainingCategory,
    getCategoryNotes,
    createCategoryNote,
    updateCategoryNote,
    deleteCategoryNote,
    uploadTrainingNoteDocument,
} = require('../controllers/trainingController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { idParam, paginationQuery } = require('../middleware/routeValidators');

const notesUploadDir = path.join(__dirname, '..', 'uploads', 'training-notes');

const notesStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(notesUploadDir)) {
            fs.mkdirSync(notesUploadDir, { recursive: true });
        }
        cb(null, notesUploadDir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.random().toString(16).slice(2);
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${random}-${safeOriginal}`);
    },
});

const notesUpload = multer({
    storage: notesStorage,
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1,
    },
});

// Public route
router.get('/', paginationQuery, validateRequest, getPublicTrainingVideos);

// Public routes - playlists
router.get('/categories', getPublicTrainingCategories);
router.get('/categories/:categoryId/notes', idParam('categoryId'), validateRequest, getCategoryNotes);
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

// Admin routes - categories
router.get('/admin/categories', authenticate, authorize, getAdminTrainingCategories);
router.post('/admin/categories', authenticate, authorize, createTrainingCategory);
router.put('/admin/categories/:id', authenticate, authorize, idParam('id'), validateRequest, updateTrainingCategory);
router.delete('/admin/categories/:id', authenticate, authorize, idParam('id'), validateRequest, deleteTrainingCategory);

// Admin routes - category notes
router.get('/admin/categories/:categoryId/notes', authenticate, authorize, idParam('categoryId'), validateRequest, getCategoryNotes);
router.post('/admin/categories/:categoryId/notes', authenticate, authorize, idParam('categoryId'), validateRequest, createCategoryNote);
router.post('/admin/notes/upload-document', authenticate, authorize, notesUpload.single('file'), uploadTrainingNoteDocument);
router.put('/admin/notes/:id', authenticate, authorize, idParam('id'), validateRequest, updateCategoryNote);
router.delete('/admin/notes/:id', authenticate, authorize, idParam('id'), validateRequest, deleteCategoryNote);

// Admin routes - playlist items
router.post('/admin/playlists/:playlistId/items', authenticate, authorize, idParam('playlistId'), validateRequest, addVideoToPlaylist);
router.delete('/admin/playlists/:playlistId/items/:itemId', authenticate, authorize, idParam('playlistId'), idParam('itemId'), validateRequest, removeVideoFromPlaylist);
router.put('/admin/playlists/:playlistId/items/:itemId', authenticate, authorize, idParam('playlistId'), idParam('itemId'), validateRequest, updatePlaylistItemOrder);

module.exports = router;
