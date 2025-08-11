import app from "./app.js";
import connectDB from "./config/db.js";
import config from "./config/env.js";
import logger from "./config/logger.js";

const start = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info(`Server running in ${config.nodeEnv} on port ${config.port}`);
  });

  // graceful shutdown
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received: closing HTTP server");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });
};

start().catch(err => {
  logger.fatal("Failed to start server", err);
  process.exit(1);
});
