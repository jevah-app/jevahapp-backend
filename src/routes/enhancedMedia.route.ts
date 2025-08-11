import { Router } from "express";
import {
  getTrendingMedia,
  getMostViewedMedia,
  searchMediaWithFilters,
  addToLibrary,
  removeFromLibrary,
  getUserLibrary,
  updateWatchProgress,
  getCurrentlyWatching,
} from "../controllers/enhancedMedia.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @swagger
 * /api/media/trending:
 *   get:
 *     summary: Get trending media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Filter by content type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Trending media retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/trending", verifyToken, apiRateLimiter, getTrendingMedia);

/**
 * @swagger
 * /api/media/most-viewed:
 *   get:
 *     summary: Get most viewed media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Filter by content type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *         description: Number of days to look back
 *     responses:
 *       200:
 *         description: Most viewed media retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/most-viewed", verifyToken, apiRateLimiter, getMostViewedMedia);

/**
 * @swagger
 * /api/media/search/advanced:
 *   get:
 *     summary: Advanced media search with filters
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentType
 *         schema:
 *           type: string
 *         description: Filter by content type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: topics
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by topics
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [trending, most_viewed, most_liked, most_shared, newest, oldest]
 *           default: newest
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Media search results
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/search/advanced",
  verifyToken,
  apiRateLimiter,
  searchMediaWithFilters
);

/**
 * @swagger
 * /api/media/library/add:
 *   post:
 *     summary: Add media to library
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaId
 *             properties:
 *               mediaId:
 *                 type: string
 *                 description: Media ID to add
 *               mediaType:
 *                 type: string
 *                 enum: [media, merchandise]
 *                 default: media
 *               notes:
 *                 type: string
 *                 description: Optional notes
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Optional rating
 *     responses:
 *       200:
 *         description: Media added to library successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/library/add", verifyToken, apiRateLimiter, addToLibrary);

/**
 * @swagger
 * /api/media/library/{mediaId}/{mediaType}:
 *   delete:
 *     summary: Remove media from library
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Media ID to remove
 *       - in: path
 *         name: mediaType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [media, merchandise]
 *         description: Type of media
 *     responses:
 *       200:
 *         description: Media removed from library successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete(
  "/library/:mediaId/:mediaType",
  verifyToken,
  apiRateLimiter,
  removeFromLibrary
);

/**
 * @swagger
 * /api/media/library:
 *   get:
 *     summary: Get user's library
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mediaType
 *         schema:
 *           type: string
 *           enum: [media, merchandise]
 *         description: Filter by media type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: User library retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/library", verifyToken, apiRateLimiter, getUserLibrary);

/**
 * @swagger
 * /api/media/progress:
 *   put:
 *     summary: Update watch progress
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaId
 *               - progress
 *               - completionPercentage
 *             properties:
 *               mediaId:
 *                 type: string
 *                 description: Media ID
 *               progress:
 *                 type: integer
 *                 description: Progress in seconds
 *               completionPercentage:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Completion percentage
 *     responses:
 *       200:
 *         description: Watch progress updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put("/progress", verifyToken, apiRateLimiter, updateWatchProgress);

/**
 * @swagger
 * /api/media/currently-watching:
 *   get:
 *     summary: Get currently watching (in-progress media)
 *     tags: [Library]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items to return
 *     responses:
 *       200:
 *         description: Currently watching media retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/currently-watching",
  verifyToken,
  apiRateLimiter,
  getCurrentlyWatching
);

export default router;
