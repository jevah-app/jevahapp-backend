"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateUserInfo = exports.extractUserInfoFromToken = exports.verifyClerkToken = void 0;
const jwks_rsa_1 = __importDefault(require("jwks-rsa"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Use different JWKS URIs for frontend and backend
const getJwksUri = () => {
    const isBackend = process.env.NODE_ENV === "production" || process.env.CLERK_JWKS_URI;
    return isBackend
        ? process.env.CLERK_JWKS_URI || "https://clerk.dev/.well-known/jwks.json"
        : "https://clerk.dev/.well-known/jwks.json";
};
const client = (0, jwks_rsa_1.default)({
    jwksUri: getJwksUri(),
});
const verifyClerkToken = (token) => {
    return new Promise((resolve, reject) => {
        if (!token) {
            return reject(new Error("Token is required"));
        }
        try {
            const decoded = jsonwebtoken_1.default.decode(token, { complete: true });
            if (!decoded || typeof decoded === "string" || !decoded.header.kid) {
                return reject(new Error("Invalid token format or missing key ID"));
            }
            const kid = decoded.header.kid;
            client.getSigningKey(kid, (err, key) => {
                if (err || !key) {
                    console.error("Error getting signing key:", err);
                    return reject(new Error("Failed to retrieve signing key from Clerk"));
                }
                const signingKey = "getPublicKey" in key ? key.getPublicKey() : key.publicKey;
                jsonwebtoken_1.default.verify(token, signingKey, {
                    algorithms: ["RS256"],
                    issuer: process.env.CLERK_ISSUER_URL || "https://clerk.dev",
                    audience: process.env.CLERK_AUDIENCE || "https://clerk.dev",
                }, (err, verified) => {
                    if (err) {
                        console.error("Token verification error:", err);
                        return reject(new Error(`Token verification failed: ${err.message}`));
                    }
                    const payload = verified;
                    // Validate required fields
                    if (!payload.sub || !payload.email) {
                        return reject(new Error("Token missing required fields (sub or email)"));
                    }
                    resolve(payload);
                });
            });
        }
        catch (error) {
            console.error("Token decoding error:", error);
            reject(new Error("Failed to decode token"));
        }
    });
};
exports.verifyClerkToken = verifyClerkToken;
// Helper function to extract user info from Clerk token
const extractUserInfoFromToken = (token) => {
    return (0, exports.verifyClerkToken)(token).then((payload) => ({
        clerkId: payload.sub,
        email: payload.email,
        emailVerified: payload.email_verified || false,
    }));
};
exports.extractUserInfoFromToken = extractUserInfoFromToken;
// Helper function to validate user info object
const validateUserInfo = (userInfo) => {
    if (!userInfo || typeof userInfo !== "object") {
        throw new Error("User info is required and must be an object");
    }
    return {
        firstName: userInfo.firstName || "User",
        lastName: userInfo.lastName || "",
        avatar: userInfo.avatar || "",
    };
};
exports.validateUserInfo = validateUserInfo;
