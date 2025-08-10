import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Do not let Mongoose queue (buffer) queries when the database is disconnected
mongoose.set('bufferCommands', false);

// Debug mode only in development
if (process.env.NODE_ENV === 'development') {
    mongoose.set('debug', true);
}

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    process.exit(1);
}

const connectDB = async (retries = 5, delay = 5000) => {
    while (retries) {
        try {
            await mongoose.connect(MONGO_URI, {
                maxPoolSize: 10,       // limit concurrent DB connections
                minPoolSize: 2,        // keep some warm connections
                serverSelectionTimeoutMS: 5000, // fail fast if DB is down
                socketTimeoutMS: 45000, // close slow connections
                family: 4              // force IPv4
            });

            console.log('✅ MongoDB connected:', mongoose.connection.host);
            break;
        } catch (err) {
            retries -= 1;
            console.error(`❌ MongoDB connection error: ${err.message}`);
            if (!retries) {
                console.error('💀 All retries failed, exiting...');
                process.exit(1);
            }
            console.log(`⏳ Retrying in ${delay / 1000}s... (${retries} retries left)`);
            await new Promise(res => setTimeout(res, delay));
        }
    }
};

// Handle connection events
mongoose.connection.on('connected', () => {
    console.log('🔌 Mongoose connected to DB');
});

mongoose.connection.on('error', err => {
    console.error('⚠️ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Mongoose disconnected');
});


// Graceful shutdown for different signals
const gracefulExit = async (signal) => {
    console.log(`📴 Received ${signal}, closing MongoDB connection...`);
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed.');
    process.exit(0);
};

process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));

export default connectDB;

