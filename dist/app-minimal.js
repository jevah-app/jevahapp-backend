"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const http_1 = require("http");
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const server = (0, http_1.createServer)(app);
exports.server = server;
// Basic middleware setup
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
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
        status: "success",
    });
});
app.get("/api/status", (req, res) => {
    res.json({
        status: "running",
        mongodb: "connected",
        timestamp: new Date().toISOString(),
    });
});
// 404 handler
app.use("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.originalUrl,
    });
});
// Global error handler
app.use((error, req, res, next) => {
    res.status(error.status || 500).json({
        success: false,
        message: "Internal server error",
    });
});
exports.default = app;
