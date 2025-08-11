"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.socketService = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
// Import routes
const user_route_1 = __importDefault(require("./routes/user.route"));
const auth_route_1 = __importDefault(require("./routes/auth.route"));
const location_routes_1 = __importDefault(require("./routes/location.routes"));
const media_route_1 = __importDefault(require("./routes/media.route"));
const notifications_routes_1 = __importDefault(require("./routes/notifications.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const devotionals_routes_1 = __importDefault(require("./routes/devotionals.routes"));
const logs_routes_1 = __importDefault(require("./routes/logs.routes"));
const artist_route_1 = __importDefault(require("./routes/artist.route"));
const games_route_1 = __importDefault(require("./routes/games.route"));
const payment_route_1 = __importDefault(require("./routes/payment.route"));
const bookmarks_routes_1 = __importDefault(require("./routes/bookmarks.routes"));
// Import services and utilities
const socket_service_1 = __importDefault(require("./service/socket.service"));
const logger_1 = __importDefault(require("./utils/logger"));
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
// Initialize Socket.IO service
const socketService = new socket_service_1.default(server);
exports.socketService = socketService;
// Production-grade middleware setup
app.use((0, helmet_1.default)({
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
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
}));
// Compression middleware
app.use((0, compression_1.default)());
// Body parsing middleware
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
// Request logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    // Log request
    logger_1.default.info("Incoming request", {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
        userId: req.userId || "anonymous",
    });
    // Override res.end to log response
    const originalEnd = res.end;
    res.end = function (chunk, encoding) {
        const duration = Date.now() - startTime;
        logger_1.default.logHttpRequest(req, res, duration);
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
// Simple test routes
app.get("/api/test", (req, res) => {
    res.json({
        message: "Server is working!",
        timestamp: new Date().toISOString(),
        status: "success"
    });
});
app.get("/api/status", (req, res) => {
    res.json({
        status: "running",
        mongodb: "connected",
        socketio: "ready",
        timestamp: new Date().toISOString()
    });
});
// API Routes
app.use("/api/users", user_route_1.default);
app.use("/api/auth", auth_route_1.default);
app.use("/api/location", location_routes_1.default);
app.use("/api/media", media_route_1.default);
app.use("/api/notifications", notifications_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
app.use("/api/devotionals", devotionals_routes_1.default);
app.use("/api/logs", logs_routes_1.default);
app.use("/api/artist", artist_route_1.default);
app.use("/api/games", games_route_1.default);
app.use("/api/payment", payment_route_1.default);
app.use("/api/bookmarks", bookmarks_routes_1.default);
// 404 handler
app.use("*", (req, res) => {
    logger_1.default.warn("Route not found", {
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
app.use((error, req, res, next) => {
    logger_1.default.error("Unhandled error", {
        error: error.message,
        stack: error.stack,
        method: req.method,
        url: req.url,
        userId: req.userId || "anonymous",
    });
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";
    res.status(error.status || 500).json(Object.assign({ success: false, message: isDevelopment ? error.message : "Internal server error" }, (isDevelopment && { stack: error.stack })));
});
// Graceful shutdown handling
process.on("SIGTERM", () => {
    logger_1.default.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
        logger_1.default.info("HTTP server closed");
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    logger_1.default.info("SIGINT received, shutting down gracefully");
    server.close(() => {
        logger_1.default.info("HTTP server closed");
        process.exit(0);
    });
});
exports.default = app;
