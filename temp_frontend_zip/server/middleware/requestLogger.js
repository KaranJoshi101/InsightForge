// Request Logger Middleware
const requestLogger = (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function (data) {
        const duration = Date.now() - startTime;
        const timestamp = new Date().toISOString();

        console.log(`[${timestamp}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

        res.send = originalSend;
        return res.send(data);
    };

    next();
};

module.exports = {
    requestLogger,
};
