import { Request, Response } from "express";
import merchandiseService from "../service/merchandise.service";
import logger from "../utils/logger";

/**
 * Create new merchandise listing
 */
export const createMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      price,
      currency = "USD",
      stockQuantity,
      category,
      tags = [],
      images,
      thumbnailUrl,
      specifications = {},
      shippingInfo,
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
      !title ||
      !description ||
      !price ||
      !stockQuantity ||
      !category ||
      !images ||
      !thumbnailUrl ||
      !shippingInfo
    ) {
      response.status(400).json({
        success: false,
        message:
          "Missing required fields: title, description, price, stockQuantity, category, images, thumbnailUrl, shippingInfo",
      });
      return;
    }

    const merchandise = await merchandiseService.createMerchandise({
      title,
      description,
      price: parseFloat(price),
      currency,
      stockQuantity: parseInt(stockQuantity),
      category,
      tags,
      images: Array.isArray(images) ? images : [images],
      thumbnailUrl,
      seller: userIdentifier,
      specifications,
      shippingInfo,
    });

    response.status(201).json({
      success: true,
      message: "Merchandise created successfully",
      data: merchandise,
    });
  } catch (error: any) {
    logger.error("Error creating merchandise", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to create merchandise",
    });
  }
};

/**
 * Get merchandise by ID
 */
export const getMerchandiseById = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { merchandiseId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    // Increment view count
    await merchandiseService.incrementViewCount(merchandiseId);

    const merchandise =
      await merchandiseService.getMerchandiseById(merchandiseId);

    response.status(200).json({
      success: true,
      data: merchandise,
    });
  } catch (error: any) {
    logger.error("Error getting merchandise by ID", {
      error: error.message,
      userId: request.userId,
      merchandiseId: request.params.merchandiseId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to get merchandise",
    });
  }
};

/**
 * Search merchandise
 */
export const searchMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      category,
      search,
      priceRange,
      seller,
      isAvailable,
      rating,
      tags,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
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
    if (category) filters.category = category;
    if (search) filters.search = search;
    if (seller) filters.seller = seller;
    if (isAvailable !== undefined) filters.isAvailable = isAvailable === "true";
    if (rating) filters.rating = parseFloat(rating as string);
    if (tags) filters.tags = Array.isArray(tags) ? tags : [tags];

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

    const result = await merchandiseService.searchMerchandise(
      filters,
      parseInt(page as string),
      parseInt(limit as string),
      sortBy as string
    );

    response.status(200).json({
      success: true,
      data: result.merchandise,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      filters,
    });
  } catch (error: any) {
    logger.error("Error searching merchandise", {
      error: error.message,
      userId: request.userId,
      query: request.query,
    });
    response.status(500).json({
      success: false,
      message: "Failed to search merchandise",
    });
  }
};

/**
 * Get trending merchandise
 */
export const getTrendingMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { limit = 20 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const trendingMerchandise = await merchandiseService.getTrendingMerchandise(
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: trendingMerchandise,
      filters: {
        limit: parseInt(limit as string),
      },
    });
  } catch (error: any) {
    logger.error("Error getting trending merchandise", {
      error: error.message,
      userId: request.userId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get trending merchandise",
    });
  }
};

/**
 * Update merchandise
 */
export const updateMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { merchandiseId } = request.params;
    const updateData = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const merchandise = await merchandiseService.updateMerchandise(
      merchandiseId,
      userIdentifier,
      updateData
    );

    response.status(200).json({
      success: true,
      message: "Merchandise updated successfully",
      data: merchandise,
    });
  } catch (error: any) {
    logger.error("Error updating merchandise", {
      error: error.message,
      userId: request.userId,
      merchandiseId: request.params.merchandiseId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to update merchandise",
    });
  }
};

/**
 * Delete merchandise
 */
export const deleteMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { merchandiseId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    await merchandiseService.deleteMerchandise(merchandiseId, userIdentifier);

    response.status(200).json({
      success: true,
      message: "Merchandise deleted successfully",
    });
  } catch (error: any) {
    logger.error("Error deleting merchandise", {
      error: error.message,
      userId: request.userId,
      merchandiseId: request.params.merchandiseId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to delete merchandise",
    });
  }
};

/**
 * Add review to merchandise
 */
export const addReview = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { merchandiseId } = request.params;
    const { rating, comment } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!rating || rating < 1 || rating > 5) {
      response.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
      return;
    }

    await merchandiseService.addReview(
      merchandiseId,
      userIdentifier,
      parseInt(rating),
      comment
    );

    response.status(200).json({
      success: true,
      message: "Review added successfully",
    });
  } catch (error: any) {
    logger.error("Error adding review", {
      error: error.message,
      userId: request.userId,
      merchandiseId: request.params.merchandiseId,
    });
    response.status(500).json({
      success: false,
      message: error.message || "Failed to add review",
    });
  }
};

/**
 * Get seller's merchandise
 */
export const getSellerMerchandise = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { sellerId } = request.params;
    const { page = 1, limit = 20 } = request.query;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await merchandiseService.getSellerMerchandise(
      sellerId,
      parseInt(page as string),
      parseInt(limit as string)
    );

    response.status(200).json({
      success: true,
      data: result.merchandise,
      pagination: {
        page: result.page,
        limit: parseInt(limit as string),
        total: result.total,
        totalPages: result.totalPages,
      },
      sellerId,
    });
  } catch (error: any) {
    logger.error("Error getting seller merchandise", {
      error: error.message,
      userId: request.userId,
      sellerId: request.params.sellerId,
    });
    response.status(500).json({
      success: false,
      message: "Failed to get seller merchandise",
    });
  }
};
