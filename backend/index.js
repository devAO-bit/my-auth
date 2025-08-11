import express from 'express';
import connectDB from './config/db.js';
import morgan from "morgan";
import { globalErrorHandler } from "./utils/errorHandler.js";
import authRouter from './routes/auth.routes.js';
import cors from 'cors';
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv';
import validateEnv from './utils/validateEnv.js';

dotenv.config();
validateEnv();

const app = express();

const port = 3000 || process.env.PORT;

// Connect DB first
await connectDB();

// Middleware
app.use(express.json());
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
});
app.use(limiter);

// Routes
app.use('/api/auth', authRouter);

// Global Error Handler
app.use(globalErrorHandler);

app.get('/', (req, res) => res.send('<h1>API is running...</h1>'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});