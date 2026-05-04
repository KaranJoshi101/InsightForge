const { body, param, query } = require('express-validator');

const isDev = process.env.NODE_ENV !== 'production';

const lowercaseEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

const idParam = (paramName) => [
    param(paramName)
        .isInt({ min: 1 })
        .withMessage(`${paramName} must be a positive integer`)
        .toInt(),
];

const paginationQuery = [
    query('page')
        .optional()
        .isInt({ min: 1, max: 100000 })
        .withMessage('page must be a positive integer')
        .toInt(),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 500 })
        .withMessage('limit must be between 1 and 500')
        .toInt(),
];

const registerValidation = isDev
    ? [
        body('name').isString().trim().isLength({ min: 1, max: 100 }).withMessage('name is required'),
        body('email').isEmail().withMessage('email must be valid').customSanitizer(lowercaseEmail),
        body('password').isString().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
      ]
    : [
        body('name')
            .isString()
            .trim()
            .isLength({ min: 2, max: 100 })
            .withMessage('name must be between 2 and 100 characters'),
        body('email')
            .isEmail()
            .withMessage('email must be valid')
            .customSanitizer(lowercaseEmail),
        body('password')
            .isString()
            .isLength({ min: 10, max: 128 })
            .withMessage('password must be 10-128 characters long')
            .matches(/[a-z]/)
            .withMessage('password must include a lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('password must include an uppercase letter')
            .matches(/[0-9]/)
            .withMessage('password must include a number')
            .matches(/[^A-Za-z0-9]/)
            .withMessage('password must include a special character'),
      ];

const loginValidation = [
    body('email')
        .isEmail()
        .withMessage('email must be valid'),
    body('password')
        .isString()
        .isLength({ min: 1, max: 128 })
        .withMessage('password is required'),
];

const verifySignupOtpValidation = [
    body('email')
        .isEmail()
        .withMessage('email must be valid')
        .customSanitizer(lowercaseEmail),
    body('otp')
        .isString()
        .trim()
        .matches(/^\d{6}$/)
        .withMessage('otp must be a 6-digit code'),
];

const surveyWriteValidation = [
    body('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('title must be between 3 and 200 characters'),
    body('description')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('description must be at most 5000 characters'),
    body('status')
        .optional()
        .isIn(['draft', 'published', 'closed'])
        .withMessage('status must be draft, published, or closed'),
    body('submission_email_subject')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 255 })
        .withMessage('submission_email_subject must be at most 255 characters'),
    body('submission_email_body')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 10000 })
        .withMessage('submission_email_body must be at most 10000 characters'),
    body('submission_email_attachments')
        .optional({ nullable: true })
        .isArray({ max: 20 })
        .withMessage('submission_email_attachments must be an array with at most 20 items'),
    body('submission_email_attachments.*.name')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 255 })
        .withMessage('attachment name must be at most 255 characters'),
    body('submission_email_attachments.*.path')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 1000 })
        .withMessage('attachment path must be at most 1000 characters'),
    body('submission_email_attachments.*.url')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 2000 })
        .withMessage('attachment url must be at most 2000 characters'),
    body('allow_multiple_submissions')
        .optional()
        .isBoolean()
        .withMessage('allow_multiple_submissions must be a boolean')
        .toBoolean(),
    body('is_anonymous')
        .optional()
        .isBoolean()
        .withMessage('is_anonymous must be a boolean')
        .toBoolean(),
    body('collect_email')
        .optional()
        .isBoolean()
        .withMessage('collect_email must be a boolean')
        .toBoolean(),
    body('expiry_date')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('expiry_date must be a valid ISO 8601 datetime'),
];

