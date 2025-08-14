import { Router } from "express";
import {
  getUserProfile,
  getMultipleUserProfiles,
  searchUserProfiles,
  getCurrentUserProfile,
} from "../controllers/userProfile.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Rate limiters
const profileRateLimiter = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// User profile routes
router.get("/:userId", verifyToken, profileRateLimiter, getUserProfile);
router.post(
  "/multiple",
  verifyToken,
  profileRateLimiter,
  getMultipleUserProfiles
);
router.get("/search", verifyToken, profileRateLimiter, searchUserProfiles);
router.get(
  "/me/profile",
  verifyToken,
  profileRateLimiter,
  getCurrentUserProfile
);

export default router;

