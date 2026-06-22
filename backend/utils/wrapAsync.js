const wrapAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((err) => {
            if (typeof next === "function") {
                next(err);
            } else {
                // Express 5 fallback: send error response directly
                const statusCode = err.statusCode || 500;
                res.status(statusCode).json({
                    status: err.status || statusCode,
                    message: err.message || "Internal Server Error",
                    errors: err.errors || [],
                });
            }
        });
    };
};

export default wrapAsync;
