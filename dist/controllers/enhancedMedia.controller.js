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
exports.getCurrentlyWatching = exports.updateWatchProgress = exports.getUserLibrary = exports.removeFromLibrary = exports.addToLibrary = exports.searchMediaWithFilters = exports.getMostViewedMedia = exports.getTrendingMedia = void 0;
const enhancedMedia_service_1 = __importDefault(require("../service/enhancedMedia.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Get trending media
 */
const getTrendingMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const trendingMedia = yield enhancedMedia_service_1.default.getTrendingMedia(contentType, parseInt(limit), parseInt(days));
        response.status(200).json({
            success: true,
            data: trendingMedia,
            filters: {
                contentType,
                limit: parseInt(limit),
                days: parseInt(days),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting trending media", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get trending media",
        });
    }
});
exports.getTrendingMedia = getTrendingMedia;
/**
 * Get most viewed media
 */
const getMostViewedMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const mostViewed = yield enhancedMedia_service_1.default.getMostViewedMedia(contentType, parseInt(limit), days ? parseInt(days) : undefined);
        response.status(200).json({
            success: true,
            data: mostViewed,
            filters: {
                contentType,
                limit: parseInt(limit),
                days: days ? parseInt(days) : undefined,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting most viewed media", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get most viewed media",
        });
    }
});
exports.getMostViewedMedia = getMostViewedMedia;
/**
 * Advanced media search with filters
 */
const searchMediaWithFilters = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentType, category, topics, search, sortBy = "newest", dateRange, duration, priceRange, isAvailable, uploadedBy, page = 1, limit = 20, } = request.query;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const filters = {};
        if (contentType)
            filters.contentType = contentType;
        if (category)
            filters.category = category;
        if (topics)
            filters.topics = Array.isArray(topics) ? topics : [topics];
        if (search)
            filters.search = search;
        if (sortBy)
            filters.sortBy = sortBy;
        if (isAvailable !== undefined)
            filters.isAvailable = isAvailable === "true";
        if (uploadedBy)
            filters.uploadedBy = uploadedBy;
        if (dateRange) {
            try {
                const dateRangeObj = JSON.parse(dateRange);
                filters.dateRange = {
                    start: new Date(dateRangeObj.start),
                    end: new Date(dateRangeObj.end),
                };
            }
            catch (error) {
                // Ignore invalid date range
            }
        }
        if (duration)
            filters.duration = duration;
        if (priceRange) {
            try {
                const priceRangeObj = JSON.parse(priceRange);
                filters.priceRange = {
                    min: parseFloat(priceRangeObj.min),
                    max: parseFloat(priceRangeObj.max),
                };
            }
            catch (error) {
                // Ignore invalid price range
            }
        }
        const result = yield enhancedMedia_service_1.default.searchMediaWithFilters(filters, parseInt(page), parseInt(limit));
        response.status(200).json({
            success: true,
            data: result.media,
            pagination: {
                page: result.page,
                limit: parseInt(limit),
                total: result.total,
                totalPages: result.totalPages,
            },
            filters,
        });
    }
    catch (error) {
        logger_1.default.error("Error searching media with filters", {
            error: error.message,
            userId: request.userId,
            query: request.query,
        });
        response.status(500).json({
            success: false,
            message: "Failed to search media",
        });
    }
});
exports.searchMediaWithFilters = searchMediaWithFilters;
/**
 * Add media to library
 */
const addToLibrary = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield enhancedMedia_service_1.default.addToLibrary(userIdentifier, mediaId, mediaType, notes, rating ? parseInt(rating) : undefined);
        response.status(200).json({
            success: true,
            message: "Media added to library successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error adding to library", {
            error: error.message,
            userId: request.userId,
            mediaId: request.body.mediaId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to add to library",
        });
    }
});
exports.addToLibrary = addToLibrary;
/**
 * Remove media from library
 */
const removeFromLibrary = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield enhancedMedia_service_1.default.removeFromLibrary(userIdentifier, mediaId, mediaType);
        response.status(200).json({
            success: true,
            message: "Media removed from library successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error removing from library", {
            error: error.message,
            userId: request.userId,
            mediaId: request.params.mediaId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to remove from library",
        });
    }
});
exports.removeFromLibrary = removeFromLibrary;
/**
 * Get user's library
 */
const getUserLibrary = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield enhancedMedia_service_1.default.getUserLibrary(userIdentifier, mediaType, parseInt(page), parseInt(limit));
        response.status(200).json({
            success: true,
            data: result.items,
            pagination: {
                page: result.page,
                limit: parseInt(limit),
                total: result.total,
                totalPages: result.totalPages,
            },
            filters: {
                mediaType,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user library", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get user library",
        });
    }
});
exports.getUserLibrary = getUserLibrary;
/**
 * Update watch progress
 */
const updateWatchProgress = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mediaId ||
            progress === undefined ||
            completionPercentage === undefined) {
            response.status(400).json({
                success: false,
                message: "Media ID, progress, and completion percentage are required",
            });
            return;
        }
        yield enhancedMedia_service_1.default.updateWatchProgress(userIdentifier, mediaId, parseInt(progress), parseInt(completionPercentage));
        response.status(200).json({
            success: true,
            message: "Watch progress updated successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error updating watch progress", {
            error: error.message,
            userId: request.userId,
            mediaId: request.body.mediaId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to update watch progress",
        });
    }
});
exports.updateWatchProgress = updateWatchProgress;
/**
 * Get currently watching
 */
const getCurrentlyWatching = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const currentlyWatching = yield enhancedMedia_service_1.default.getCurrentlyWatching(userIdentifier, parseInt(limit));
        response.status(200).json({
            success: true,
            data: currentlyWatching,
            filters: {
                limit: parseInt(limit),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting currently watching", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get currently watching",
        });
    }
});
exports.getCurrentlyWatching = getCurrentlyWatching;
