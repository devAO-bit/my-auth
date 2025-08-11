import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { globalErrorHandler } from "./middlewares/error.middleware.js";
import config from "./config/env.js";

const app = express();

// security + body parsing
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// logging
if (config.nodeEnv === "development") app.use(morgan("dev"));

// routes
app.use("/api/v1", routes);

// 404
// app.all("*", (req, res, next) => {
//   const err = new Error(`Cannot find ${req.originalUrl} on this server`);
//   err.statusCode = 404;
//   err.isOperational = true;
//   next(err);
// });

// global error handler
app.use(globalErrorHandler);

export default app;
