import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { BlacklistedToken } from "../models/blacklistedToken.model";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: Token has been invalidated",
      });
      return;
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
    };

    req.userId = decoded.userId;

    // Fetch user and attach full user to request
    const user = await User.findById(decoded.userId).select(
      "role isVerifiedCreator isVerifiedVendor isVerifiedChurch"
    );
    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // Attach the user object for role checks
    req.user = {
      role: user.role,
      isVerifiedCreator: user.isVerifiedCreator,
      isVerifiedVendor: user.isVerifiedVendor,
      isVerifiedChurch: user.isVerifiedChurch,
    };

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      detail: error.message,
    });
  }
};
