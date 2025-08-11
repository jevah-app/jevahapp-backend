import express from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { rateLimiter } from "../middleware/rateLimiter";
import {
  sendMessage,
  getChatHistory,
  clearChatHistory,
  getSessionStats,
  getChatbotInfo,
} from "../controllers/aiChatbot.controller";

const router = express.Router();

// Rate limiters
const messageRateLimiter = rateLimiter(20, 60000); // 20 messages per minute
const infoRateLimiter = rateLimiter(10, 60000); // 10 requests per minute

// =============================================================================
// AI Chatbot Routes
// =============================================================================

/**
 * @route   GET /api/ai-chatbot/info
 * @desc    Get AI chatbot information and capabilities
 * @access  Public
 * @returns { success: boolean, data: ChatbotInfo }
 */
router.get("/info", infoRateLimiter, getChatbotInfo);

/**
 * @route   POST /api/ai-chatbot/message
 * @desc    Send message to AI chatbot for biblical counseling
 * @access  Protected
 * @body    { message: string }
 * @returns { success: boolean, data: AIResponse }
 */
router.post("/message", verifyToken, messageRateLimiter, sendMessage);

/**
 * @route   GET /api/ai-chatbot/history
 * @desc    Get user's chat history with AI
 * @access  Protected
 * @returns { success: boolean, data: { messages: ChatMessage[], totalMessages: number } }
 */
router.get("/history", verifyToken, getChatHistory);

/**
 * @route   DELETE /api/ai-chatbot/history
 * @desc    Clear user's chat history with AI
 * @access  Protected
 * @returns { success: boolean, message: string }
 */
router.delete("/history", verifyToken, clearChatHistory);

/**
 * @route   GET /api/ai-chatbot/stats
 * @desc    Get user's session statistics
 * @access  Protected
 * @returns { success: boolean, data: SessionStats }
 */
router.get("/stats", verifyToken, getSessionStats);

export default router;
