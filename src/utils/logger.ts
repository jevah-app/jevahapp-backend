import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import path from "path";

/**
 * Production-grade logger configuration using Winston
 * Provides structured logging with different levels and file rotation
 */
class Logger {
  private logger: winston.Logger;

  constructor() {
    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

        if (Object.keys(meta).length > 0) {
          log += ` ${JSON.stringify(meta)}`;
        }

        if (stack) {
          log += `\n${stack}`;
        }

        return log;
      })
    );

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), "logs");

    // Configure transports
    const transports: winston.transport[] = [
      // Console transport for development
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
      }),
    ];

    // File transports for production
    if (process.env.NODE_ENV === "production") {
      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, "error-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          level: "error",
          maxSize: "20m",
          maxFiles: "14d",
          format: logFormat,
        })
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, "combined-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",
          format: logFormat,
        })
      );

      // Access logs for HTTP requests
      transports.push(
        new DailyRotateFile({
          filename: path.join(logsDir, "access-%DATE%.log"),
          datePattern: "YYYY-MM-DD",
          maxSize: "20m",
          maxFiles: "14d",
          format: logFormat,
        })
      );
    }

    // Create logger instance
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: logFormat,
      transports,
      exitOnError: false,
    });

    // Handle uncaught exceptions
    this.logger.exceptions.handle(
      new DailyRotateFile({
        filename: path.join(logsDir, "exceptions-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
      })
    );

    // Handle unhandled promise rejections
    this.logger.rejections.handle(
      new DailyRotateFile({
        filename: path.join(logsDir, "rejections-%DATE%.log"),
        datePattern: "YYYY-MM-DD",
        maxSize: "20m",
        maxFiles: "14d",
      })
    );
  }

  /**
   * Log an info message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Log an error message
   * @param message - The message to log
   * @param error - Error object or additional metadata
   */
  error(message: string, error?: any): void {
    this.logger.error(message, error);
  }

  /**
   * Log a warning message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log a debug message
   * @param message - The message to log
   * @param meta - Additional metadata
   */
  debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  /**
   * Log HTTP request details
   * @param req - Express request object
   * @param res - Express response object
   * @param responseTime - Response time in milliseconds
   */
  logHttpRequest(req: any, res: any, responseTime: number): void {
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
    } else {
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
  logDatabase(
    operation: string,
    collection: string,
    duration: number,
    meta?: any
  ): void {
    this.logger.info("Database Operation", {
      operation,
      collection,
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Log streaming events
   * @param event - Streaming event type
   * @param streamId - Stream ID
   * @param meta - Additional metadata
   */
  logStreaming(event: string, streamId: string, meta?: any): void {
    this.logger.info("Streaming Event", {
      event,
      streamId,
      ...meta,
    });
  }

  /**
   * Log authentication events
   * @param event - Authentication event type
   * @param userId - User ID
   * @param meta - Additional metadata
   */
  logAuth(event: string, userId: string, meta?: any): void {
    this.logger.info("Authentication Event", {
      event,
      userId,
      ...meta,
    });
  }

  /**
   * Get the underlying Winston logger instance
   * @returns Winston logger instance
   */
  getLogger(): winston.Logger {
    return this.logger;
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;