const articleWriteValidation = [
    body('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 300 })
        .withMessage('title must be between 3 and 300 characters'),
    body('meta_description')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 160 })
        .withMessage('meta_description must be at most 160 characters'),
    body('tags')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 5000 })
        .withMessage('tags must be at most 5000 characters'),
    body('reading_time_minutes')
        .optional({ nullable: true })
        .isInt({ min: 1, max: 1440 })
        .withMessage('reading_time_minutes must be between 1 and 1440')
        .toInt(),
    // content validation removed for training_notes
    body('content')
        .optional()
        .isString()
        .isLength({ min: 1, max: 2000000 })
        .withMessage('content must be between 1 and 2000000 characters'),
    body('is_published')
        .optional()
        .isBoolean()
        .withMessage('is_published must be a boolean')
        .toBoolean(),
];

const articleScheduleValidation = [
    body('publish_date')
        .isISO8601()
        .withMessage('publish_date must be a valid ISO 8601 datetime'),
];

const profileUpdateValidation = [
    body('name')
        .isString()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('name must be between 2 and 100 characters'),
    body('location')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 120 })
        .withMessage('location must be at most 120 characters'),
    body('age')
        .optional({ nullable: true })
        .custom((value) => value === '' || Number.isInteger(Number(value)))
        .withMessage('age must be a valid integer'),
    body('gender')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 30 })
        .withMessage('gender must be at most 30 characters'),
    body('phone')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 30 })
        .withMessage('phone must be at most 30 characters'),
    body('bio')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('bio must be at most 2000 characters'),
];

const changePasswordValidation = isDev
    ? [
        body('current_password')
            .isString()
            .isLength({ min: 1, max: 128 })
            .withMessage('current_password is required'),
        body('new_password')
            .isString()
            .isLength({ min: 6, max: 128 })
            .withMessage('new_password must be 6-128 characters long'),
        body('confirm_new_password')
            .isString()
            .custom((value, { req }) => value === req.body.new_password)
            .withMessage('confirm_new_password must match new_password'),
      ]
    : [
        body('current_password')
            .isString()
            .isLength({ min: 1, max: 128 })
            .withMessage('current_password is required'),
        body('new_password')
            .isString()
            .isLength({ min: 10, max: 128 })
            .withMessage('new_password must be 10-128 characters long')
            .matches(/[a-z]/)
            .withMessage('new_password must include a lowercase letter')
            .matches(/[A-Z]/)
            .withMessage('new_password must include an uppercase letter')
            .matches(/[0-9]/)
            .withMessage('new_password must include a number')
            .matches(/[^A-Za-z0-9]/)
            .withMessage('new_password must include a special character'),
        body('confirm_new_password')
            .isString()
            .custom((value, { req }) => value === req.body.new_password)
            .withMessage('confirm_new_password must match new_password'),
      ];

const submitResponseValidation = [
    body('survey_id')
        .isInt({ min: 1 })
        .withMessage('survey_id must be a positive integer')
        .toInt(),
    body('answers')
        .isArray({ min: 1, max: 500 })
        .withMessage('answers must be an array with 1 to 500 items'),
    body('answers.*.question_id')
        .isInt({ min: 1 })
        .withMessage('question_id must be a positive integer')
        .toInt(),
    body('answers.*.answer_text')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 10000 })
        .withMessage('answer_text must be at most 10000 characters'),
    body('answers.*.option_id')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('option_id must be a positive integer')
        .toInt(),
];

const consultingServiceWriteValidation = [
    body('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 200 })
        .withMessage('title must be between 3 and 200 characters'),
    body('slug')
        .optional()
        .isString()
        .trim()
        .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
        .withMessage('slug must be lowercase words separated by hyphens'),
    body('short_description')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 20, max: 500 })
        .withMessage('short_description must be between 20 and 500 characters'),
        body('hero_subtitle')
            .optional({ nullable: true })
            .isString()
            .isLength({ min: 20, max: 400 })
            .withMessage('hero_subtitle must be between 20 and 400 characters'),
        body('hero_benefits')
            .optional({ nullable: true })
            .isArray({ min: 1, max: 6 })
            .withMessage('hero_benefits must be an array with 1 to 6 items'),
        body('hero_benefits.*')
            .optional({ nullable: true })
            .isString()
            .trim()
            .isLength({ min: 4, max: 180 })
            .withMessage('each hero benefit must be between 4 and 180 characters'),
    body('content')
        .optional()
        .isString()
        .isLength({ min: 30, max: 50000 })
        .withMessage('content must be between 30 and 50000 characters'),
    body('deliverables')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 10000 })
        .withMessage('deliverables must be at most 10000 characters'),
    body('target_audience')
        .optional({ nullable: true })
        .isString()
        .isLength({ max: 5000 })
        .withMessage('target_audience must be at most 5000 characters'),
    body('is_active')
        .optional()
        .isBoolean()
        .withMessage('is_active must be a boolean')
        .toBoolean(),
];

