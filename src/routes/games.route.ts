import { Router } from "express";
import {
  getAllGames,
  getGameById,
  startGameSession,
  completeGameSession,
  getUserGameSessions,
  getUserAchievements,
  getGameLeaderboard,
  getUserGameStats,
  getGamesByCategory,
} from "../controllers/games.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { apiRateLimiter, gamesRateLimiter } from "../middleware/rateLimiter";

const router = Router();

/**



 */
router.get("/", verifyToken, apiRateLimiter, getAllGames);

/**



 */
router.get("/:gameId", verifyToken, apiRateLimiter, getGameById);

/**



 */
router.post("/:gameId/start", verifyToken, gamesRateLimiter, startGameSession);

/**



 */
router.post(
  "/:gameId/complete",
  verifyToken,
  gamesRateLimiter,
  completeGameSession
);

/**



 */
router.get("/sessions", verifyToken, apiRateLimiter, getUserGameSessions);

/**



 */
router.get("/achievements", verifyToken, apiRateLimiter, getUserAchievements);

/**



 */
router.get(
  "/:gameId/leaderboard",
  verifyToken,
  apiRateLimiter,
  getGameLeaderboard
);

/**



 */
router.get("/stats", verifyToken, apiRateLimiter, getUserGameStats);

/**



 */
router.get(
  "/category/:category",
  verifyToken,
  apiRateLimiter,
  getGamesByCategory
);

export default router;
