import { Router } from "express";
import multer from "multer";
import authController from "../controllers/auth.controller";
import { verifyToken } from "../middleware/auth.middleware";
import {
  authRateLimiter,
  sensitiveEndpointRateLimiter,
  emailRateLimiter,
} from "../middleware/rateLimiter";
import { asyncHandler } from "../utils/asyncHandler";

// Initialize Express router for authentication-related endpoints
const router = Router();

// Configure multer for file uploads (used for avatar uploads)
// - Uses memory storage to handle files as buffers
// - Sets a 5MB file size limit for security
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for avatars
});

// Public Auth Routes
// These routes do not require authentication and handle user login/registration

// POST /clerk-login
// Handles login via Clerk authentication service
// - Uses authRateLimiter to prevent brute-force attempts
// - Calls authController.clerkLogin to validate Clerk token and create/login user
router.post(
  "/clerk-login",
  authRateLimiter,
  asyncHandler(authController.clerkLogin)
);

// POST /oauth-login
// Handles OAuth login (e.g., Google, Facebook)
// - Uses authRateLimiter to limit request rate
// - Calls authController.oauthLogin to validate OAuth token and create/login user
router.post(
  "/oauth-login",
  authRateLimiter,
  asyncHandler(authController.oauthLogin)
);

// POST /register
// Registers a new user with email and password
// - Uses authRateLimiter to prevent abuse
// - Calls authController.registerUser to create user and send verification email
router.post(
  "/register",
  authRateLimiter,
  asyncHandler(authController.registerUser)
);

// POST /artist/register
// Registers a new artist with additional artist-specific information
// - Uses authRateLimiter to prevent abuse
// - Calls authController.registerArtist to create artist and send verification email
router.post(
  "/artist/register",
  authRateLimiter,
  upload.single("avatar"),
  asyncHandler(authController.registerArtist)
);

// POST /login
// Authenticates a user with email and password
// - Uses authRateLimiter to prevent brute-force login attempts
// - Calls authController.loginUser to verify credentials and issue JWT
router.post("/login", authRateLimiter, asyncHandler(authController.loginUser));

// Sensitive Public Routes
// These routes are public but handle sensitive operations, so they use stricter rate limiting

// POST /verify-email
// Verifies a user's email address using a verification code
// - Uses sensitiveEndpointRateLimiter for stricter rate limiting
// - Calls authController.verifyEmail to validate code and mark email as verified
router.post(
  "/verify-email",
  sensitiveEndpointRateLimiter,
  asyncHandler(authController.verifyEmail)
);

// POST /reset-password
// Resets a user's password using a reset token
// - Uses sensitiveEndpointRateLimiter to prevent abuse
// - Calls authController.resetPassword to validate token and update password
router.post(
  "/reset-password",
  sensitiveEndpointRateLimiter,
  asyncHandler(authController.resetPassword)
);

// POST /resend-verification-email
// Resends a verification email to a user
// - Uses emailRateLimiter to limit email requests
// - Calls authController.resendVerificationEmail to generate and send new code
router.post(
  "/resend-verification-email",
  emailRateLimiter,
  asyncHandler(authController.resendVerificationEmail)
);

// Protected Routes
// These routes require authentication and use verifyToken middleware to validate JWT

// POST /complete-profile
// Updates a user's profile with additional details (e.g., age, role)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.completeUserProfile to update user document
router.post(
  "/complete-profile",
  verifyToken,
  asyncHandler(authController.completeUserProfile)
);

// GET /me
// Retrieves the current authenticated user's profile
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.getCurrentUser to return user data
router.get("/me", verifyToken, asyncHandler(authController.getCurrentUser));

// GET /session
// Retrieves the current user's session information
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.getUserSession to return session data
router.get(
  "/session",
  verifyToken,
  asyncHandler(authController.getUserSession)
);

// POST /avatar
// Updates the current user's avatar
// - Uses verifyToken to ensure user is authenticated
// - Uses upload.single to handle avatar file upload
// - Calls authController.updateUserAvatar to update avatar
router.post(
  "/avatar",
  verifyToken,
  upload.single("avatar"),
  asyncHandler(authController.updateUserAvatar)
);

// POST /logout
// Logs out the current user by blacklisting their JWT token
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.logout to blacklist token
router.post("/logout", verifyToken, asyncHandler(authController.logout));

// Admin Routes
// These routes require admin privileges

// POST /artist/:userId/verify
// Verifies an artist account (admin only)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.verifyArtist to verify artist account
router.post(
  "/artist/:userId/verify",
  verifyToken,
  asyncHandler(authController.verifyArtist)
);

// PUT /artist/:userId/profile
// Updates an artist's profile (artist only)
// - Uses verifyToken to ensure user is authenticated
// - Calls authController.updateArtistProfile to update artist profile
router.put(
  "/artist/:userId/profile",
  verifyToken,
  asyncHandler(authController.updateArtistProfile)
);

export default router;
