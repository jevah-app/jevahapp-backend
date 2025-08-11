import { Merchandise } from "../models/merchandise.model";
import { Types } from "mongoose";
import logger from "../utils/logger";

interface MerchandiseFilters {
  category?: string;
  search?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  seller?: string;
  isAvailable?: boolean;
  rating?: number;
  tags?: string[];
}

interface CreateMerchandiseData {
  title: string;
  description: string;
  price: number;
  currency?: string;
  stockQuantity: number;
  category: string;
  tags?: string[];
  images: string[];
  thumbnailUrl: string;
  seller: string;
  specifications?: Record<string, any>;
  shippingInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingCost: number;
    estimatedDelivery: number;
  };
}

class MerchandiseService {
  /**
   * Create new merchandise listing
   */
  async createMerchandise(data: CreateMerchandiseData): Promise<any> {
    const startTime = Date.now();

    try {
      const merchandise = await Merchandise.create({
        ...data,
        seller: new Types.ObjectId(data.seller),
        currency: data.currency || "USD",
        isAvailable: data.stockQuantity > 0,
      });

      const duration = Date.now() - startTime;
      logger.logDatabase("create", "merchandise", duration, {
        seller: data.seller,
        title: data.title,
        category: data.category,
      });

      return merchandise;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error creating merchandise", {
        error: error.message,
        seller: data.seller,
        title: data.title,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get merchandise by ID
   */
  async getMerchandiseById(merchandiseId: string): Promise<any> {
    const startTime = Date.now();

    try {
      const merchandise = await Merchandise.findById(merchandiseId)
        .populate("seller", "firstName lastName email avatar")
        .populate("reviews.userId", "firstName lastName avatar");

      if (!merchandise) {
        throw new Error("Merchandise not found");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("find", "merchandise", duration, {
        merchandiseId,
      });

      return merchandise;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting merchandise by ID", {
        error: error.message,
        merchandiseId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Search merchandise with filters
   */
  async searchMerchandise(
    filters: MerchandiseFilters,
    page: number = 1,
    limit: number = 20,
    sortBy: string = "createdAt"
  ): Promise<{
    merchandise: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const skip = (page - 1) * limit;
      const matchStage: any = {};

      // Apply filters
      if (filters.category) matchStage.category = filters.category;
      if (filters.seller) {
        matchStage.seller = new Types.ObjectId(filters.seller);
      }
      if (filters.isAvailable !== undefined) {
        matchStage.isAvailable = filters.isAvailable;
      }
      if (filters.rating) {
        matchStage.rating = { $gte: filters.rating };
      }
      if (filters.tags && filters.tags.length > 0) {
        matchStage.tags = { $in: filters.tags };
      }
      if (filters.priceRange) {
        matchStage.price = {
          $gte: filters.priceRange.min,
          $lte: filters.priceRange.max,
        };
      }

      // Text search
      if (filters.search) {
        matchStage.$text = { $search: filters.search };
      }

      // Sort options
      let sortStage: any = { [sortBy]: -1 };
      if (sortBy === "price") {
        sortStage = { price: 1 };
      } else if (sortBy === "rating") {
        sortStage = { rating: -1, totalRatings: -1 };
      } else if (sortBy === "popularity") {
        sortStage = { purchaseCount: -1, viewCount: -1 };
      }

      const pipeline = [
        { $match: matchStage },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            price: 1,
            currency: 1,
            stockQuantity: 1,
            isAvailable: 1,
            category: 1,
            tags: 1,
            images: 1,
            thumbnailUrl: 1,
            viewCount: 1,
            purchaseCount: 1,
            rating: 1,
            totalRatings: 1,
            createdAt: 1,
            "seller.firstName": 1,
            "seller.lastName": 1,
            "seller.avatar": 1,
          },
        },
      ];

      const [merchandise, total] = await Promise.all([
        Merchandise.aggregate(pipeline as any),
        Merchandise.countDocuments(matchStage),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "merchandise", duration, {
        operation: "searchMerchandise",
        filters: Object.keys(filters),
        page,
        limit,
        total,
      });

      return {
        merchandise,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error searching merchandise", {
        error: error.message,
        duration: `${duration}ms`,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get trending merchandise
   */
  async getTrendingMerchandise(limit: number = 20): Promise<any[]> {
    const startTime = Date.now();

    try {
      const pipeline = [
        {
          $match: {
            isAvailable: true,
            stockQuantity: { $gt: 0 },
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$viewCount", 0.3] },
                { $multiply: ["$purchaseCount", 0.4] },
                { $multiply: ["$rating", 0.2] },
                { $multiply: ["$totalRatings", 0.1] },
              ],
            },
          },
        },
        {
          $sort: { trendingScore: -1 },
        },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "seller",
            foreignField: "_id",
            as: "seller",
          },
        },
        { $unwind: "$seller" },
        {
          $project: {
            _id: 1,
            title: 1,
            price: 1,
            currency: 1,
            category: 1,
            thumbnailUrl: 1,
            rating: 1,
            totalRatings: 1,
            trendingScore: 1,
            "seller.firstName": 1,
            "seller.lastName": 1,
            "seller.avatar": 1,
          },
        },
      ];

      const trendingMerchandise = await Merchandise.aggregate(pipeline as any);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "merchandise", duration, {
        operation: "getTrendingMerchandise",
        limit,
      });

      return trendingMerchandise;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting trending merchandise", {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Update merchandise
   */
  async updateMerchandise(
    merchandiseId: string,
    sellerId: string,
    updateData: Partial<CreateMerchandiseData>
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const merchandise = await Merchandise.findOneAndUpdate(
        {
          _id: merchandiseId,
          seller: new Types.ObjectId(sellerId),
        },
        {
          ...updateData,
          isAvailable: updateData.stockQuantity
            ? updateData.stockQuantity > 0
            : undefined,
        },
        { new: true, runValidators: true }
      );

      if (!merchandise) {
        throw new Error("Merchandise not found or unauthorized");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "merchandise", duration, {
        merchandiseId,
        sellerId,
        updatedFields: Object.keys(updateData),
      });

      return merchandise;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error updating merchandise", {
        error: error.message,
        merchandiseId,
        sellerId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Delete merchandise
   */
  async deleteMerchandise(
    merchandiseId: string,
    sellerId: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const merchandise = await Merchandise.findOneAndDelete({
        _id: merchandiseId,
        seller: new Types.ObjectId(sellerId),
      });

      if (!merchandise) {
        throw new Error("Merchandise not found or unauthorized");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("delete", "merchandise", duration, {
        merchandiseId,
        sellerId,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error deleting merchandise", {
        error: error.message,
        merchandiseId,
        sellerId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Add review to merchandise
   */
  async addReview(
    merchandiseId: string,
    userId: string,
    rating: number,
    comment?: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const merchandise = await Merchandise.findById(merchandiseId);
      if (!merchandise) {
        throw new Error("Merchandise not found");
      }

      // Check if user already reviewed
      const existingReview = merchandise.reviews.find(
        (review: any) => review.userId.toString() === userId
      );

      if (existingReview) {
        throw new Error("User already reviewed this merchandise");
      }

      // Add review
      merchandise.reviews.push({
        userId: new Types.ObjectId(userId),
        rating,
        comment,
        createdAt: new Date(),
      });

      // Update average rating
      const totalRating = merchandise.reviews.reduce(
        (sum: number, review: any) => sum + review.rating,
        0
      );
      merchandise.rating = totalRating / merchandise.reviews.length;
      merchandise.totalRatings = merchandise.reviews.length;

      await merchandise.save();

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "merchandise", duration, {
        merchandiseId,
        userId,
        rating,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error adding review", {
        error: error.message,
        merchandiseId,
        userId,
        rating,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Increment view count
   */
  async incrementViewCount(merchandiseId: string): Promise<void> {
    try {
      await Merchandise.findByIdAndUpdate(merchandiseId, {
        $inc: { viewCount: 1 },
      });
    } catch (error: any) {
      logger.error("Error incrementing view count", {
        error: error.message,
        merchandiseId,
      });
    }
  }

  /**
   * Get seller's merchandise
   */
  async getSellerMerchandise(
    sellerId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    merchandise: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const skip = (page - 1) * limit;

      const [merchandise, total] = await Promise.all([
        Merchandise.find({ seller: new Types.ObjectId(sellerId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("seller", "firstName lastName email avatar"),
        Merchandise.countDocuments({ seller: new Types.ObjectId(sellerId) }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("find", "merchandise", duration, {
        operation: "getSellerMerchandise",
        sellerId,
        page,
        limit,
        total,
      });

      return {
        merchandise,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting seller merchandise", {
        error: error.message,
        sellerId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

export default new MerchandiseService();
