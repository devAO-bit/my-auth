import express from 'express';
import connectDB from './config/db.js';
import morgan from "morgan";
import { AppError } from "./utils/AppError.js";
import { globalErrorHandler } from "./utils/errorHandler.js";
import authRouter from './routes/auth.routes.js';

const app = express();

const port = 3000 || process.env.PORT;

// Connect DB first
await connectDB();

// Middleware
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Routes
app.use('/api/auth', authRouter);

// // 404 Handler
// app.all("*", (req, res, next) => {
//   next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
// });

// Global Error Handler
app.use(globalErrorHandler);


app.get('/', (req, res) => res.send('<h1>API is running...</h1>'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});