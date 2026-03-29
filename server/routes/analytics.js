const express = require('express');

const router = express.Router();

const {
    trackPlatformEvent,
    getAnalyticsOverview,
    getAnalyticsTrends,
    getTopContent,
    getModuleBreakdown,
} = require('../controllers/analyticsController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');
const { analyticsEventValidation } = require('../middleware/routeValidators');
const { analyticsEventRateLimit } = require('../middleware/security');

router.post(
    '/events',
    analyticsEventRateLimit,
    optionalAuthenticate,
    analyticsEventValidation,
    validateRequest,
    trackPlatformEvent
);

router.get('/overview', authenticate, authorize, getAnalyticsOverview);
router.get('/trends', authenticate, authorize, getAnalyticsTrends);
router.get('/top-content', authenticate, authorize, getTopContent);
router.get('/module-breakdown', authenticate, authorize, getModuleBreakdown);

module.exports = router;
