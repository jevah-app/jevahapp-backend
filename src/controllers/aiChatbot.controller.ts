import { Request, Response } from "express";
import { User } from "../models/user.model";
import aiChatbotService from "../service/aiChatbot.service";
import logger from "../utils/logger";

/**
 * Send message to AI chatbot
 */
export const sendMessage = async (
  req: Request,
  res: Response
): Promise<void> => {
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
    const user = await User.findById(userId).select(
      "firstName lastName email avatar"
    );
    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    // Generate AI response
    const aiResponse = await aiChatbotService.generateResponse(
      userId,
      message.trim(),
      user
    );

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
  } catch (error: any) {
    logger.error("AI chatbot send message error", {
      error: error.message,
      userId: req.userId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to generate AI response. Please try again.",
    });
  }
};

/**
 * Get chat history for user
 */
export const getChatHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const chatHistory = aiChatbotService.getChatHistory(userId);

    res.status(200).json({
      success: true,
      data: {
        messages: chatHistory,
        totalMessages: chatHistory.length,
      },
    });
  } catch (error: any) {
    logger.error("AI chatbot get history error", {
      error: error.message,
      userId: req.userId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve chat history",
    });
  }
};

/**
 * Clear chat history for user
 */
export const clearChatHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    aiChatbotService.clearChatHistory(userId);

    res.status(200).json({
      success: true,
      message: "Chat history cleared successfully",
    });
  } catch (error: any) {
    logger.error("AI chatbot clear history error", {
      error: error.message,
      userId: req.userId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to clear chat history",
    });
  }
};

/**
 * Get session statistics
 */
export const getSessionStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const stats = aiChatbotService.getSessionStats(userId);

    res.status(200).json({
      success: true,
      data: stats || {
        messageCount: 0,
        sessionDuration: 0,
        topics: [],
        lastActivity: null,
      },
    });
  } catch (error: any) {
    logger.error("AI chatbot get stats error", {
      error: error.message,
      userId: req.userId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve session statistics",
    });
  }
};

/**
 * Get AI chatbot information
 */
export const getChatbotInfo = async (
  req: Request,
  res: Response
): Promise<void> => {
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
        mission:
          "To be the 'Ark of God' - a shield against worldly nonsense and a beacon of God's truth and love.",
        disclaimer:
          "This AI provides spiritual guidance based on biblical principles. For medical emergencies, please consult healthcare professionals.",
      },
    });
  } catch (error: any) {
    logger.error("AI chatbot info error", {
      error: error.message,
    });

    res.status(500).json({
      success: false,
      message: "Failed to retrieve chatbot information",
    });
  }
};
