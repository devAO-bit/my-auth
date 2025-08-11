// logger.js
import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

// Define log directory
const logDir = path.join(process.cwd(), "logs");

// Custom log format
const logFormat = winston.format.printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.NODE_ENV === "development" ? "info" : "debug", // info level for dev
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    // Console transport (colored output for dev)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      ),
    }),

    // File transport (daily rotation)
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: "%DATE%-app.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "14d",
      level: "info", // Store info and above in file
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),

    // Error file transport
    new winston.transports.DailyRotateFile({
      dirname: logDir,
      filename: "%DATE%-error.log",
      datePattern: "YYYY-MM-DD",
      zippedArchive: true,
      maxSize: "20m",
      maxFiles: "30d",
      level: "error", // Only error logs
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
  exitOnError: false, // Prevent process exit on error
});

export default logger;
