import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter";
import {
  toggleLike,
  addComment,
  removeComment,
  addCommentReaction,
  shareMedia,
  getComments,
  sendMessage,
  getConversationMessages,
  getUserConversations,
  deleteMessage,
  getShareUrls,
  getShareStats,
} from "../controllers/interaction.controller";

const router = express.Router();

// Rate limiters
const interactionRateLimiter = rateLimiter(10, 60000); // 10 requests per minute
const commentRateLimiter = rateLimiter(5, 60000); // 5 comments per minute
const messageRateLimiter = rateLimiter(20, 60000); // 20 messages per minute

// =============================================================================
// Media Interactions (Likes, Comments, Shares)
// =============================================================================

/**
 * @route   POST /api/interactions/media/:mediaId/like
 * @desc    Toggle like/unlike on media
 * @access  Protected
 */
router.post(
  "/media/:mediaId/like",
  verifyToken,
  interactionRateLimiter,
  toggleLike
);

/**
 * @route   POST /api/interactions/media/:mediaId/comment
 * @desc    Add comment to media
 * @access  Protected
 */
router.post(
  "/media/:mediaId/comment",
  verifyToken,
  commentRateLimiter,
  addComment
);

/**
 * @route   DELETE /api/interactions/comments/:commentId
 * @desc    Remove comment
 * @access  Protected (Comment owner only)
 */
router.delete(
  "/comments/:commentId",
  verifyToken,
  removeComment
);

/**
 * @route   POST /api/interactions/comments/:commentId/reaction
 * @desc    Add reaction to comment
 * @access  Protected
 */
router.post(
  "/comments/:commentId/reaction",
  verifyToken,
  interactionRateLimiter,
  addCommentReaction
);

/**
 * @route   POST /api/interactions/media/:mediaId/share
 * @desc    Share media
 * @access  Protected
 */
router.post(
  "/media/:mediaId/share",
  verifyToken,
  interactionRateLimiter,
  shareMedia
);

/**
 * @route   GET /api/interactions/media/:mediaId/comments
 * @desc    Get comments for media
 * @access  Public
 */
router.get(
  "/media/:mediaId/comments",
  getComments
);

/**
 * @route   GET /api/interactions/media/:mediaId/share-urls
 * @desc    Get share URLs for media
 * @access  Public
 */
router.get(
  "/media/:mediaId/share-urls",
  getShareUrls
);

/**
 * @route   GET /api/interactions/media/:mediaId/share-stats
 * @desc    Get share statistics for media
 * @access  Public
 */
router.get(
  "/media/:mediaId/share-stats",
  getShareStats
);

// =============================================================================
// Messaging System
// =============================================================================

/**
 * @route   POST /api/interactions/messages/:recipientId
 * @desc    Send message to user
 * @access  Protected
 */
router.post(
  "/messages/:recipientId",
  verifyToken,
  messageRateLimiter,
  sendMessage
);

/**
 * @route   GET /api/interactions/conversations
 * @desc    Get user conversations
 * @access  Protected
 */
router.get(
  "/conversations",
  verifyToken,
  getUserConversations
);

/**
 * @route   GET /api/interactions/conversations/:conversationId/messages
 * @desc    Get conversation messages
 * @access  Protected
 */
router.get(
  "/conversations/:conversationId/messages",
  verifyToken,
  getConversationMessages
);

/**
 * @route   DELETE /api/interactions/messages/:messageId
 * @desc    Delete message
 * @access  Protected (Message sender only)
 */
router.delete(
  "/messages/:messageId",
  verifyToken,
  deleteMessage
);

export default router;
