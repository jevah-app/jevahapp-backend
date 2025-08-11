import { Router } from "express";
import {
  createOrUpdateProfile,
  getProfile,
  getPotentialMatches,
  likeProfile,
  respondToMatch,
  getUserMatches,
  sendMessage,
  getMatchMessages,
  markMessagesAsRead,
  getUnreadMessageCount,
  deactivateProfile,
} from "../controllers/dating.controller";
import { verifyToken } from "../middleware/auth.middleware";
import { apiRateLimiter } from "../middleware/rateLimiter";

const router = Router();

/**
 * @swagger
 * /api/dating/profile:
 *   post:
 *     summary: Create or update dating profile
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lookingFor
 *               - ageRange
 *               - location
 *               - bio
 *               - photos
 *               - mainPhoto
 *               - faithLevel
 *               - preferences
 *             properties:
 *               lookingFor:
 *                 type: string
 *                 enum: [men, women, both]
 *                 description: Gender preference
 *               ageRange:
 *                 type: object
 *                 required:
 *                   - min
 *                   - max
 *                 properties:
 *                   min:
 *                     type: integer
 *                     minimum: 18
 *                     maximum: 100
 *                   max:
 *                     type: integer
 *                     minimum: 18
 *                     maximum: 100
 *               location:
 *                 type: object
 *                 required:
 *                   - city
 *                   - state
 *                   - country
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     description: [longitude, latitude]
 *               bio:
 *                 type: string
 *                 maxLength: 500
 *                 description: Profile bio
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User interests
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 6
 *                 description: Profile photos URLs
 *               mainPhoto:
 *                 type: string
 *                 description: Main profile photo URL
 *               height:
 *                 type: integer
 *                 minimum: 100
 *                 maximum: 250
 *                 description: Height in cm
 *               education:
 *                 type: string
 *                 description: Education level
 *               occupation:
 *                 type: string
 *                 description: Occupation
 *               faithLevel:
 *                 type: string
 *                 enum: [very_important, important, somewhat_important, not_important]
 *                 description: Importance of faith in relationships
 *               denomination:
 *                 type: string
 *                 description: Religious denomination
 *               preferences:
 *                 type: object
 *                 required:
 *                   - maxDistance
 *                   - ageRange
 *                   - faithLevel
 *                 properties:
 *                   maxDistance:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 500
 *                     description: Maximum distance in km
 *                   ageRange:
 *                     type: object
 *                     required:
 *                       - min
 *                       - max
 *                     properties:
 *                       min:
 *                         type: integer
 *                       max:
 *                         type: integer
 *                   faithLevel:
 *                     type: string
 *                     enum: [very_important, important, somewhat_important, not_important]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/profile", verifyToken, apiRateLimiter, createOrUpdateProfile);

/**
 * @swagger
 * /api/dating/profile:
 *   get:
 *     summary: Get dating profile
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 *       500:
 *         description: Internal server error
 */
router.get("/profile", verifyToken, apiRateLimiter, getProfile);

/**
 * @swagger
 * /api/dating/matches:
 *   get:
 *     summary: Get potential matches
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ageRange
 *         schema:
 *           type: string
 *         description: Age range filter in JSON format with min and max values
 *       - in: query
 *         name: faithLevel
 *         schema:
 *           type: string
 *         description: Faith level filter
 *       - in: query
 *         name: denomination
 *         schema:
 *           type: string
 *         description: Denomination filter
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *         description: Maximum distance in km
 *       - in: query
 *         name: interests
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Interests filter
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
 *         description: Potential matches retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/matches", verifyToken, apiRateLimiter, getPotentialMatches);

/**
 * @swagger
 * /api/dating/like/{userId}:
 *   post:
 *     summary: Like a profile
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to like
 *     responses:
 *       200:
 *         description: Profile liked successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/like/:userId", verifyToken, apiRateLimiter, likeProfile);

/**
 * @swagger
 * /api/dating/match/{matchId}/respond:
 *   post:
 *     summary: Respond to match (accept/reject)
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 enum: [accepted, rejected]
 *                 description: Response to the match
 *     responses:
 *       200:
 *         description: Match response processed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/match/:matchId/respond",
  verifyToken,
  apiRateLimiter,
  respondToMatch
);

/**
 * @swagger
 * /api/dating/matches:
 *   get:
 *     summary: Get user's matches
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected]
 *         description: Filter by match status
 *     responses:
 *       200:
 *         description: User matches retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/matches", verifyToken, apiRateLimiter, getUserMatches);

/**
 * @swagger
 * /api/dating/message:
 *   post:
 *     summary: Send message
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - matchId
 *               - content
 *             properties:
 *               matchId:
 *                 type: string
 *                 description: Match ID
 *               content:
 *                 type: string
 *                 description: Message content
 *               messageType:
 *                 type: string
 *                 enum: [text, image, voice, gift]
 *                 default: text
 *                 description: Message type
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Attachment URLs
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post("/message", verifyToken, apiRateLimiter, sendMessage);

/**
 * @swagger
 * /api/dating/messages/{matchId}:
 *   get:
 *     summary: Get match messages
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
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
 *           default: 50
 *         description: Number of messages per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/messages/:matchId", verifyToken, apiRateLimiter, getMatchMessages);

/**
 * @swagger
 * /api/dating/messages/{matchId}/read:
 *   put:
 *     summary: Mark messages as read
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.put(
  "/messages/:matchId/read",
  verifyToken,
  apiRateLimiter,
  markMessagesAsRead
);

/**
 * @swagger
 * /api/dating/messages/unread/count:
 *   get:
 *     summary: Get unread message count
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get(
  "/messages/unread/count",
  verifyToken,
  apiRateLimiter,
  getUnreadMessageCount
);

/**
 * @swagger
 * /api/dating/profile/deactivate:
 *   post:
 *     summary: Deactivate dating profile
 *     tags: [Dating]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deactivated successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post(
  "/profile/deactivate",
  verifyToken,
  apiRateLimiter,
  deactivateProfile
);

export default router;
