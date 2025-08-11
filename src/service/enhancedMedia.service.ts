import { Media } from "../models/media.model";
import { Library } from "../models/library.model";
import { Merchandise } from "../models/merchandise.model";
import { Types } from "mongoose";
import logger from "../utils/logger";

interface MediaFilters {
  contentType?: string;
  category?: string;
  topics?: string[];
  search?: string;
  sortBy?:
    | "trending"
    | "most_viewed"
    | "most_liked"
    | "most_shared"
    | "newest"
    | "oldest";
  dateRange?: {
    start: Date;
    end: Date;
  };
  duration?: "short" | "medium" | "long";
  priceRange?: {
    min: number;
    max: number;
  };
  isAvailable?: boolean;
  uploadedBy?: string;
}

interface TrendingWeights {
  views: number;
  likes: number;
  shares: number;
  comments: number;
  recency: number;
}

class EnhancedMediaService {
  private readonly trendingWeights: TrendingWeights = {
    views: 0.3,
    likes: 0.25,
    shares: 0.2,
    comments: 0.15,
    recency: 0.1,
  };

  /**
   * Get trending media based on engagement and recency
   */
  async getTrendingMedia(
    contentType?: string,
    limit: number = 20,
    days: number = 7
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const pipeline = [
        {
          $match: {
            createdAt: { $gte: cutoffDate },
            ...(contentType && { contentType }),
          },
        },
        {
          $addFields: {
            trendingScore: {
              $add: [
                { $multiply: ["$totalViews", this.trendingWeights.views] },
                { $multiply: ["$totalLikes", this.trendingWeights.likes] },
                { $multiply: ["$totalShares", this.trendingWeights.shares] },
                { $multiply: ["$viewCount", 0.1] }, // Fallback to viewCount
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: [new Date(), "$createdAt"] },
                        1000 * 60 * 60 * 24, // Convert to days
                      ],
                    },
                    this.trendingWeights.recency,
                  ],
                },
              ],
            },
          },
        },
        {
          $sort: { trendingScore: -1 },
        },
        {
          $limit: limit,
        },
        {
          $lookup: {
            from: "users",
            localField: "uploadedBy",
            foreignField: "_id",
            as: "creator",
          },
        },
        {
          $unwind: "$creator",
        },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            contentType: 1,
            category: 1,
            thumbnailUrl: 1,
            coverImageUrl: 1,
            totalViews: 1,
            totalLikes: 1,
            totalShares: 1,
            trendingScore: 1,
            createdAt: 1,
            "creator.firstName": 1,
            "creator.lastName": 1,
            "creator.avatar": 1,
          },
        },
      ];

      const trendingMedia = await Media.aggregate(pipeline as any);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "media", duration, {
        operation: "getTrendingMedia",
        contentType,
        limit,
        days,
      });

      return trendingMedia;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting trending media", {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get most viewed media
   */
  async getMostViewedMedia(
    contentType?: string,
    limit: number = 20,
    days?: number
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      const matchStage: any = {};
      if (contentType) matchStage.contentType = contentType;
      if (days) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        matchStage.createdAt = { $gte: cutoffDate };
      }

      const pipeline = [
        { $match: matchStage },
        {
          $sort: { totalViews: -1, viewCount: -1 },
        },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "uploadedBy",
            foreignField: "_id",
            as: "creator",
          },
        },
        { $unwind: "$creator" },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            contentType: 1,
            category: 1,
            thumbnailUrl: 1,
            coverImageUrl: 1,
            totalViews: 1,
            viewCount: 1,
            createdAt: 1,
            "creator.firstName": 1,
            "creator.lastName": 1,
            "creator.avatar": 1,
          },
        },
      ];

      const mostViewed = await Media.aggregate(pipeline as any);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "media", duration, {
        operation: "getMostViewedMedia",
        contentType,
        limit,
        days,
      });

      return mostViewed;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting most viewed media", {
        error: error.message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Advanced media search with filters
   */
  async searchMediaWithFilters(
    filters: MediaFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    media: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const skip = (page - 1) * limit;
      const matchStage: any = {};

      // Apply filters
      if (filters.contentType) matchStage.contentType = filters.contentType;
      if (filters.category) matchStage.category = filters.category;
      if (filters.topics && filters.topics.length > 0) {
        matchStage.topics = { $in: filters.topics };
      }
      if (filters.uploadedBy) {
        matchStage.uploadedBy = new Types.ObjectId(filters.uploadedBy);
      }
      if (filters.isAvailable !== undefined) {
        matchStage.isAvailable = filters.isAvailable;
      }
      if (filters.dateRange) {
        matchStage.createdAt = {
          $gte: filters.dateRange.start,
          $lte: filters.dateRange.end,
        };
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

      // Duration filter
      if (filters.duration) {
        const durationRanges = {
          short: { $lte: 300 }, // 5 minutes
          medium: { $gt: 300, $lte: 1800 }, // 5-30 minutes
          long: { $gt: 1800 }, // 30+ minutes
        };
        matchStage.duration =
          durationRanges[filters.duration as keyof typeof durationRanges];
      }

      // Sort options
      let sortStage: any = { createdAt: -1 }; // Default sort
      switch (filters.sortBy) {
        case "trending":
          sortStage = { totalViews: -1, totalLikes: -1, totalShares: -1 };
          break;
        case "most_viewed":
          sortStage = { totalViews: -1, viewCount: -1 };
          break;
        case "most_liked":
          sortStage = { totalLikes: -1, favoriteCount: -1 };
          break;
        case "most_shared":
          sortStage = { totalShares: -1, shareCount: -1 };
          break;
        case "newest":
          sortStage = { createdAt: -1 };
          break;
        case "oldest":
          sortStage = { createdAt: 1 };
          break;
      }

      const pipeline = [
        { $match: matchStage },
        { $sort: sortStage },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: "users",
            localField: "uploadedBy",
            foreignField: "_id",
            as: "creator",
          },
        },
        { $unwind: "$creator" },
        {
          $project: {
            _id: 1,
            title: 1,
            description: 1,
            contentType: 1,
            category: 1,
            thumbnailUrl: 1,
            coverImageUrl: 1,
            totalViews: 1,
            totalLikes: 1,
            totalShares: 1,
            price: 1,
            currency: 1,
            isAvailable: 1,
            createdAt: 1,
            "creator.firstName": 1,
            "creator.lastName": 1,
            "creator.avatar": 1,
          },
        },
      ];

      const [media, total] = await Promise.all([
        Media.aggregate(pipeline),
        Media.countDocuments(matchStage),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "media", duration, {
        operation: "searchMediaWithFilters",
        filters: Object.keys(filters),
        page,
        limit,
        total,
      });

      return {
        media,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error searching media with filters", {
        error: error.message,
        duration: `${duration}ms`,
        filters,
      });
      throw error;
    }
  }

  /**
   * Add media to user's library
   */
  async addToLibrary(
    userId: string,
    mediaId: string,
    mediaType: "media" | "merchandise" = "media",
    notes?: string,
    rating?: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Check if already in library
      const existing = await Library.findOne({
        userId: new Types.ObjectId(userId),
        mediaId: new Types.ObjectId(mediaId),
        mediaType,
      });

      if (existing) {
        throw new Error("Media already in library");
      }

      // Add to library
      await Library.create({
        userId: new Types.ObjectId(userId),
        mediaId: new Types.ObjectId(mediaId),
        mediaType,
        notes,
        rating,
        addedAt: new Date(),
      });

      // Update media record
      if (mediaType === "media") {
        await Media.findByIdAndUpdate(mediaId, {
          isInLibrary: true,
          libraryAddedAt: new Date(),
        });
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("create", "library", duration, {
        userId,
        mediaId,
        mediaType,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error adding to library", {
        error: error.message,
        userId,
        mediaId,
        mediaType,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Remove media from user's library
   */
  async removeFromLibrary(
    userId: string,
    mediaId: string,
    mediaType: "media" | "merchandise" = "media"
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await Library.findOneAndDelete({
        userId: new Types.ObjectId(userId),
        mediaId: new Types.ObjectId(mediaId),
        mediaType,
      });

      // Update media record
      if (mediaType === "media") {
        await Media.findByIdAndUpdate(mediaId, {
          isInLibrary: false,
          $unset: { libraryAddedAt: 1 },
        });
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("delete", "library", duration, {
        userId,
        mediaId,
        mediaType,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error removing from library", {
        error: error.message,
        userId,
        mediaId,
        mediaType,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get user's library
   */
  async getUserLibrary(
    userId: string,
    mediaType?: "media" | "merchandise",
    page: number = 1,
    limit: number = 20
  ): Promise<{
    items: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const skip = (page - 1) * limit;
      const matchStage: any = { userId: new Types.ObjectId(userId) };

      if (mediaType) {
        matchStage.mediaType = mediaType;
      }

      const pipeline = [
        { $match: matchStage },
        { $sort: { addedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: mediaType === "merchandise" ? "merchandise" : "media",
            localField: "mediaId",
            foreignField: "_id",
            as: "item",
          },
        },
        { $unwind: "$item" },
        {
          $project: {
            _id: 1,
            addedAt: 1,
            notes: 1,
            rating: 1,
            isFavorite: 1,
            watchProgress: 1,
            completionPercentage: 1,
            "item._id": 1,
            "item.title": 1,
            "item.description": 1,
            "item.contentType": 1,
            "item.category": 1,
            "item.thumbnailUrl": 1,
            "item.coverImageUrl": 1,
            "item.totalViews": 1,
            "item.price": 1,
            "item.currency": 1,
            "item.isAvailable": 1,
          },
        },
      ];

      const [items, total] = await Promise.all([
        Library.aggregate(pipeline as any),
        Library.countDocuments(matchStage),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "library", duration, {
        operation: "getUserLibrary",
        userId,
        mediaType,
        page,
        limit,
        total,
      });

      return {
        items,
        total,
        page,
        totalPages,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting user library", {
        error: error.message,
        userId,
        mediaType,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Update watch progress
   */
  async updateWatchProgress(
    userId: string,
    mediaId: string,
    progress: number,
    completionPercentage: number
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await Library.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          mediaId: new Types.ObjectId(mediaId),
          mediaType: "media",
        },
        {
          watchProgress: progress,
          completionPercentage,
          lastWatched: new Date(),
        }
      );

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "library", duration, {
        userId,
        mediaId,
        progress,
        completionPercentage,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error updating watch progress", {
        error: error.message,
        userId,
        mediaId,
        progress,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get currently watching (in progress media)
   */
  async getCurrentlyWatching(
    userId: string,
    limit: number = 10
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      const pipeline = [
        {
          $match: {
            userId: new Types.ObjectId(userId),
            mediaType: "media",
            watchProgress: { $gt: 0 },
            completionPercentage: { $lt: 100 },
          },
        },
        { $sort: { lastWatched: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "media",
            localField: "mediaId",
            foreignField: "_id",
            as: "media",
          },
        },
        { $unwind: "$media" },
        {
          $project: {
            _id: 1,
            watchProgress: 1,
            completionPercentage: 1,
            lastWatched: 1,
            "media._id": 1,
            "media.title": 1,
            "media.description": 1,
            "media.contentType": 1,
            "media.thumbnailUrl": 1,
            "media.duration": 1,
            "media.totalViews": 1,
          },
        },
      ];

      const currentlyWatching = await Library.aggregate(pipeline as any);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "library", duration, {
        operation: "getCurrentlyWatching",
        userId,
        limit,
      });

      return currentlyWatching;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting currently watching", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

export default new EnhancedMediaService();
