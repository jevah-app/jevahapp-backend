"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
/**
 * Production-grade logger configuration using Winston
 * Provides structured logging with different levels and file rotation
 */
class Logger {
    constructor() {
        // Define log format
        const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
        }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((_a) => {
            var { timestamp, level, message, stack } = _a, meta = __rest(_a, ["timestamp", "level", "message", "stack"]);
            let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
            if (Object.keys(meta).length > 0) {
                log += ` ${JSON.stringify(meta)}`;
            }
            if (stack) {
                log += `\n${stack}`;
            }
            return log;
        }));
        // Create logs directory if it doesn't exist
        const logsDir = path_1.default.join(process.cwd(), "logs");
        // Configure transports
        const transports = [
            // Console transport for development
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
                level: process.env.NODE_ENV === "production" ? "info" : "debug",
            }),
        ];
        // File transports for production
        if (process.env.NODE_ENV === "production") {
            // Error logs
            transports.push(new winston_daily_rotate_file_1.default({
                filename: path_1.default.join(logsDir, "error-%DATE%.log"),
                datePattern: "YYYY-MM-DD",
                level: "error",
                maxSize: "20m",
                maxFiles: "14d",
                format: logFormat,
            }));
            // Combined logs
            transports.push(new winston_daily_rotate_file_1.default({
                filename: path_1.default.join(logsDir, "combined-%DATE%.log"),
                datePattern: "YYYY-MM-DD",
                maxSize: "20m",
                maxFiles: "14d",
                format: logFormat,
            }));
            // Access logs for HTTP requests
            transports.push(new winston_daily_rotate_file_1.default({
                filename: path_1.default.join(logsDir, "access-%DATE%.log"),
                datePattern: "YYYY-MM-DD",
                maxSize: "20m",
                maxFiles: "14d",
                format: logFormat,
            }));
        }
        // Create logger instance
        this.logger = winston_1.default.createLogger({
            level: process.env.LOG_LEVEL || "info",
            format: logFormat,
            transports,
            exitOnError: false,
        });
        // Handle uncaught exceptions
        this.logger.exceptions.handle(new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, "exceptions-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }));
        // Handle unhandled promise rejections
        this.logger.rejections.handle(new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, "rejections-%DATE%.log"),
            datePattern: "YYYY-MM-DD",
            maxSize: "20m",
            maxFiles: "14d",
        }));
    }
    /**
     * Log an info message
     * @param message - The message to log
     * @param meta - Additional metadata
     */
    info(message, meta) {
        this.logger.info(message, meta);
    }
    /**
     * Log an error message
     * @param message - The message to log
     * @param error - Error object or additional metadata
     */
    error(message, error) {
        this.logger.error(message, error);
    }
    /**
     * Log a warning message
     * @param message - The message to log
     * @param meta - Additional metadata
     */
    warn(message, meta) {
        this.logger.warn(message, meta);
    }
    /**
     * Log a debug message
     * @param message - The message to log
     * @param meta - Additional metadata
     */
    debug(message, meta) {
        this.logger.debug(message, meta);
    }
    /**
     * Log HTTP request details
     * @param req - Express request object
     * @param res - Express response object
     * @param responseTime - Response time in milliseconds
     */
    logHttpRequest(req, res, responseTime) {
        const logData = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime: `${responseTime}ms`,
            userAgent: req.get("User-Agent"),
            ip: req.ip,
            userId: req.userId || "anonymous",
        };
        if (res.statusCode >= 400) {
            this.logger.warn("HTTP Request", logData);
        }
        else {
            this.logger.info("HTTP Request", logData);
        }
    }
    /**
     * Log database operations
     * @param operation - Database operation type
     * @param collection - Collection name
     * @param duration - Operation duration in milliseconds
     * @param meta - Additional metadata
     */
    logDatabase(operation, collection, duration, meta) {
        this.logger.info("Database Operation", Object.assign({ operation,
            collection, duration: `${duration}ms` }, meta));
    }
    /**
     * Log streaming events
     * @param event - Streaming event type
     * @param streamId - Stream ID
     * @param meta - Additional metadata
     */
    logStreaming(event, streamId, meta) {
        this.logger.info("Streaming Event", Object.assign({ event,
            streamId }, meta));
    }
    /**
     * Log authentication events
     * @param event - Authentication event type
     * @param userId - User ID
     * @param meta - Additional metadata
     */
    logAuth(event, userId, meta) {
        this.logger.info("Authentication Event", Object.assign({ event,
            userId }, meta));
    }
    /**
     * Get the underlying Winston logger instance
     * @returns Winston logger instance
     */
    getLogger() {
        return this.logger;
    }
}
// Export singleton instance
exports.logger = new Logger();
exports.default = exports.logger;
