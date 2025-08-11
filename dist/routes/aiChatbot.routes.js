"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const rateLimiter_1 = require("../middleware/rateLimiter");
const aiChatbot_controller_1 = require("../controllers/aiChatbot.controller");
const router = express_1.default.Router();
// Rate limiters
const messageRateLimiter = (0, rateLimiter_1.rateLimiter)(20, 60000); // 20 messages per minute
const infoRateLimiter = (0, rateLimiter_1.rateLimiter)(10, 60000); // 10 requests per minute
// =============================================================================
// AI Chatbot Routes
// =============================================================================
/**
 * @route   GET /api/ai-chatbot/info
 * @desc    Get AI chatbot information and capabilities
 * @access  Public
 * @returns { success: boolean, data: ChatbotInfo }
 */
router.get("/info", infoRateLimiter, aiChatbot_controller_1.getChatbotInfo);
/**
 * @route   POST /api/ai-chatbot/message
 * @desc    Send message to AI chatbot for biblical counseling
 * @access  Protected
 * @body    { message: string }
 * @returns { success: boolean, data: AIResponse }
 */
router.post("/message", auth_middleware_1.verifyToken, messageRateLimiter, aiChatbot_controller_1.sendMessage);
/**
 * @route   GET /api/ai-chatbot/history
 * @desc    Get user's chat history with AI
 * @access  Protected
 * @returns { success: boolean, data: { messages: ChatMessage[], totalMessages: number } }
 */
router.get("/history", auth_middleware_1.verifyToken, aiChatbot_controller_1.getChatHistory);
/**
 * @route   DELETE /api/ai-chatbot/history
 * @desc    Clear user's chat history with AI
 * @access  Protected
 * @returns { success: boolean, message: string }
 */
router.delete("/history", auth_middleware_1.verifyToken, aiChatbot_controller_1.clearChatHistory);
/**
 * @route   GET /api/ai-chatbot/stats
 * @desc    Get user's session statistics
 * @access  Protected
 * @returns { success: boolean, data: SessionStats }
 */
router.get("/stats", auth_middleware_1.verifyToken, aiChatbot_controller_1.getSessionStats);
exports.default = router;
