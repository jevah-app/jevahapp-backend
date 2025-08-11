import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter";
import {
  toggleContentLike,
  addContentComment,
  getContentMetadata,
  getContentComments,
  shareContent,
} from "../controllers/contentInteraction.controller";

const router = express.Router();

// Rate limiters
const interactionRateLimiter = rateLimiter(10, 60000); // 10 requests per minute
const commentRateLimiter = rateLimiter(5, 60000); // 5 comments per minute

// =============================================================================
// Universal Content Interactions
// =============================================================================

/**
 * @route   POST /api/content/:contentType/:contentId/like
 * @desc    Toggle like on any content type (media, devotional, artist, merch, ebook, podcast)
 * @access  Protected
 * @param   { contentType: string } - Type of content (media, devotional, artist, merch, ebook, podcast)
 * @param   { contentId: string } - MongoDB ObjectId of the content
 * @returns { success: boolean, message: string, data: { liked: boolean, likeCount: number } }
 */
router.post(
  "/:contentType/:contentId/like",
  verifyToken,
  interactionRateLimiter,
  toggleContentLike
);

/**
 * @route   POST /api/content/:contentType/:contentId/comment
 * @desc    Add comment to content (media, devotional)
 * @access  Protected
 * @param   { contentType: string } - Type of content (media, devotional)
 * @param   { contentId: string } - MongoDB ObjectId of the content
 * @body    { content: string, parentCommentId?: string }
 * @returns { success: boolean, message: string, data: comment }
 */
router.post(
  "/:contentType/:contentId/comment",
  verifyToken,
  commentRateLimiter,
  addContentComment
);

/**
 * @route   GET /api/content/:contentType/:contentId/metadata
 * @desc    Get content metadata for frontend UI (includes stats and user interactions)
 * @access  Public (with optional user context)
 * @param   { contentType: string } - Type of content
 * @param   { contentId: string } - MongoDB ObjectId of the content
 * @returns { success: boolean, data: ContentMetadata }
 */
router.get("/:contentType/:contentId/metadata", getContentMetadata);

/**
 * @route   GET /api/content/:contentType/:contentId/comments
 * @desc    Get comments for content (media, devotional)
 * @access  Public
 * @param   { contentType: string } - Type of content (media, devotional)
 * @param   { contentId: string } - MongoDB ObjectId of the content
 * @query   { page?: number, limit?: number }
 * @returns { success: boolean, data: { comments: array, pagination: object } }
 */
router.get("/:contentType/:contentId/comments", getContentComments);

/**
 * @route   POST /api/content/:contentType/:contentId/share
 * @desc    Share content to social platforms
 * @access  Protected
 * @param   { contentType: string } - Type of content
 * @param   { contentId: string } - MongoDB ObjectId of the content
 * @body    { platform?: string, message?: string }
 * @returns { success: boolean, message: string, data: { shareUrls: object, platform: string } }
 */
router.post(
  "/:contentType/:contentId/share",
  verifyToken,
  interactionRateLimiter,
  shareContent
);

export default router;
