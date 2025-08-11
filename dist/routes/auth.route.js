"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const asyncHandler_1 = require("../utils/asyncHandler");
// Initialize Express router for authentication-related endpoints
const router = (0, express_1.Router)();
// Configure multer for file uploads (used for avatar uploads)
// - Uses memory storage to handle files as buffers
// - Sets a 5MB file size limit for security
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for avatars
});
// Public Auth Routes
// These routes do not require authentication and handle user login/registration
// POST /clerk-login
// Handles login via Clerk authentication service
// - Uses authRateLimiter to prevent brute-force attempts
// - Calls authController.clerkLogin to validate Clerk token and create/login user
router.post("/clerk-login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.clerkLogin));
// POST /oauth-login
// Handles OAuth login (e.g., Google, Facebook)
// - Uses authRateLimiter to limit request rate
// - Calls authController.oauthLogin to validate OAuth token and create/login user
router.post("/oauth-login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.oauthLogin));
// POST /register
// Registers a new user with email and password
// - Uses authRateLimiter to prevent abuse
// - Calls authController.registerUser to create user and send verification email
router.post("/register", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.registerUser));
// POST /artist/register
// Registers a new artist with additional artist-specific information
// - Uses authRateLimiter to prevent abuse
// - Calls authController.registerArtist to create artist and send verification email
router.post("/artist/register", rateLimiter_1.authRateLimiter, upload.single("avatar"), (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.registerArtist));
// POST /login
// Authenticates a user with email and password
// - Uses authRateLimiter to prevent brute-force login attempts
// - Calls authController.loginUser to verify credentials and issue JWT
router.post("/login", rateLimiter_1.authRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.loginUser));
// Sensitive Public Routes
// These routes are public but handle sensitive operations, so they use stricter rate limiting
// POST /verify-email
// Verifies a user's email address using a verification code
// - Uses sensitiveEndpointRateLimiter for stricter rate limiting
// - Calls authController.verifyEmail to validate code and mark email as verified
router.post("/verify-email", rateLimiter_1.sensitiveEndpointRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.verifyEmail));
// POST /reset-password
// Resets a user's password using a reset token
// - Uses sensitiveEndpointRateLimiter to prevent abuse
// - Calls authController.resetPassword to validate token and update password
router.post("/reset-password", rateLimiter_1.sensitiveEndpointRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.resetPassword));
// POST /resend-verification-email
// Resends a verification email to a user
// - Uses emailRateLimiter to limit email requests
// - Calls authController.resendVerificationEmail to generate and send new code
router.post("/resend-verification-email", rateLimiter_1.emailRateLimiter, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.resendVerificationEmail));
// Protected Routes
// These routes require authentication and use verifyToken middleware to validate JWT
// POST /complete-profile
// Updates a user's profile with additional details (e.g., age, role)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.completeUserProfile to update user document
router.post("/complete-profile", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.completeUserProfile));
// GET /me
// Retrieves the current authenticated user's profile
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.getCurrentUser to return user data
router.get("/me", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.getCurrentUser));
// GET /session
// Retrieves the current user's session information
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.getUserSession to return session data
router.get("/session", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.getUserSession));
// POST /avatar
// Updates the current user's avatar
// - Uses verifyToken to ensure user is authenticated
// - Uses upload.single to handle avatar file upload
// - Calls authController.updateUserAvatar to update avatar
router.post("/avatar", auth_middleware_1.verifyToken, upload.single("avatar"), (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.updateUserAvatar));
// POST /logout
// Logs out the current user by blacklisting their JWT token
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.logout to blacklist token
router.post("/logout", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.logout));
// Admin Routes
// These routes require admin privileges
// POST /artist/:userId/verify
// Verifies an artist account (admin only)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.verifyArtist to verify artist account
router.post("/artist/:userId/verify", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.verifyArtist));
// PUT /artist/:userId/profile
// Updates an artist's profile (artist only)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.updateArtistProfile to update artist profile
router.put("/artist/:userId/profile", auth_middleware_1.verifyToken, (0, asyncHandler_1.asyncHandler)(auth_controller_1.default.updateArtistProfile));
exports.default = router;
