import { Router } from "express";
import {
  getTrendingUsers,
  getMostViewedUsers,
  getMostReadEbookUsers,
  getMostListenedAudioUsers,
  getMostHeardSermonUsers,
  getMostCheckedOutLiveUsers,
  getLiveStreamTiming,
  getTrendingAnalytics,
} from "../controllers/trending.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

// Rate limiters
const trendingRateLimiter = rateLimiter(100, 15 * 60 * 1000); // 100 requests per 15 minutes

// Trending analytics routes
router.get("/trending", verifyToken, trendingRateLimiter, getTrendingUsers);
router.get(
  "/most-viewed",
  verifyToken,
  trendingRateLimiter,
  getMostViewedUsers
);
router.get(
  "/most-read-ebooks",
  verifyToken,
  trendingRateLimiter,
  getMostReadEbookUsers
);
router.get(
  "/most-listened-audio",
  verifyToken,
  trendingRateLimiter,
  getMostListenedAudioUsers
);
router.get(
  "/most-heard-sermons",
  verifyToken,
  trendingRateLimiter,
  getMostHeardSermonUsers
);
router.get(
  "/most-checked-out-live",
  verifyToken,
  trendingRateLimiter,
  getMostCheckedOutLiveUsers
);
router.get(
  "/live-stream-timing",
  verifyToken,
  trendingRateLimiter,
  getLiveStreamTiming
);
router.get(
  "/analytics",
  verifyToken,
  trendingRateLimiter,
  getTrendingAnalytics
);

export default router;
