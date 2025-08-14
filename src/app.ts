// src/app.ts

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Import routes
import userRoutes from "./routes/user.route";
import authRoutes from "./routes/auth.route";
import locationRoutes from "./routes/location.routes";
import mediaRoutes from "./routes/media.route";
import notificationsRoutes from "./routes/notifications.routes";
import adminRoutes from "./routes/admin.routes";
import devotionalsRoutes from "./routes/devotionals.routes";
import logsRoutes from "./routes/logs.routes";
// import artistRoutes from "./routes/artist.route";
import gamesRoutes from "./routes/games.route";
import paymentRoutes from "./routes/payment.route";
import bookmarksRoutes from "./routes/bookmarks.routes";
import interactionRoutes from "./routes/interaction.routes";
import contentInteractionRoutes from "./routes/contentInteraction.routes";
import aiChatbotRoutes from "./routes/aiChatbot.routes";
import trendingRoutes from "./routes/trending.routes";
import userProfileRoutes from "./routes/userProfile.routes";
// import datingRoutes from "./routes/dating.route";

// Import services and utilities
import SocketService from "./service/socket.service";
import logger from "./utils/logger";
import swaggerSpec from "./config/swagger.config";
import swaggerUi from "swagger-ui-express";

// Create Express app
const app = express();
const server = createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Production-grade middleware setup
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "ws:", "wss:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();

  // Log request
  logger.info("Incoming request", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: req.userId || "anonymous",
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function (chunk?: any, encoding?: any): any {
    const duration = Date.now() - startTime;
    logger.logHttpRequest(req, res, duration);
    return originalEnd.call(this, chunk, encoding);
  };

  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
  });
});

// API documentation - enabled for testing
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Jevah API Documentation",
    customfavIcon: "/favicon.ico",
  })
);

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/devotionals", devotionalsRoutes);
app.use("/api/logs", logsRoutes);
// app.use("/api/artist", artistRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/bookmarks", bookmarksRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/content", contentInteractionRoutes);
app.use("/api/ai-chatbot", aiChatbotRoutes);
app.use("/api/trending", trendingRoutes);
app.use("/api/user-profiles", userProfileRoutes);

// Add a simple test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "Server is working!",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use("*", (req, res) => {
  logger.warn("Route not found", {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });

  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler
app.use(
  (
    error: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error("Unhandled error", {
      error: error.message,
      stack: error.stack,
      method: req.method,
      url: req.originalUrl,
      userId: req.userId || "anonymous",
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    res.status(error.status || 500).json({
      success: false,
      message: isDevelopment ? error.message : "Internal server error",
      ...(isDevelopment && { stack: error.stack }),
    });
  }
);

// Graceful shutdown handling
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

// Export both app and server for testing and Socket.IO access
export { app, server, socketService };
export default app;
