// Error Handler Middleware
const errorHandler = (err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error('❌ Error:', err);
    } else {
        console.error('❌ Error:', {
            message: err.message,
            code: err.code,
            statusCode: err.statusCode,
        });
    }

    // Default error response
    let statusCode = err.statusCode || 500;
    let message = process.env.NODE_ENV === 'development'
        ? (err.message || 'Internal Server Error')
        : 'Internal Server Error';

    // Handle specific error types
    if (err.code === 'UNIQUE_VIOLATION') {
        statusCode = 409;
        message = 'This email is already registered';
    }

    if (err.code === 'FOREIGN_KEY_VIOLATION') {
        statusCode = 400;
        message = 'Invalid reference to another record';
    }

    res.status(statusCode).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};

module.exports = {
    errorHandler,
};
