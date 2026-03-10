const { body, param, query } = require('express-validator');

const isDev = process.env.NODE_ENV !== 'production';

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
        body('email').isEmail().withMessage('email must be valid').normalizeEmail(),
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
            .normalizeEmail(),
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
];

const articleWriteValidation = [
    body('title')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 3, max: 300 })
        .withMessage('title must be between 3 and 300 characters'),
    body('content')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 200000 })
        .withMessage('content must be between 1 and 200000 characters'),
    body('is_published')
        .optional()
        .isBoolean()
        .withMessage('is_published must be a boolean')
        .toBoolean(),
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

module.exports = {
    idParam,
    paginationQuery,
    registerValidation,
    loginValidation,
    surveyWriteValidation,
    articleWriteValidation,
    profileUpdateValidation,
    submitResponseValidation,
};
