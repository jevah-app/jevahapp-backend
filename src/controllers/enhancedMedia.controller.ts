import { Request, Response } from "express";
import enhancedMediaService from "../service/enhancedMedia.service";
import logger from "../utils/logger";

/**
 * Get trending media
 */
export const getTrendingMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { contentType, limit = 20, days = 7 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const trendingMedia = await enhancedMediaService.getTrendingMedia(
      contentType as string,
      parseInt(limit as string),
      parseInt(days as string)
    );

    response.status(200).json({
      success: true,
      data: trendingMedia,
      filters: {
        contentType,
        limit: parseInt(limit as string),
        days: parseInt(days as string),
      },
    });
  } catch (error: any) {
    logger.error("Error getting trending media", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get trending media",
    });
  }
};

/**
 * Get most viewed media
 */
export const getMostViewedMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { contentType, limit = 20, days } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const mostViewed = await enhancedMediaService.getMostViewedMedia(
      contentType as string,
      parseInt(limit as string),
      days ? parseInt(days as string) : undefined
    );

    response.status(200).json({
      success: true,
      data: mostViewed,
      filters: {
        contentType,
        limit: parseInt(limit as string),
        days: days ? parseInt(days as string) : undefined,
      },
    });
  } catch (error: any) {
    logger.error("Error getting most viewed media", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get most viewed media",
    });
  }
};

/**
 * Advanced media search with filters
 */
export const searchMediaWithFilters = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      contentType,
      category,
      topics,
      search,
      sortBy = "newest",
      dateRange,
      duration,
      priceRange,
      isAvailable,
      uploadedBy,
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
    if (contentType) filters.contentType = contentType;
    if (category) filters.category = category;
    if (topics) filters.topics = Array.isArray(topics) ? topics : [topics];
    if (search) filters.search = search;
    if (sortBy) filters.sortBy = sortBy;
    if (isAvailable !== undefined) filters.isAvailable = isAvailable === "true";
    if (uploadedBy) filters.uploadedBy = uploadedBy;

    if (dateRange) {
      try {
        const dateRangeObj = JSON.parse(dateRange as string);
        filters.dateRange = {
          start: new Date(dateRangeObj.start),
          end: new Date(dateRangeObj.end),
        };
      } catch (error) {
        // Ignore invalid date range
      }
    }

    if (duration) filters.duration = duration;

    if (priceRange) {
      try {
        const priceRangeObj = JSON.parse(priceRange as string);
        filters.priceRange = {
          min: parseFloat(priceRangeObj.min),
          max: parseFloat(priceRangeObj.max),
        };
      } catch (error) {
        // Ignore invalid price range
      }
    }

    const result = await enhancedMediaService.searchMediaWithFilters(
      filters,
      parseInt(page as string),
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: result.media,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      filters,
    });
  } catch (error: any) {
    logger.error("Error searching media with filters", {
      error: error.message,
      userId: request.userId,
      query: request.query,
    });
    response.status(500).json({
      success: false,
      message: "Failed to search media",
    });
  }
};

/**
 * Add media to library
 */
export const addToLibrary = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { mediaId, mediaType = "media", notes, rating } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!mediaId) {
      response.status(400).json({
        success: false,
        message: "Media ID is required",
      });
      return;
    }

    await enhancedMediaService.addToLibrary(
      userIdentifier,
      mediaId,
      mediaType as "media" | "merchandise",
      notes,
      rating ? parseInt(rating) : undefined
    );

    response.status(200).json({
      success: true,
      message: "Media added to library successfully",
    });
  } catch (error: any) {
    logger.error("Error adding to library", {
      error: error.message,
      userId: request.userId,
      mediaId: request.body.mediaId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to add to library",
    });
  }
};

/**
 * Remove media from library
 */
export const removeFromLibrary = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { mediaId, mediaType = "media" } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    await enhancedMediaService.removeFromLibrary(
      userIdentifier,
      mediaId,
      mediaType as "media" | "merchandise"
    );

    response.status(200).json({
      success: true,
      message: "Media removed from library successfully",
    });
  } catch (error: any) {
    logger.error("Error removing from library", {
      error: error.message,
      userId: request.userId,
      mediaId: request.params.mediaId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to remove from library",
    });
  }
};

/**
 * Get user's library
 */
export const getUserLibrary = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { mediaType, page = 1, limit = 20 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await enhancedMediaService.getUserLibrary(
      userIdentifier,
      mediaType as "media" | "merchandise",
      parseInt(page as string),
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      filters: {
        mediaType,
      },
    });
  } catch (error: any) {
    logger.error("Error getting user library", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get user library",
    });
  }
};

/**
 * Update watch progress
 */
export const updateWatchProgress = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { mediaId, progress, completionPercentage } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (
      !mediaId ||
      progress === undefined ||
      completionPercentage === undefined
    ) {
      response.status(400).json({
        success: false,
        message: "Media ID, progress, and completion percentage are required",
      });
      return;
    }

    await enhancedMediaService.updateWatchProgress(
      userIdentifier,
      mediaId,
      parseInt(progress),
      parseInt(completionPercentage)
    );

    response.status(200).json({
      success: true,
      message: "Watch progress updated successfully",
    });
  } catch (error: any) {
    logger.error("Error updating watch progress", {
      error: error.message,
      userId: request.userId,
      mediaId: request.body.mediaId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to update watch progress",
    });
  }
};

/**
 * Get currently watching
 */
export const getCurrentlyWatching = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { limit = 10 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const currentlyWatching = await enhancedMediaService.getCurrentlyWatching(
      userIdentifier,
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: currentlyWatching,
      filters: {
        limit: parseInt(limit as string),
      },
    });
  } catch (error: any) {
    logger.error("Error getting currently watching", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get currently watching",
    });
  }
};