const consultingRequestValidation = [
    body('service_id')
        .isInt({ min: 1 })
        .withMessage('service_id must be a positive integer')
        .toInt(),
    body('name')
        .isString()
        .trim()
        .isLength({ min: 2, max: 120 })
        .withMessage('name must be between 2 and 120 characters'),
    body('email')
        .isEmail()
        .withMessage('email must be valid')
        .customSanitizer(lowercaseEmail),
    body('message')
        .isString()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('message must be between 10 and 5000 characters'),
];

const consultingEventValidation = [
    body('service_id')
        .isInt({ min: 1 })
        .withMessage('service_id must be a positive integer')
        .toInt(),
    body('event_type')
        .isIn(['view', 'submit'])
        .withMessage('event_type must be either view or submit'),
    body('session_id')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ min: 8, max: 120 })
        .withMessage('session_id must be between 8 and 120 characters'),
    body('metadata')
        .optional({ nullable: true })
        .isObject()
        .withMessage('metadata must be a JSON object'),
];

const consultingAnalyticsServiceValidation = [
    ...idParam('id'),
    query('days')
        .optional()
        .isIn(['7', '30'])
        .withMessage('days must be 7 or 30')
        .toInt(),
];

const consultingRequestAdminUpdateValidation = [
    ...idParam('id'),
    body('status')
        .optional()
        .isIn(['new', 'in_progress', 'waiting_user', 'resolved', 'closed'])
        .withMessage('status must be one of new, in_progress, waiting_user, resolved, closed'),
    body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('priority must be one of low, medium, high, urgent'),
    body('notes')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('notes must be at most 5000 characters'),
];

const consultingRequestAdminIdValidation = [
    ...idParam('id'),
];

const analyticsEventValidation = [
    body('event_type')
        .isIn(['page_view', 'survey_submit', 'consulting_view', 'consulting_request', 'article_view', 'media_view', 'training_view'])
        .withMessage('event_type is invalid'),
    body('entity_type')
        .isIn(['survey', 'article', 'media', 'training', 'consulting', 'platform'])
        .withMessage('entity_type is invalid'),
    body('entity_id')
        .optional({ nullable: true })
        .custom((value) => value === null || Number.isInteger(Number(value)))
        .withMessage('entity_id must be an integer or null')
        .customSanitizer((value) => {
            if (value === null || value === undefined || value === '') return null;
            return Number.parseInt(value, 10);
        }),
    body('metadata')
        .optional({ nullable: true })
        .isObject()
        .withMessage('metadata must be a JSON object'),
    body('session_id')
        .optional({ nullable: true })
        .isString()
        .trim()
        .isLength({ min: 8, max: 120 })
        .withMessage('session_id must be between 8 and 120 characters'),
];

module.exports = {
    idParam,
    paginationQuery,
    registerValidation,
    loginValidation,
    verifySignupOtpValidation,
    surveyWriteValidation,
    articleWriteValidation,
    articleScheduleValidation,
    profileUpdateValidation,
    changePasswordValidation,
    submitResponseValidation,
    consultingServiceWriteValidation,
    consultingRequestValidation,
    consultingEventValidation,
    consultingAnalyticsServiceValidation,
    consultingRequestAdminUpdateValidation,
    consultingRequestAdminIdValidation,
    analyticsEventValidation,
};
