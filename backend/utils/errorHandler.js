import { AppError } from "../utils/AppError.js";

// eslint-disable-next-line no-unused-vars
export const globalErrorHandler = (err, req, res, next) => {
    // If error isn't an AppError, convert it
    if (!(err instanceof AppError)) {
        console.error("UNEXPECTED ERROR:", err);
        err = new AppError("Something went wrong", 500);
    }

    const statusCode = err.statusCode || 500;
    const status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    if (process.env.NODE_ENV === "development") {
        res.status(statusCode).json({
            status,
            message: err.message,
            stack: err.stack
        });
    } else {
        res.status(statusCode).json({
            status,
            message: err.message
        });
    }
};