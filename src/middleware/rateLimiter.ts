import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
          }),
      });

// Authentication rate limiter (more strict)
export const authRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 20,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many authentication attempts, please try again later",
          }),
      });

// Sensitive operations rate limiter (very strict)
export const sensitiveEndpointRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many attempts, please try again in an hour",
          }),
      });

// Media upload rate limiter
export const mediaUploadRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // limit to 10 uploads per hour
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Upload limit exceeded, please try again in an hour",
          }),
      });

// Media interaction rate limiter (likes, shares, etc.)
export const mediaInteractionRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 50, // limit to 50 interactions per 5 minutes
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many interactions, please slow down",
          }),
      });

// Artist follow/unfollow rate limiter
export const followRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 10 * 60 * 1000, // 10 minutes
        max: 20, // limit to 20 follow/unfollow actions per 10 minutes
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many follow/unfollow actions, please slow down",
          }),
      });

// Email sending rate limiter
export const emailRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 5, // limit to 5 email requests per hour
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many email requests, please try again in an hour",
          }),
      });

// Games section rate limiter (for kids)
export const gamesRateLimiter =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs: 5 * 60 * 1000, // 5 minutes
        max: 100, // limit to 100 game actions per 5 minutes
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many game actions, please slow down",
          }),
      });

// Generic rate limiter function
export const rateLimiter = (max: number, windowMs: number) =>
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test"
    ? (_req: Request, _res: Response, next: NextFunction) => next()
    : rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) =>
          res.status(429).json({
            success: false,
            message: "Too many requests, please try again later",
          }),
      });
