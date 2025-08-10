import express from 'express';
import connectDB from './config/db.js';

const app = express();

const port = 3000 || process.env.PORT;

// Connect DB first
await connectDB();

app.get('/', (req, res) => res.send('<h1>API is running...</h1>'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});