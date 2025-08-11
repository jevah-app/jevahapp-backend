"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const artist_controller_1 = require("../controllers/artist.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**



 */
router.post("/follow", auth_middleware_1.verifyToken, rateLimiter_1.followRateLimiter, artist_controller_1.followArtist);
/**



 */
router.post("/unfollow", auth_middleware_1.verifyToken, rateLimiter_1.followRateLimiter, artist_controller_1.unfollowArtist);
/**



 */
router.get("/:artistId/followers", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, artist_controller_1.getArtistFollowers);
/**



 */
router.get("/following", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, artist_controller_1.getUserFollowing);
/**



 */
router.post("/merch", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, artist_controller_1.addMerchItem);
/**



 */
router.put("/merch/:merchItemId", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, artist_controller_1.updateMerchItem);
/**



 */
router.delete("/merch/:merchItemId", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, artist_controller_1.removeMerchItem);
/**



 */
router.get("/:artistId/merch", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, artist_controller_1.getArtistMerch);
/**



 */
router.post("/:artistId/merch/purchase", auth_middleware_1.verifyToken, rateLimiter_1.mediaInteractionRateLimiter, artist_controller_1.purchaseMerch);
/**



 */
router.get("/:artistId/songs", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, artist_controller_1.getArtistDownloadableSongs);
/**



 */
router.get("/downloads", auth_middleware_1.verifyToken, rateLimiter_1.apiRateLimiter, artist_controller_1.getUserOfflineDownloads);
exports.default = router;
