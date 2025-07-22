import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/database.js";
import setupMiddleware from "./config/middleware.js";
import setupRoutes from "./config/routes.js";
import { logInfo, logError } from "./utils/logger.js";

dotenv.config();

const app = express();

// Setup middleware
setupMiddleware(app);

// Connect to database
connectDB();

// Setup routes
setupRoutes(app);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logInfo(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logInfo('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logInfo('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logInfo('SIGINT received, shutting down gracefully');
  server.close(() => {
    logInfo('Process terminated');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logError('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logError('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
