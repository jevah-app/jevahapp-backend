"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChatbotInfo = exports.getSessionStats = exports.clearChatHistory = exports.getChatHistory = exports.sendMessage = void 0;
const user_model_1 = require("../models/user.model");
const aiChatbot_service_1 = __importDefault(require("../service/aiChatbot.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Send message to AI chatbot
 */
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!message || message.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Message content is required",
            });
            return;
        }
        // Get user details
        const user = yield user_model_1.User.findById(userId).select("firstName lastName email avatar");
        if (!user) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        // Generate AI response
        const aiResponse = yield aiChatbot_service_1.default.generateResponse(userId, message.trim(), user);
        res.status(200).json({
            success: true,
            message: "AI response generated successfully",
            data: {
                response: aiResponse.response,
                bibleVerses: aiResponse.bibleVerses,
                recommendations: aiResponse.recommendations,
                followUpQuestions: aiResponse.followUpQuestions,
                emotionalSupport: aiResponse.emotionalSupport,
                timestamp: new Date(),
            },
        });
    }
    catch (error) {
        logger_1.default.error("AI chatbot send message error", {
            error: error.message,
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to generate AI response. Please try again.",
        });
    }
});
exports.sendMessage = sendMessage;
/**
 * Get chat history for user
 */
const getChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const chatHistory = aiChatbot_service_1.default.getChatHistory(userId);
        res.status(200).json({
            success: true,
            data: {
                messages: chatHistory,
                totalMessages: chatHistory.length,
            },
        });
    }
    catch (error) {
        logger_1.default.error("AI chatbot get history error", {
            error: error.message,
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to retrieve chat history",
        });
    }
});
exports.getChatHistory = getChatHistory;
/**
 * Clear chat history for user
 */
const clearChatHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        aiChatbot_service_1.default.clearChatHistory(userId);
        res.status(200).json({
            success: true,
            message: "Chat history cleared successfully",
        });
    }
    catch (error) {
        logger_1.default.error("AI chatbot clear history error", {
            error: error.message,
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to clear chat history",
        });
    }
});
exports.clearChatHistory = clearChatHistory;
/**
 * Get session statistics
 */
const getSessionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const stats = aiChatbot_service_1.default.getSessionStats(userId);
        res.status(200).json({
            success: true,
            data: stats || {
                messageCount: 0,
                sessionDuration: 0,
                topics: [],
                lastActivity: null,
            },
        });
    }
    catch (error) {
        logger_1.default.error("AI chatbot get stats error", {
            error: error.message,
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to retrieve session statistics",
        });
    }
});
exports.getSessionStats = getSessionStats;
/**
 * Get AI chatbot information
 */
const getChatbotInfo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        res.status(200).json({
            success: true,
            data: {
                name: "Jevah",
                description: "Biblical AI Counselor and Spiritual Guide",
                capabilities: [
                    "Biblical guidance and interpretation",
                    "Spiritual counseling and emotional support",
                    "Christian-based therapy",
                    "Health and wellness guidance",
                    "Relationship counseling",
                    "Prayer guidance and spiritual direction",
                ],
                features: [
                    "Real-time biblical responses",
                    "Scripture-based recommendations",
                    "Emotional support and encouragement",
                    "Push notifications for spiritual reminders",
                    "Personalized conversation history",
                    "Confidential and secure conversations",
                ],
                mission: "To be the 'Ark of God' - a shield against worldly nonsense and a beacon of God's truth and love.",
                disclaimer: "This AI provides spiritual guidance based on biblical principles. For medical emergencies, please consult healthcare professionals.",
            },
        });
    }
    catch (error) {
        logger_1.default.error("AI chatbot info error", {
            error: error.message,
        });
        res.status(500).json({
            success: false,
            message: "Failed to retrieve chatbot information",
        });
    }
});
exports.getChatbotInfo = getChatbotInfo;
