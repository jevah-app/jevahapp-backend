import { Request, Response } from "express";
import datingService from "../service/dating.service";
import logger from "../utils/logger";

/**
 * Create or update dating profile
 */
export const createOrUpdateProfile = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      lookingFor,
      ageRange,
      location,
      bio,
      interests = [],
      photos = [],
      mainPhoto,
      height,
      education,
      occupation,
      faithLevel,
      denomination,
      preferences,
    } = request.body;

    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (
      !lookingFor ||
      !ageRange ||
      !location ||
      !bio ||
      !photos ||
      !mainPhoto ||
      !faithLevel ||
      !preferences
    ) {
      response.status(400).json({
        success: false,
        message:
          "Missing required fields: lookingFor, ageRange, location, bio, photos, mainPhoto, faithLevel, preferences",
      });
      return;
    }

    const profile = await datingService.createOrUpdateProfile(userIdentifier, {
      lookingFor,
      ageRange,
      location,
      bio,
      interests: Array.isArray(interests) ? interests : [interests],
      photos: Array.isArray(photos) ? photos : [photos],
      mainPhoto,
      height: height ? parseInt(height) : undefined,
      education,
      occupation,
      faithLevel,
      denomination,
      preferences,
    });

    response.status(200).json({
      success: true,
      message: "Dating profile updated successfully",
      data: profile,
    });
  } catch (error: any) {
    logger.error("Error creating/updating dating profile", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to update dating profile",
    });
  }
};

/**
 * Get dating profile
 */
export const getProfile = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const profile = await datingService.getProfile(userIdentifier);

    response.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    logger.error("Error getting dating profile", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to get dating profile",
    });
  }
};

/**
 * Get potential matches
 */
export const getPotentialMatches = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      ageRange,
      faithLevel,
      denomination,
      maxDistance,
      interests,
      page = 1,
      limit = 20,
    } = request.query;

    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const filters: any = {};
    if (ageRange) {
      try {
        const ageRangeObj = JSON.parse(ageRange as string);
        filters.ageRange = {
          min: parseInt(ageRangeObj.min),
          max: parseInt(ageRangeObj.max),
        };
      } catch (error) {
        // Ignore invalid age range
      }
    }
    if (faithLevel) filters.faithLevel = faithLevel;
    if (denomination) filters.denomination = denomination;
    if (maxDistance) filters.maxDistance = parseInt(maxDistance as string);
    if (interests)
      filters.interests = Array.isArray(interests) ? interests : [interests];

    const result = await datingService.getPotentialMatches(
      userIdentifier,
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: result.profiles,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      filters,
    });
  } catch (error: any) {
    logger.error("Error getting potential matches", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get potential matches",
    });
  }
};

/**
 * Like a profile
 */
export const likeProfile = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { userId: likedUserId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const match = await datingService.likeProfile(userIdentifier, likedUserId);

    response.status(200).json({
      success: true,
      message: "Profile liked successfully",
      data: match,
    });
  } catch (error: any) {
    logger.error("Error liking profile", {
      error: error.message,
      userId: request.userId,
      likedUserId: request.params.userId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to like profile",
    });
  }
};

/**
 * Respond to match (accept/reject)
 */
export const respondToMatch = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { matchId } = request.params;
    const { response: matchResponse } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!matchResponse || !["accepted", "rejected"].includes(matchResponse)) {
      response.status(400).json({
        success: false,
        message: "Response must be 'accepted' or 'rejected'",
      });
      return;
    }

    const match = await datingService.respondToMatch(
      userIdentifier,
      matchId,
      matchResponse as "accepted" | "rejected"
    );

    response.status(200).json({
      success: true,
      message: `Match ${matchResponse} successfully`,
      data: match,
    });
  } catch (error: any) {
    logger.error("Error responding to match", {
      error: error.message,
      userId: request.userId,
      matchId: request.params.matchId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to respond to match",
    });
  }
};

/**
 * Get user's matches
 */
export const getUserMatches = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { status } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const matches = await datingService.getUserMatches(
      userIdentifier,
      status as "pending" | "accepted" | "rejected"
    );

    response.status(200).json({
      success: true,
      data: matches,
      filters: {
        status,
      },
    });
  } catch (error: any) {
    logger.error("Error getting user matches", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get user matches",
    });
  }
};

/**
 * Send message
 */
export const sendMessage = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      matchId,
      content,
      messageType = "text",
      attachments = [],
    } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!matchId || !content) {
      response.status(400).json({
        success: false,
        message: "Match ID and content are required",
      });
      return;
    }

    const message = await datingService.sendMessage(
      userIdentifier,
      matchId,
      content,
      messageType as "text" | "image" | "voice" | "gift",
      Array.isArray(attachments) ? attachments : [attachments]
    );

    response.status(200).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error: any) {
    logger.error("Error sending message", {
      error: error.message,
      userId: request.userId,
      matchId: request.body.matchId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to send message",
    });
  }
};

/**
 * Get match messages
 */
export const getMatchMessages = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { matchId } = request.params;
    const { page = 1, limit = 50 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await datingService.getMatchMessages(
      userIdentifier,
      matchId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: result.messages,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      matchId,
    });
  } catch (error: any) {
    logger.error("Error getting match messages", {
      error: error.message,
      userId: request.userId,
      matchId: request.params.matchId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to get match messages",
    });
  }
};

/**
 * Mark messages as read
 */
export const markMessagesAsRead = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { matchId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    await datingService.markMessagesAsRead(userIdentifier, matchId);

    response.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error: any) {
    logger.error("Error marking messages as read", {
      error: error.message,
      userId: request.userId,
      matchId: request.params.matchId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
    });
  }
};

/**
 * Get unread message count
 */
export const getUnreadMessageCount = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const count = await datingService.getUnreadMessageCount(userIdentifier);

    response.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error: any) {
    logger.error("Error getting unread message count", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get unread message count",
    });
  }
};

/**
 * Deactivate dating profile
 */
export const deactivateProfile = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    await datingService.deactivateProfile(userIdentifier);

    response.status(200).json({
      success: true,
      message: "Dating profile deactivated successfully",
    });
  } catch (error: any) {
    logger.error("Error deactivating dating profile", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to deactivate dating profile",
    });
  }
};
