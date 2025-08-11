// src/middlewares/clerkAuth.ts
import { verifyToken } from "@clerk/backend";
import { createClerkClient } from "@clerk/clerk-sdk-node";
import type { Request, Response, NextFunction } from "express";

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY || "",
});

// Strongly type the Clerk user data
declare global {
  namespace Express {
    interface Request {
      clerkUser?: {
        id: string;
        email: string;
        fullName: string;
        avatar?: string;
      };
    }
  }
}

export const extractUserFromToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { sessionToken } = req.body;

  if (!sessionToken || typeof sessionToken !== "string") {
    return res.status(400).json({ error: "Valid session token required" });
  }

  try {
    // Verify the JWT session token
    const payload = await verifyToken(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });

    // Type-safe extraction of userId
    if (!payload || typeof payload !== "object" || !("userId" in payload)) {
      throw new Error("Invalid token payload structure");
    }

    const userId = payload.userId as string;
    if (!userId || typeof userId !== "string") {
      throw new Error("Invalid user ID in token");
    }

    // Retrieve user details from Clerk
    const user = await clerk.users.getUser(userId);

    // Type-safe email access
    const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
    if (!primaryEmail) {
      return res.status(400).json({ error: "User email not found" });
    }

    // Attach strongly-typed user data to the request object
    req.clerkUser = {
      id: user.id,
      email: primaryEmail,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
        "Unknown",
      avatar: user.imageUrl,
    };

    next();
  } catch (error) {
    console.error("Clerk token verification failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Authentication failed";

    res.status(401).json({
      error: "Invalid session token",
      details: errorMessage,
    });
  }
};
