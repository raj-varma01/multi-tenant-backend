export class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

export const badRequest = (msg) => new AppError(msg, 400);
export const unauthorized = (msg = "Unauthorized") => new AppError(msg, 401);
export const forbidden = (msg = "Access denied") => new AppError(msg, 403);
export const notFound = (msg = "Not found") => new AppError(msg, 404);
export const unprocessable = (msg) => new AppError(msg, 422);
