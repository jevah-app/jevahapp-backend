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
const media_model_1 = require("../models/media.model");
const library_model_1 = require("../models/library.model");
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
class EnhancedMediaService {
    constructor() {
        this.trendingWeights = {
            views: 0.3,
            likes: 0.25,
            shares: 0.2,
            comments: 0.15,
            recency: 0.1,
        };
    }
    /**
     * Get trending media based on engagement and recency
     */
    getTrendingMedia(contentType_1) {
        return __awaiter(this, arguments, void 0, function* (contentType, limit = 20, days = 7) {
            const startTime = Date.now();
            try {
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                const pipeline = [
                    {
                        $match: Object.assign({ createdAt: { $gte: cutoffDate } }, (contentType && { contentType })),
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
                const trendingMedia = yield media_model_1.Media.aggregate(pipeline);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "media", duration, {
                    operation: "getTrendingMedia",
                    contentType,
                    limit,
                    days,
                });
                return trendingMedia;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting trending media", {
                    error: error.message,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get most viewed media
     */
    getMostViewedMedia(contentType_1) {
        return __awaiter(this, arguments, void 0, function* (contentType, limit = 20, days) {
            const startTime = Date.now();
            try {
                const matchStage = {};
                if (contentType)
                    matchStage.contentType = contentType;
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
                const mostViewed = yield media_model_1.Media.aggregate(pipeline);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "media", duration, {
                    operation: "getMostViewedMedia",
                    contentType,
                    limit,
                    days,
                });
                return mostViewed;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting most viewed media", {
                    error: error.message,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Advanced media search with filters
     */
    searchMediaWithFilters(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, page = 1, limit = 20) {
            const startTime = Date.now();
            try {
                const skip = (page - 1) * limit;
                const matchStage = {};
                // Apply filters
                if (filters.contentType)
                    matchStage.contentType = filters.contentType;
                if (filters.category)
                    matchStage.category = filters.category;
                if (filters.topics && filters.topics.length > 0) {
                    matchStage.topics = { $in: filters.topics };
                }
                if (filters.uploadedBy) {
                    matchStage.uploadedBy = new mongoose_1.Types.ObjectId(filters.uploadedBy);
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
                        durationRanges[filters.duration];
                }
                // Sort options
                let sortStage = { createdAt: -1 }; // Default sort
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
                const [media, total] = yield Promise.all([
                    media_model_1.Media.aggregate(pipeline),
                    media_model_1.Media.countDocuments(matchStage),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "media", duration, {
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
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error searching media with filters", {
                    error: error.message,
                    duration: `${duration}ms`,
                    filters,
                });
                throw error;
            }
        });
    }
    /**
     * Add media to user's library
     */
    addToLibrary(userId_1, mediaId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, mediaId, mediaType = "media", notes, rating) {
            const startTime = Date.now();
            try {
                // Check if already in library
                const existing = yield library_model_1.Library.findOne({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    mediaId: new mongoose_1.Types.ObjectId(mediaId),
                    mediaType,
                });
                if (existing) {
                    throw new Error("Media already in library");
                }
                // Add to library
                yield library_model_1.Library.create({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    mediaId: new mongoose_1.Types.ObjectId(mediaId),
                    mediaType,
                    notes,
                    rating,
                    addedAt: new Date(),
                });
                // Update media record
                if (mediaType === "media") {
                    yield media_model_1.Media.findByIdAndUpdate(mediaId, {
                        isInLibrary: true,
                        libraryAddedAt: new Date(),
                    });
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("create", "library", duration, {
                    userId,
                    mediaId,
                    mediaType,
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error adding to library", {
                    error: error.message,
                    userId,
                    mediaId,
                    mediaType,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Remove media from user's library
     */
    removeFromLibrary(userId_1, mediaId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, mediaId, mediaType = "media") {
            const startTime = Date.now();
            try {
                yield library_model_1.Library.findOneAndDelete({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    mediaId: new mongoose_1.Types.ObjectId(mediaId),
                    mediaType,
                });
                // Update media record
                if (mediaType === "media") {
                    yield media_model_1.Media.findByIdAndUpdate(mediaId, {
                        isInLibrary: false,
                        $unset: { libraryAddedAt: 1 },
                    });
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("delete", "library", duration, {
                    userId,
                    mediaId,
                    mediaType,
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error removing from library", {
                    error: error.message,
                    userId,
                    mediaId,
                    mediaType,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get user's library
     */
    getUserLibrary(userId_1, mediaType_1) {
        return __awaiter(this, arguments, void 0, function* (userId, mediaType, page = 1, limit = 20) {
            const startTime = Date.now();
            try {
                const skip = (page - 1) * limit;
                const matchStage = { userId: new mongoose_1.Types.ObjectId(userId) };
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
                const [items, total] = yield Promise.all([
                    library_model_1.Library.aggregate(pipeline),
                    library_model_1.Library.countDocuments(matchStage),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "library", duration, {
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
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting user library", {
                    error: error.message,
                    userId,
                    mediaType,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Update watch progress
     */
    updateWatchProgress(userId, mediaId, progress, completionPercentage) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                yield library_model_1.Library.findOneAndUpdate({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    mediaId: new mongoose_1.Types.ObjectId(mediaId),
                    mediaType: "media",
                }, {
                    watchProgress: progress,
                    completionPercentage,
                    lastWatched: new Date(),
                });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "library", duration, {
                    userId,
                    mediaId,
                    progress,
                    completionPercentage,
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error updating watch progress", {
                    error: error.message,
                    userId,
                    mediaId,
                    progress,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get currently watching (in progress media)
     */
    getCurrentlyWatching(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, limit = 10) {
            const startTime = Date.now();
            try {
                const pipeline = [
                    {
                        $match: {
                            userId: new mongoose_1.Types.ObjectId(userId),
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
                const currentlyWatching = yield library_model_1.Library.aggregate(pipeline);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "library", duration, {
                    operation: "getCurrentlyWatching",
                    userId,
                    limit,
                });
                return currentlyWatching;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting currently watching", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
}
exports.default = new EnhancedMediaService();
