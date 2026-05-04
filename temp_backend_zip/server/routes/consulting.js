const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

const {
    getConsultingServices,
    getConsultingServiceBySlug,
    createConsultingService,
    updateConsultingService,
    deleteConsultingService,
    submitConsultingRequest,
    trackConsultingEvent,
    getConsultingAnalyticsOverview,
    getConsultingAnalyticsByService,
    getConsultingRequests,
    getConsultingRequestById,
    updateConsultingRequestById,
    getAdminConsultingServices,
} = require('../controllers/consultingController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const {
    idParam,
    paginationQuery,
    consultingServiceWriteValidation,
    consultingRequestValidation,
    consultingEventValidation,
    consultingAnalyticsServiceValidation,
    consultingRequestAdminUpdateValidation,
    consultingRequestAdminIdValidation,
} = require('../middleware/routeValidators');

const uploadDir = path.join(__dirname, '..', 'uploads', 'consulting-requests');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const timestamp = Date.now();
        const random = Math.random().toString(16).slice(2);
        const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${timestamp}-${random}-${safeOriginal}`);
    },
});

const allowedMimeTypes = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
]);

const upload = multer({
    storage,
    limits: {
        fileSize: 25 * 1024 * 1024,
        files: 1,
    },
    fileFilter: (_req, file, cb) => {
        if (!allowedMimeTypes.has(file.mimetype)) {
            return cb(new Error('Unsupported file type. Please upload PDF, DOC, DOCX, XLS, XLSX, CSV, or TXT.'));
        }
        return cb(null, true);
    },
});

const handleRequestUpload = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (!err) {
            return next();
        }

        return res.status(400).json({ error: err.message || 'File upload failed' });
    });
};

// Public routes
router.get('/', getConsultingServices);

// Request submission route (authenticated users only)
router.post(
    '/request',
    authenticate,
    handleRequestUpload,
    consultingRequestValidation,
    validateRequest,
    submitConsultingRequest
);

router.post(
    '/events',
    optionalAuthenticate,
    consultingEventValidation,
    validateRequest,
    trackConsultingEvent
);

// Admin routes
router.get('/admin/services', authenticate, authorize, getAdminConsultingServices);
router.get('/analytics/overview', authenticate, authorize, getConsultingAnalyticsOverview);
router.get('/analytics/service/:id', authenticate, authorize, consultingAnalyticsServiceValidation, validateRequest, getConsultingAnalyticsByService);
router.get('/requests/:id', authenticate, authorize, consultingRequestAdminIdValidation, validateRequest, getConsultingRequestById);
router.put('/requests/:id', authenticate, authorize, consultingRequestAdminUpdateValidation, validateRequest, updateConsultingRequestById);
router.get('/requests', authenticate, authorize, paginationQuery, validateRequest, getConsultingRequests);
router.post('/', authenticate, authorize, consultingServiceWriteValidation, validateRequest, createConsultingService);
router.put('/:id', authenticate, authorize, idParam('id'), consultingServiceWriteValidation, validateRequest, updateConsultingService);
router.delete('/:id', authenticate, authorize, idParam('id'), validateRequest, deleteConsultingService);

// Public parameterized route must remain last
router.get('/:slug', getConsultingServiceBySlug);

module.exports = router;
