import mongoose from "mongoose";
import config from "./env.js";
import logger from "./logger.js";

let isConnected = false;
let retries = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  if (isConnected) {
    logger.debug("🔄 Using existing MongoDB connection");
    return;
  }

  const uris = process.env.MONGO_URIS ? process.env.MONGO_URIS.split(",") : [config.mongoUri];

  const connectAttempt = async (uri) => {
    try {
      const conn = await mongoose.connect(uri.trim(), {
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        retryWrites: true,
        autoIndex: process.env.NODE_ENV !== "production"
      });

      isConnected = true;
      retries = 0;
      logger.info(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    } catch (err) {
      retries++;
      logger.error(`❌ MongoDB connection error (attempt ${retries}): ${err.message}`);
      if (retries <= MAX_RETRIES) {
        const delay = Math.min(5000 * retries, 30000);
        logger.info(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        return connectAttempt(uri);
      } else {
        logger.fatal("🚨 Max MongoDB connection retries reached. Exiting.");
        process.exit(1);
      }
    }
  };

  for (const uri of uris) {
    if (!isConnected) await connectAttempt(uri);
  }

  if (process.env.NODE_ENV === "development") {
    mongoose.set("debug", (coll, method, query, doc) => {
      logger.debug(`[mongo] ${coll}.${method} ${JSON.stringify(query)} ${doc || ""}`);
    });
  }

  mongoose.set("bufferCommands", false);

  mongoose.connection.on("disconnected", () => logger.warn("⚠️ MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => logger.info("🔄 MongoDB reconnected"));
  mongoose.connection.on("error", err => logger.error("❌ MongoDB error", err));

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    logger.info("🛑 MongoDB connection closed on app termination");
    process.exit(0);
  });
};

export default connectDB;
