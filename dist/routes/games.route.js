"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const games_controller_1 = require("../controllers/games.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**



 */
router.get("/", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getAllGames);
/**



 */
router.get("/:gameId", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getGameById);
/**



 */
router.post("/:gameId/start", auth_middleware_1.verifyToken, rateLimiter_1.gamesRateLimiter, games_controller_1.startGameSession);
/**



 */
router.post("/:gameId/complete", auth_middleware_1.verifyToken, rateLimiter_1.gamesRateLimiter, games_controller_1.completeGameSession);
/**



 */
router.get("/sessions", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getUserGameSessions);
/**



 */
router.get("/achievements", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getUserAchievements);
/**



 */
router.get("/:gameId/leaderboard", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getGameLeaderboard);
/**



 */
router.get("/stats", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getUserGameStats);
/**



 */
router.get("/category/:category", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, games_controller_1.getGamesByCategory);
exports.default = router;
