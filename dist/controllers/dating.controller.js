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
exports.deactivateProfile = exports.getUnreadMessageCount = exports.markMessagesAsRead = exports.getMatchMessages = exports.sendMessage = exports.getUserMatches = exports.respondToMatch = exports.likeProfile = exports.getPotentialMatches = exports.getProfile = exports.createOrUpdateProfile = void 0;
const dating_service_1 = __importDefault(require("../service/dating.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Create or update dating profile
 */
const createOrUpdateProfile = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { lookingFor, ageRange, location, bio, interests = [], photos = [], mainPhoto, height, education, occupation, faithLevel, denomination, preferences, } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!lookingFor ||
            !ageRange ||
            !location ||
            !bio ||
            !photos ||
            !mainPhoto ||
            !faithLevel ||
            !preferences) {
            response.status(400).json({
                success: false,
                message: "Missing required fields: lookingFor, ageRange, location, bio, photos, mainPhoto, faithLevel, preferences",
            });
            return;
        }
        const profile = yield dating_service_1.default.createOrUpdateProfile(userIdentifier, {
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
    }
    catch (error) {
        logger_1.default.error("Error creating/updating dating profile", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to update dating profile",
        });
    }
});
exports.createOrUpdateProfile = createOrUpdateProfile;
/**
 * Get dating profile
 */
const getProfile = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const profile = yield dating_service_1.default.getProfile(userIdentifier);
        response.status(200).json({
            success: true,
            data: profile,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting dating profile", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to get dating profile",
        });
    }
});
exports.getProfile = getProfile;
/**
 * Get potential matches
 */
const getPotentialMatches = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { ageRange, faithLevel, denomination, maxDistance, interests, page = 1, limit = 20, } = request.query;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const filters = {};
        if (ageRange) {
            try {
                const ageRangeObj = JSON.parse(ageRange);
                filters.ageRange = {
                    min: parseInt(ageRangeObj.min),
                    max: parseInt(ageRangeObj.max),
                };
            }
            catch (error) {
                // Ignore invalid age range
            }
        }
        if (faithLevel)
            filters.faithLevel = faithLevel;
        if (denomination)
            filters.denomination = denomination;
        if (maxDistance)
            filters.maxDistance = parseInt(maxDistance);
        if (interests)
            filters.interests = Array.isArray(interests) ? interests : [interests];
        const result = yield dating_service_1.default.getPotentialMatches(userIdentifier, filters, parseInt(page), parseInt(limit));
        response.status(200).json({
            success: true,
            data: result.profiles,
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
        logger_1.default.error("Error getting potential matches", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get potential matches",
        });
    }
});
exports.getPotentialMatches = getPotentialMatches;
/**
 * Like a profile
 */
const likeProfile = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const match = yield dating_service_1.default.likeProfile(userIdentifier, likedUserId);
        response.status(200).json({
            success: true,
            message: "Profile liked successfully",
            data: match,
        });
    }
    catch (error) {
        logger_1.default.error("Error liking profile", {
            error: error.message,
            userId: request.userId,
            likedUserId: request.params.userId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to like profile",
        });
    }
});
exports.likeProfile = likeProfile;
/**
 * Respond to match (accept/reject)
 */
const respondToMatch = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const match = yield dating_service_1.default.respondToMatch(userIdentifier, matchId, matchResponse);
        response.status(200).json({
            success: true,
            message: `Match ${matchResponse} successfully`,
            data: match,
        });
    }
    catch (error) {
        logger_1.default.error("Error responding to match", {
            error: error.message,
            userId: request.userId,
            matchId: request.params.matchId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to respond to match",
        });
    }
});
exports.respondToMatch = respondToMatch;
/**
 * Get user's matches
 */
const getUserMatches = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const matches = yield dating_service_1.default.getUserMatches(userIdentifier, status);
        response.status(200).json({
            success: true,
            data: matches,
            filters: {
                status,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting user matches", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get user matches",
        });
    }
});
exports.getUserMatches = getUserMatches;
/**
 * Send message
 */
const sendMessage = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { matchId, content, messageType = "text", attachments = [], } = request.body;
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
        const message = yield dating_service_1.default.sendMessage(userIdentifier, matchId, content, messageType, Array.isArray(attachments) ? attachments : [attachments]);
        response.status(200).json({
            success: true,
            message: "Message sent successfully",
            data: message,
        });
    }
    catch (error) {
        logger_1.default.error("Error sending message", {
            error: error.message,
            userId: request.userId,
            matchId: request.body.matchId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to send message",
        });
    }
});
exports.sendMessage = sendMessage;
/**
 * Get match messages
 */
const getMatchMessages = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const result = yield dating_service_1.default.getMatchMessages(userIdentifier, matchId, parseInt(page), parseInt(limit));
        response.status(200).json({
            success: true,
            data: result.messages,
            pagination: {
                page: result.page,
                limit: parseInt(limit),
                total: result.total,
                totalPages: result.totalPages,
            },
            matchId,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting match messages", {
            error: error.message,
            userId: request.userId,
            matchId: request.params.matchId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to get match messages",
        });
    }
});
exports.getMatchMessages = getMatchMessages;
/**
 * Mark messages as read
 */
const markMessagesAsRead = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield dating_service_1.default.markMessagesAsRead(userIdentifier, matchId);
        response.status(200).json({
            success: true,
            message: "Messages marked as read",
        });
    }
    catch (error) {
        logger_1.default.error("Error marking messages as read", {
            error: error.message,
            userId: request.userId,
            matchId: request.params.matchId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to mark messages as read",
        });
    }
});
exports.markMessagesAsRead = markMessagesAsRead;
/**
 * Get unread message count
 */
const getUnreadMessageCount = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const count = yield dating_service_1.default.getUnreadMessageCount(userIdentifier);
        response.status(200).json({
            success: true,
            data: { unreadCount: count },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting unread message count", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get unread message count",
        });
    }
});
exports.getUnreadMessageCount = getUnreadMessageCount;
/**
 * Deactivate dating profile
 */
const deactivateProfile = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        yield dating_service_1.default.deactivateProfile(userIdentifier);
        response.status(200).json({
            success: true,
            message: "Dating profile deactivated successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error deactivating dating profile", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to deactivate dating profile",
        });
    }
});
exports.deactivateProfile = deactivateProfile;
