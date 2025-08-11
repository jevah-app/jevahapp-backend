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
const dating_model_1 = require("../models/dating.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
class DatingService {
    /**
     * Create or update dating profile
     */
    createOrUpdateProfile(userId, profileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const profile = yield dating_model_1.DatingProfile.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, Object.assign(Object.assign({}, profileData), { userId: new mongoose_1.Types.ObjectId(userId), lastActive: new Date() }), { new: true, upsert: true, runValidators: true });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "datingProfile", duration, {
                    userId,
                    operation: "createOrUpdateProfile",
                });
                return profile;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error creating/updating dating profile", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get dating profile
     */
    getProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const profile = yield dating_model_1.DatingProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(userId),
                }).populate("userId", "firstName lastName email avatar age gender");
                if (!profile) {
                    throw new Error("Dating profile not found");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "datingProfile", duration, {
                    userId,
                });
                return profile;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting dating profile", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get potential matches
     */
    getPotentialMatches(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, filters = {}, page = 1, limit = 20) {
            const startTime = Date.now();
            try {
                const user = yield user_model_1.User.findById(userId);
                if (!user) {
                    throw new Error("User not found");
                }
                const userProfile = yield dating_model_1.DatingProfile.findOne({
                    userId: new mongoose_1.Types.ObjectId(userId),
                });
                if (!userProfile) {
                    throw new Error("Dating profile not found");
                }
                const skip = (page - 1) * limit;
                const matchStage = {
                    userId: { $ne: new mongoose_1.Types.ObjectId(userId) },
                    isActive: true,
                    lookingFor: user.gender === "male"
                        ? "men"
                        : user.gender === "female"
                            ? "women"
                            : "both",
                };
                // Apply filters
                if (filters.ageRange) {
                    matchStage["ageRange.min"] = { $lte: filters.ageRange.max };
                    matchStage["ageRange.max"] = { $gte: filters.ageRange.min };
                }
                if (filters.faithLevel) {
                    matchStage.faithLevel = filters.faithLevel;
                }
                if (filters.denomination) {
                    matchStage.denomination = filters.denomination;
                }
                if (filters.interests && filters.interests.length > 0) {
                    matchStage.interests = { $in: filters.interests };
                }
                // Distance filter (if coordinates are available)
                if (userProfile.location.coordinates && filters.maxDistance) {
                    matchStage.location = {
                        $near: {
                            $geometry: {
                                type: "Point",
                                coordinates: userProfile.location.coordinates,
                            },
                            $maxDistance: filters.maxDistance * 1000, // Convert km to meters
                        },
                    };
                }
                const pipeline = [
                    { $match: matchStage },
                    { $sort: { lastActive: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "userId",
                            foreignField: "_id",
                            as: "user",
                        },
                    },
                    { $unwind: "$user" },
                    {
                        $project: {
                            _id: 1,
                            bio: 1,
                            interests: 1,
                            photos: 1,
                            mainPhoto: 1,
                            height: 1,
                            education: 1,
                            occupation: 1,
                            faithLevel: 1,
                            denomination: 1,
                            lastActive: 1,
                            "user.firstName": 1,
                            "user.lastName": 1,
                            "user.avatar": 1,
                            "user.age": 1,
                            "user.gender": 1,
                        },
                    },
                ];
                const [profiles, total] = yield Promise.all([
                    dating_model_1.DatingProfile.aggregate(pipeline),
                    dating_model_1.DatingProfile.countDocuments(matchStage),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "datingProfile", duration, {
                    operation: "getPotentialMatches",
                    userId,
                    page,
                    limit,
                    total,
                });
                return {
                    profiles,
                    total,
                    page,
                    totalPages,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting potential matches", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Like a profile (create match)
     */
    likeProfile(userId, likedUserId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                // Check if match already exists
                const existingMatch = yield dating_model_1.Match.findOne({
                    $or: [
                        {
                            user1: new mongoose_1.Types.ObjectId(userId),
                            user2: new mongoose_1.Types.ObjectId(likedUserId),
                        },
                        {
                            user1: new mongoose_1.Types.ObjectId(likedUserId),
                            user2: new mongoose_1.Types.ObjectId(userId),
                        },
                    ],
                });
                if (existingMatch) {
                    throw new Error("Match already exists");
                }
                // Create new match
                const match = yield dating_model_1.Match.create({
                    user1: new mongoose_1.Types.ObjectId(userId),
                    user2: new mongoose_1.Types.ObjectId(likedUserId),
                    status: "pending",
                    matchedAt: new Date(),
                    isActive: true,
                });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("create", "match", duration, {
                    userId,
                    likedUserId,
                });
                return match;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error liking profile", {
                    error: error.message,
                    userId,
                    likedUserId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Accept or reject a match
     */
    respondToMatch(userId, matchId, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const match = yield dating_model_1.Match.findOneAndUpdate({
                    _id: matchId,
                    user2: new mongoose_1.Types.ObjectId(userId),
                    status: "pending",
                }, Object.assign({ status: response }, (response === "accepted" && { lastMessageAt: new Date() })), { new: true });
                if (!match) {
                    throw new Error("Match not found or already responded");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "match", duration, {
                    userId,
                    matchId,
                    response,
                });
                return match;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error responding to match", {
                    error: error.message,
                    userId,
                    matchId,
                    response,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get user's matches
     */
    getUserMatches(userId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const matchStage = {
                    $or: [
                        { user1: new mongoose_1.Types.ObjectId(userId) },
                        { user2: new mongoose_1.Types.ObjectId(userId) },
                    ],
                    isActive: true,
                };
                if (status) {
                    matchStage.status = status;
                }
                const pipeline = [
                    { $match: matchStage },
                    { $sort: { lastMessageAt: -1, matchedAt: -1 } },
                    {
                        $lookup: {
                            from: "users",
                            let: { user1: "$user1", user2: "$user2" },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: {
                                            $and: [
                                                { $in: ["$_id", "$$user1", "$$user2"] },
                                                { $ne: ["$_id", new mongoose_1.Types.ObjectId(userId)] },
                                            ],
                                        },
                                    },
                                },
                            ],
                            as: "otherUser",
                        },
                    },
                    { $unwind: "$otherUser" },
                    {
                        $project: {
                            _id: 1,
                            status: 1,
                            matchedAt: 1,
                            lastMessageAt: 1,
                            "otherUser._id": 1,
                            "otherUser.firstName": 1,
                            "otherUser.lastName": 1,
                            "otherUser.avatar": 1,
                            "otherUser.age": 1,
                            "otherUser.gender": 1,
                        },
                    },
                ];
                const matches = yield dating_model_1.Match.aggregate(pipeline);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "match", duration, {
                    operation: "getUserMatches",
                    userId,
                    status,
                });
                return matches;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting user matches", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Send message in a match
     */
    sendMessage(senderId_1, matchId_1, content_1) {
        return __awaiter(this, arguments, void 0, function* (senderId, matchId, content, messageType = "text", attachments) {
            const startTime = Date.now();
            try {
                const match = yield dating_model_1.Match.findById(matchId);
                if (!match) {
                    throw new Error("Match not found");
                }
                // Verify sender is part of the match
                if (match.user1.toString() !== senderId &&
                    match.user2.toString() !== senderId) {
                    throw new Error("Unauthorized to send message in this match");
                }
                // Determine receiver
                const receiverId = match.user1.toString() === senderId ? match.user2 : match.user1;
                const message = yield dating_model_1.DatingMessage.create({
                    matchId: new mongoose_1.Types.ObjectId(matchId),
                    sender: new mongoose_1.Types.ObjectId(senderId),
                    receiver: new mongoose_1.Types.ObjectId(receiverId),
                    content,
                    messageType,
                    attachments: attachments || [],
                    isRead: false,
                });
                // Update match's last message time
                yield dating_model_1.Match.findByIdAndUpdate(matchId, {
                    lastMessageAt: new Date(),
                });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("create", "datingMessage", duration, {
                    senderId,
                    matchId,
                    messageType,
                });
                return message;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error sending message", {
                    error: error.message,
                    senderId,
                    matchId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get messages in a match
     */
    getMatchMessages(userId_1, matchId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, matchId, page = 1, limit = 50) {
            const startTime = Date.now();
            try {
                const match = yield dating_model_1.Match.findById(matchId);
                if (!match) {
                    throw new Error("Match not found");
                }
                // Verify user is part of the match
                if (match.user1.toString() !== userId &&
                    match.user2.toString() !== userId) {
                    throw new Error("Unauthorized to access this match");
                }
                const skip = (page - 1) * limit;
                const pipeline = [
                    { $match: { matchId: new mongoose_1.Types.ObjectId(matchId) } },
                    { $sort: { createdAt: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "sender",
                            foreignField: "_id",
                            as: "sender",
                        },
                    },
                    { $unwind: "$sender" },
                    {
                        $project: {
                            _id: 1,
                            content: 1,
                            messageType: 1,
                            attachments: 1,
                            isRead: 1,
                            createdAt: 1,
                            "sender.firstName": 1,
                            "sender.lastName": 1,
                            "sender.avatar": 1,
                        },
                    },
                ];
                const [messages, total] = yield Promise.all([
                    dating_model_1.DatingMessage.aggregate(pipeline),
                    dating_model_1.DatingMessage.countDocuments({ matchId: new mongoose_1.Types.ObjectId(matchId) }),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "datingMessage", duration, {
                    operation: "getMatchMessages",
                    userId,
                    matchId,
                    page,
                    limit,
                    total,
                });
                return {
                    messages: messages.reverse(), // Show oldest first
                    total,
                    page,
                    totalPages,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting match messages", {
                    error: error.message,
                    userId,
                    matchId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Mark messages as read
     */
    markMessagesAsRead(userId, matchId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                yield dating_model_1.DatingMessage.updateMany({
                    matchId: new mongoose_1.Types.ObjectId(matchId),
                    receiver: new mongoose_1.Types.ObjectId(userId),
                    isRead: false,
                }, {
                    isRead: true,
                    readAt: new Date(),
                });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "datingMessage", duration, {
                    userId,
                    matchId,
                    operation: "markMessagesAsRead",
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error marking messages as read", {
                    error: error.message,
                    userId,
                    matchId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get unread message count
     */
    getUnreadMessageCount(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const count = yield dating_model_1.DatingMessage.countDocuments({
                    receiver: new mongoose_1.Types.ObjectId(userId),
                    isRead: false,
                });
                return count;
            }
            catch (error) {
                logger_1.default.error("Error getting unread message count", {
                    error: error.message,
                    userId,
                });
                throw error;
            }
        });
    }
    /**
     * Deactivate dating profile
     */
    deactivateProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                yield dating_model_1.DatingProfile.findOneAndUpdate({ userId: new mongoose_1.Types.ObjectId(userId) }, { isActive: false });
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "datingProfile", duration, {
                    userId,
                    operation: "deactivateProfile",
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error deactivating profile", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
}
exports.default = new DatingService();
