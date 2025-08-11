import { AppError } from "../utils/AppError.js";

export const globalErrorHandler = (err, req, res, next) => {
  if (!(err instanceof AppError)) {
    console.error("UNEXPECTED ERROR:", err);
    err = new AppError("Something went wrong", 500, false);
  }

  const statusCode = err.statusCode || 500;
  const status = `${statusCode}`.startsWith("4") ? "fail" : "error";

  const response = {
    status,
    message: err.message
  };

  if (process.env.NODE_ENV === "development" && !err.isOperational) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

export default globalErrorHandler;
