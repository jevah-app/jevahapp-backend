import { Router } from "express";
import {
  followArtist,
  unfollowArtist,
  getArtistFollowers,
  getUserFollowing,
  addMerchItem,
  updateMerchItem,
  removeMerchItem,
  getArtistMerch,
  purchaseMerch,
  getArtistDownloadableSongs,
  getUserOfflineDownloads,
} from "../controllers/artist.controller";
import { verifyToken } from "../middleware/auth.middleware";
import {
  apiRateLimiter,
  followRateLimiter,
  mediaInteractionRateLimiter,
} from "../middleware/rateLimiter";

const router = Router();

/**



 */
router.post("/follow", verifyToken, followRateLimiter, followArtist);

/**



 */
router.post("/unfollow", verifyToken, followRateLimiter, unfollowArtist);

/**



 */
router.get(
  "/:artistId/followers",
  verifyToken,
  apiRateLimiter,
  getArtistFollowers
);

/**



 */
router.get("/following", verifyToken, apiRateLimiter, getUserFollowing);

/**



 */
router.post("/merch", verifyToken, mediaInteractionRateLimiter, addMerchItem);

/**



 */
router.put(
  "/merch/:merchItemId",
  verifyToken,
  mediaInteractionRateLimiter,
  updateMerchItem
);

/**



 */
router.delete(
  "/merch/:merchItemId",
  verifyToken,
  mediaInteractionRateLimiter,
  removeMerchItem
);

/**



 */
router.get("/:artistId/merch", verifyToken, apiRateLimiter, getArtistMerch);

/**



 */
router.post(
  "/:artistId/merch/purchase",
  verifyToken,
  mediaInteractionRateLimiter,
  purchaseMerch
);

/**



 */
router.get(
  "/:artistId/songs",
  verifyToken,
  apiRateLimiter,
  getArtistDownloadableSongs
);

/**



 */
router.get("/downloads", verifyToken, apiRateLimiter, getUserOfflineDownloads);

export default router;
