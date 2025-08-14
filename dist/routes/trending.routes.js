"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const trending_controller_1 = require("../controllers/trending.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Rate limiters
const trendingRateLimiter = (0, rateLimiter_1.rateLimiter)(100, 15 * 60 * 1000); // 100 requests per 15 minutes
// Trending analytics routes
router.get("/trending", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getTrendingUsers);
router.get("/most-viewed", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getMostViewedUsers);
router.get("/most-read-ebooks", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getMostReadEbookUsers);
router.get("/most-listened-audio", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getMostListenedAudioUsers);
router.get("/most-heard-sermons", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getMostHeardSermonUsers);
router.get("/most-checked-out-live", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getMostCheckedOutLiveUsers);
router.get("/live-stream-timing", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getLiveStreamTiming);
router.get("/analytics", auth_middleware_1.verifyToken, trendingRateLimiter, trending_controller_1.getTrendingAnalytics);
exports.default = router;
