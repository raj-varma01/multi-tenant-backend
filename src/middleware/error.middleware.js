import { env } from "../config/env.js";
import { AppError } from "../utils/errors.js";

export function notFoundHandler(req, res, next) {
    next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

export function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    if (err.name === "ValidationError") {
        statusCode = 400;
        message = Object.values(err.errors)
            .map((e) => e.message)
            .join(", ");
    } else if (err.code === 11000) {
        statusCode = 400;
        message = "Duplicate value violates a unique constraint";
    }

    if (!(err instanceof AppError) && statusCode === 500 && env.nodeEnv !== "production") {
        console.error(err);
    }
    const body = { success: false, message };
    if (env.nodeEnv === "development" && statusCode === 500) {
        body.stack = err.stack;
    }
    res.status(statusCode).json(body);
}
