"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userProfile_controller_1 = require("../controllers/userProfile.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
// Rate limiters
const profileRateLimiter = (0, rateLimiter_1.rateLimiter)(100, 15 * 60 * 1000); // 100 requests per 15 minutes
// User profile routes
router.get("/:userId", auth_middleware_1.verifyToken, profileRateLimiter, userProfile_controller_1.getUserProfile);
router.post("/multiple", auth_middleware_1.verifyToken, profileRateLimiter, userProfile_controller_1.getMultipleUserProfiles);
router.get("/search", auth_middleware_1.verifyToken, profileRateLimiter, userProfile_controller_1.searchUserProfiles);
router.get("/me/profile", auth_middleware_1.verifyToken, profileRateLimiter, userProfile_controller_1.getCurrentUserProfile);
exports.default = router;
