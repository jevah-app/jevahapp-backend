"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const interaction_controller_1 = require("../controllers/interaction.controller");
const router = express_1.default.Router();
// Rate limiters
const interactionRateLimiter = (0, rateLimiter_1.rateLimiter)(10, 60000); // 10 requests per minute
const commentRateLimiter = (0, rateLimiter_1.rateLimiter)(5, 60000); // 5 comments per minute
const messageRateLimiter = (0, rateLimiter_1.rateLimiter)(20, 60000); // 20 messages per minute
// =============================================================================
// Media Interactions (Likes, Comments, Shares)
// =============================================================================
/**
 * @route   POST /api/interactions/media/:mediaId/like
 * @desc    Toggle like/unlike on media
 * @access  Protected
 */
router.post("/media/:mediaId/like", auth_middleware_1.verifyToken, interactionRateLimiter, interaction_controller_1.toggleLike);
/**
 * @route   POST /api/interactions/media/:mediaId/comment
 * @desc    Add comment to media
 * @access  Protected
 */
router.post("/media/:mediaId/comment", auth_middleware_1.verifyToken, commentRateLimiter, interaction_controller_1.addComment);
/**
 * @route   DELETE /api/interactions/comments/:commentId
 * @desc    Remove comment
 * @access  Protected (Comment owner only)
 */
router.delete("/comments/:commentId", auth_middleware_1.verifyToken, interaction_controller_1.removeComment);
/**
 * @route   POST /api/interactions/comments/:commentId/reaction
 * @desc    Add reaction to comment
 * @access  Protected
 */
router.post("/comments/:commentId/reaction", auth_middleware_1.verifyToken, interactionRateLimiter, interaction_controller_1.addCommentReaction);
/**
 * @route   POST /api/interactions/media/:mediaId/share
 * @desc    Share media
 * @access  Protected
 */
router.post("/media/:mediaId/share", auth_middleware_1.verifyToken, interactionRateLimiter, interaction_controller_1.shareMedia);
/**
 * @route   GET /api/interactions/media/:mediaId/comments
 * @desc    Get comments for media
 * @access  Public
 */
router.get("/media/:mediaId/comments", interaction_controller_1.getComments);
/**
 * @route   GET /api/interactions/media/:mediaId/share-urls
 * @desc    Get share URLs for media
 * @access  Public
 */
router.get("/media/:mediaId/share-urls", interaction_controller_1.getShareUrls);
/**
 * @route   GET /api/interactions/media/:mediaId/share-stats
 * @desc    Get share statistics for media
 * @access  Public
 */
router.get("/media/:mediaId/share-stats", interaction_controller_1.getShareStats);
// =============================================================================
// Messaging System
// =============================================================================
/**
 * @route   POST /api/interactions/messages/:recipientId
 * @desc    Send message to user
 * @access  Protected
 */
router.post("/messages/:recipientId", auth_middleware_1.verifyToken, messageRateLimiter, interaction_controller_1.sendMessage);
/**
 * @route   GET /api/interactions/conversations
 * @desc    Get user conversations
 * @access  Protected
 */
router.get("/conversations", auth_middleware_1.verifyToken, interaction_controller_1.getUserConversations);
/**
 * @route   GET /api/interactions/conversations/:conversationId/messages
 * @desc    Get conversation messages
 * @access  Protected
 */
router.get("/conversations/:conversationId/messages", auth_middleware_1.verifyToken, interaction_controller_1.getConversationMessages);
/**
 * @route   DELETE /api/interactions/messages/:messageId
 * @desc    Delete message
 * @access  Protected (Message sender only)
 */
router.delete("/messages/:messageId", auth_middleware_1.verifyToken, interaction_controller_1.deleteMessage);
exports.default = router;
