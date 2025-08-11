import { Request, Response, NextFunction } from "express";

/**
 * Middleware to allow only users with the "admin" role.
 */
export const requireAdmin = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (request.user?.role === "admin") {
    return next();
  }

  response.status(403).json({
    success: false,
    message: "Access denied. Admins only.",
  });
};

/**
 * Middleware to allow only verified content creators.
 */
export const requireContentCreator = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (
    request.user?.role === "content_creator" &&
    request.user?.isVerifiedCreator === true
  ) {
    return next();
  }

  response.status(403).json({
    success: false,
    message: "Access denied. Verified content creators only.",
  });
};

/**
 * Middleware to allow either admins or verified content creators.
 */
export const requireAdminOrCreator = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  const isAdmin = request.user?.role === "admin";
  const isCreator =
    request.user?.role === "content_creator" &&
    request.user?.isVerifiedCreator === true;

  if (isAdmin || isCreator) {
    return next();
  }

  response.status(403).json({
    success: false,
    message: "Access denied. Admins or verified content creators only.",
  });
};

/**
 * Middleware to allow only verified church admins.
 */
export const requireChurchAdmin = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (
    request.user?.role === "church_admin" &&
    request.user?.isVerifiedChurch === true
  ) {
    return next();
  }

  response.status(403).json({
    success: false,
    message: "Access denied. Verified church admins only.",
  });
};

/**
 * Middleware to allow only verified vendors.
 */
export const requireVendor = (
  request: Request,
  response: Response,
  next: NextFunction
): void => {
  if (
    request.user?.role === "vendor" &&
    request.user?.isVerifiedVendor === true
  ) {
    return next();
  }

  response.status(403).json({
    success: false,
    message: "Access denied. Verified vendors only.",
  });
};
