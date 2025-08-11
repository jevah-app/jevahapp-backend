import { Request, Response } from "express";
import { Types } from "mongoose";
import interactionService from "../service/interaction.service";
import shareService from "../service/share.service";
import logger from "../utils/logger";

// Like/Unlike media
export const toggleLike = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    const result = await interactionService.toggleLike({ userId, mediaId });

    res.status(200).json({
      success: true,
      message: result.liked ? "Media liked successfully" : "Media unliked successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error("Toggle like error", {
      error: error.message,
      userId: req.userId,
      mediaId: req.params.mediaId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};

// Add comment
export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
      return;
    }

    const comment = await interactionService.addComment({
      userId,
      mediaId,
      content,
      parentCommentId,
    });

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error: any) {
    logger.error("Add comment error", {
      error: error.message,
      userId: req.userId,
      mediaId: req.params.mediaId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
};

// Remove comment
export const removeComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!commentId || !Types.ObjectId.isValid(commentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
      return;
    }

    await interactionService.removeComment(commentId, userId);

    res.status(200).json({
      success: true,
      message: "Comment removed successfully",
    });
  } catch (error: any) {
    logger.error("Remove comment error", {
      error: error.message,
      userId: req.userId,
      commentId: req.params.commentId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("own comments")) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to remove comment",
    });
  }
};

// Add comment reaction
export const addCommentReaction = async (req: Request, res: Response): Promise<void> => {
  try {
    const { commentId } = req.params;
    const { reactionType } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!commentId || !Types.ObjectId.isValid(commentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
      return;
    }

    if (!reactionType) {
      res.status(400).json({
        success: false,
        message: "Reaction type is required",
      });
      return;
    }

    const result = await interactionService.addCommentReaction({
      userId,
      commentId,
      reactionType,
    });

    res.status(200).json({
      success: true,
      message: "Reaction added successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error("Add comment reaction error", {
      error: error.message,
      userId: req.userId,
      commentId: req.params.commentId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to add reaction",
    });
  }
};

// Share media
export const shareMedia = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    const { platform, message } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    // Record share interaction
    await interactionService.shareMedia({
      userId,
      mediaId,
      platform,
      message,
    });

    // Generate share URLs
    const shareUrls = await shareService.generateSocialShareUrls(mediaId, message);

    res.status(200).json({
      success: true,
      message: "Media shared successfully",
      data: {
        shareUrls,
        platform,
      },
    });
  } catch (error: any) {
    logger.error("Share media error", {
      error: error.message,
      userId: req.userId,
      mediaId: req.params.mediaId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to share media",
    });
  }
};

// Get comments
export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    const result = await interactionService.getComments(mediaId, page, limit);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get comments error", {
      error: error.message,
      mediaId: req.params.mediaId,
    });

    if (error.message.includes("Invalid")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to get comments",
    });
  }
};

// Send message
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId } = req.params;
    const { content, messageType, mediaUrl, replyTo } = req.body;
    const senderId = req.userId;

    if (!senderId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!recipientId || !Types.ObjectId.isValid(recipientId)) {
      res.status(400).json({
        success: false,
        message: "Invalid recipient ID",
      });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: "Message content is required",
      });
      return;
    }

    const message = await interactionService.sendMessage({
      senderId,
      recipientId,
      content,
      messageType,
      mediaUrl,
      replyTo,
    });

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: any) {
    logger.error("Send message error", {
      error: error.message,
      senderId: req.userId,
      recipientId: req.params.recipientId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

// Get conversation messages
export const getConversationMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!conversationId || !Types.ObjectId.isValid(conversationId)) {
      res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
      return;
    }

    const result = await interactionService.getConversationMessages(
      conversationId,
      userId,
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    logger.error("Get conversation messages error", {
      error: error.message,
      userId: req.userId,
      conversationId: req.params.conversationId,
    });

    if (error.message.includes("not found") || error.message.includes("access denied")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to get conversation messages",
    });
  }
};

// Get user conversations
export const getUserConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const conversations = await interactionService.getUserConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error: any) {
    logger.error("Get user conversations error", {
      error: error.message,
      userId: req.userId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get conversations",
    });
  }
};

// Delete message
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!messageId || !Types.ObjectId.isValid(messageId)) {
      res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
      return;
    }

    await interactionService.deleteMessage(messageId, userId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error: any) {
    logger.error("Delete message error", {
      error: error.message,
      userId: req.userId,
      messageId: req.params.messageId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("own messages")) {
      res.status(403).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete message",
    });
  }
};

// Get share URLs for media
export const getShareUrls = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;
    const { message } = req.query;

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    const shareUrls = await shareService.generateSocialShareUrls(mediaId, message as string);
    const qrCode = await shareService.generateQRCode(mediaId);
    const embedCode = await shareService.generateEmbedCode(mediaId);

    res.status(200).json({
      success: true,
      data: {
        shareUrls,
        qrCode,
        embedCode,
      },
    });
  } catch (error: any) {
    logger.error("Get share URLs error", {
      error: error.message,
      mediaId: req.params.mediaId,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to get share URLs",
    });
  }
};

// Get share statistics
export const getShareStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { mediaId } = req.params;

    if (!mediaId || !Types.ObjectId.isValid(mediaId)) {
      res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    const stats = await shareService.getShareStats(mediaId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    logger.error("Get share stats error", {
      error: error.message,
      mediaId: req.params.mediaId,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get share statistics",
    });
  }
};
