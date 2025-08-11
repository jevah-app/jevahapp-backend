import { Request, Response } from "express";
import { Types } from "mongoose";
import contentInteractionService from "../service/contentInteraction.service";
import logger from "../utils/logger";

// Toggle like on any content type
export const toggleContentLike = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid content ID",
      });
      return;
    }

    if (
      !contentType ||
      !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(
        contentType
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid content type",
      });
      return;
    }

    const result = await contentInteractionService.toggleLike(
      userId,
      contentId,
      contentType
    );

    res.status(200).json({
      success: true,
      message: result.liked
        ? "Content liked successfully"
        : "Content unliked successfully",
      data: result,
    });
  } catch (error: any) {
    logger.error("Toggle content like error", {
      error: error.message,
      userId: req.userId,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
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

// Add comment to content
export const addContentComment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid content ID",
      });
      return;
    }

    if (
      !contentType ||
      !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(
        contentType
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid content type",
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

    const comment = await contentInteractionService.addComment(
      userId,
      contentId,
      contentType,
      content,
      parentCommentId
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: comment,
    });
  } catch (error: any) {
    logger.error("Add content comment error", {
      error: error.message,
      userId: req.userId,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
    });

    if (error.message.includes("not found")) {
      res.status(404).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("not supported")) {
      res.status(400).json({
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

// Get content metadata for frontend UI
export const getContentMetadata = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const userId = req.userId; // Optional, for user-specific interactions

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid content ID",
      });
      return;
    }

    if (
      !contentType ||
      !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(
        contentType
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid content type",
      });
      return;
    }

    const metadata = await contentInteractionService.getContentMetadata(
      userId || "",
      contentId,
      contentType
    );

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error: any) {
    logger.error("Get content metadata error", {
      error: error.message,
      userId: req.userId,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
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
      message: "Failed to get content metadata",
    });
  }
};

// Get comments for content
export const getContentComments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid content ID",
      });
      return;
    }

    if (!contentType || !["media", "devotional"].includes(contentType)) {
      res.status(400).json({
        success: false,
        message: "Comments not supported for this content type",
      });
      return;
    }

    // For now, we'll use the existing interaction service for comments
    // TODO: Extend this to support devotionals
    const { getComments } = await import("./interaction.controller");

    // Mock the request object for the existing service
    const mockReq = {
      params: { mediaId: contentId },
      query: { page, limit },
    } as any;

    const mockRes = {
      status: (code: number) => ({
        json: (data: any) => {
          if (code === 200) {
            res.status(200).json({
              success: true,
              data: data,
            });
          } else {
            res.status(code).json(data);
          }
        },
      }),
    } as any;

    await getComments(mockReq, mockRes);
  } catch (error: any) {
    logger.error("Get content comments error", {
      error: error.message,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
    });

    res.status(500).json({
      success: false,
      message: "Failed to get comments",
    });
  }
};

// Share content
export const shareContent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { contentId, contentType } = req.params;
    const { platform, message } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      res.status(400).json({
        success: false,
        message: "Invalid content ID",
      });
      return;
    }

    if (
      !contentType ||
      !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(
        contentType
      )
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid content type",
      });
      return;
    }

    // For now, we'll use the existing share service
    // TODO: Extend this to support all content types
    const { default: shareService } = await import("../service/share.service");

    const shareUrls = await shareService.generateSocialShareUrls(
      contentId,
      message
    );

    res.status(200).json({
      success: true,
      message: "Content shared successfully",
      data: {
        shareUrls,
        platform,
        contentType,
      },
    });
  } catch (error: any) {
    logger.error("Share content error", {
      error: error.message,
      userId: req.userId,
      contentId: req.params.contentId,
      contentType: req.params.contentType,
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
      message: "Failed to share content",
    });
  }
};
