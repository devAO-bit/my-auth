export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Distinguish expected vs. programming errors
    this.isOperational = true;

    // Maintain stack trace (important for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}
