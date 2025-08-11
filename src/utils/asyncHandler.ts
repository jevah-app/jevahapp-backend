import { RequestHandler } from "express";

export const asyncHandler =
  (fn: (...args: any[]) => Promise<any>): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
