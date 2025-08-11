"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractUserFromToken = void 0;
// src/middlewares/clerkAuth.ts
const backend_1 = require("@clerk/backend");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
// Initialize Clerk client
const clerk = (0, clerk_sdk_node_1.createClerkClient)({
    secretKey: process.env.CLERK_SECRET_KEY || "",
});
const extractUserFromToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { sessionToken } = req.body;
    if (!sessionToken || typeof sessionToken !== "string") {
        return res.status(400).json({ error: "Valid session token required" });
    }
    try {
        // Verify the JWT session token
        const payload = yield (0, backend_1.verifyToken)(sessionToken, {
            secretKey: process.env.CLERK_SECRET_KEY,
        });
        // Type-safe extraction of userId
        if (!payload || typeof payload !== "object" || !("userId" in payload)) {
            throw new Error("Invalid token payload structure");
        }
        const userId = payload.userId;
        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid user ID in token");
        }
        // Retrieve user details from Clerk
        const user = yield clerk.users.getUser(userId);
        // Type-safe email access
        const primaryEmail = (_b = (_a = user.emailAddresses) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.emailAddress;
        if (!primaryEmail) {
            return res.status(400).json({ error: "User email not found" });
        }
        // Attach strongly-typed user data to the request object
        req.clerkUser = {
            id: user.id,
            email: primaryEmail,
            fullName: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
                "Unknown",
            avatar: user.imageUrl,
        };
        next();
    }
    catch (error) {
        console.error("Clerk token verification failed:", error);
        const errorMessage = error instanceof Error ? error.message : "Authentication failed";
        res.status(401).json({
            error: "Invalid session token",
            details: errorMessage,
        });
    }
});
exports.extractUserFromToken = extractUserFromToken;
