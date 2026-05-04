/**
 * Input sanitization to prevent XSS attacks
 */

export const sanitizeHtml = (html) => {
    if (!html) return '';

    // Create a temporary container
    const temp = document.createElement('div');
    temp.textContent = html; // textContent automatically escapes HTML
    return temp.innerHTML;
};

export const sanitizeText = (text) => {
    return String(text || '')
        .trim()
        .replace(/[<>]/g, ''); // Remove angle brackets
};

export const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }

    const sanitized = {};
    Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeText(value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    });

    return sanitized;
};

/**
 * Validation utilities
 */

export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateUrl = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const validateSurveyQuestion = (question) => {
    const errors = [];

    if (!question.question_text || question.question_text.trim().length === 0) {
        errors.push('Question text is required');
    }

    if (!question.question_type) {
        errors.push('Question type is required');
    }

    const optionBasedTypes = ['multiple_choice', 'checkbox'];
    if (optionBasedTypes.includes(question.question_type)) {
        if (!question.options || question.options.length < 2) {
            errors.push('At least 2 options are required for this question type');
        }

        const hasEmptyOption = question.options.some(
            (opt) => !opt.option_text || opt.option_text.trim().length === 0
        );
        if (hasEmptyOption) {
            errors.push('All options must have text');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const validateSurvey = (survey) => {
    const errors = [];

    if (!survey.title || survey.title.trim().length === 0) {
        errors.push('Survey title is required');
    }

    if (survey.title && survey.title.length > 255) {
        errors.push('Survey title must be 255 characters or less');
    }

    if (!survey.questions || survey.questions.length === 0) {
        errors.push('Survey must have at least 1 question');
    }

    if (survey.questions) {
        survey.questions.forEach((question, index) => {
            const questionValidation = validateSurveyQuestion(question);
            if (!questionValidation.valid) {
                questionValidation.errors.forEach((err) => {
                    errors.push(`Question ${index + 1}: ${err}`);
                });
            }
        });
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const validateArticle = (article) => {
    const errors = [];

    if (!article.title || article.title.trim().length === 0) {
        errors.push('Article title is required');
    }

    if (article.title && (article.title.length < 3 || article.title.length > 300)) {
        errors.push('Article title must be between 3 and 300 characters');
    }

    if (!article.content || article.content.trim().length === 0) {
        errors.push('Article content is required');
    }

    if (article.meta_description && article.meta_description.length > 160) {
        errors.push('Meta description must be 160 characters or less');
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};

export const validatePassword = (password, isDev = false) => {
    const errors = [];

    if (!password || password.length === 0) {
        errors.push('Password is required');
        return { valid: false, errors };
    }

    if (isDev) {
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
    } else {
        if (password.length < 10) {
            errors.push('Password must be at least 10 characters');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('Password must include a lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must include an uppercase letter');
        }
        if (!/[0-9]/.test(password)) {
            errors.push('Password must include a number');
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
            errors.push('Password must include a special character');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
};
