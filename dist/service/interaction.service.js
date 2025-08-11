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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionService = void 0;
const mongoose_1 = require("mongoose");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const media_model_1 = require("../models/media.model");
const message_model_1 = require("../models/message.model");
const conversation_model_1 = require("../models/conversation.model");
class InteractionService {
    /**
     * Toggle like on media
     */
    toggleLike(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaId)) {
                throw new Error("Invalid user or media ID");
            }
            const media = yield media_model_1.Media.findById(data.mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                let liked = false;
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const existingLike = yield mediaInteraction_model_1.MediaInteraction.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userId),
                        media: new mongoose_1.Types.ObjectId(data.mediaId),
                        interactionType: "like",
                        isRemoved: { $ne: true },
                    }).session(session);
                    if (existingLike) {
                        // Unlike: Soft delete the like
                        yield mediaInteraction_model_1.MediaInteraction.findByIdAndUpdate(existingLike._id, { isRemoved: true }, { session });
                        yield media_model_1.Media.findByIdAndUpdate(data.mediaId, { $inc: { likeCount: -1 } }, { session });
                    }
                    else {
                        // Like: Create new like or restore existing
                        yield mediaInteraction_model_1.MediaInteraction.findOneAndUpdate({
                            user: new mongoose_1.Types.ObjectId(data.userId),
                            media: new mongoose_1.Types.ObjectId(data.mediaId),
                            interactionType: "like",
                        }, { isRemoved: false }, { upsert: true, session });
                        yield media_model_1.Media.findByIdAndUpdate(data.mediaId, { $inc: { likeCount: 1 } }, { session });
                        liked = true;
                    }
                }));
                const updatedMedia = yield media_model_1.Media.findById(data.mediaId);
                return { liked, likeCount: (updatedMedia === null || updatedMedia === void 0 ? void 0 : updatedMedia.likeCount) || 0 };
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Add comment to media
     */
    addComment(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaId)) {
                throw new Error("Invalid user or media ID");
            }
            if (!data.content || data.content.trim().length === 0) {
                throw new Error("Comment content is required");
            }
            const media = yield media_model_1.Media.findById(data.mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                const comment = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const commentData = {
                        user: new mongoose_1.Types.ObjectId(data.userId),
                        media: new mongoose_1.Types.ObjectId(data.mediaId),
                        interactionType: "comment",
                        content: data.content.trim(),
                    };
                    if (data.parentCommentId &&
                        mongoose_1.Types.ObjectId.isValid(data.parentCommentId)) {
                        commentData.parentCommentId = new mongoose_1.Types.ObjectId(data.parentCommentId);
                    }
                    const comment = yield mediaInteraction_model_1.MediaInteraction.create([commentData], {
                        session,
                    });
                    // Update media comment count
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaId, { $inc: { commentCount: 1 } }, { session });
                    return comment[0];
                }));
                // Populate user info for response
                const populatedComment = yield mediaInteraction_model_1.MediaInteraction.findById(comment._id)
                    .populate("user", "firstName lastName avatar")
                    .populate("parentCommentId", "content user");
                return populatedComment;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Remove comment
     */
    removeComment(commentId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(commentId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid comment or user ID");
            }
            const comment = yield mediaInteraction_model_1.MediaInteraction.findById(commentId);
            if (!comment) {
                throw new Error("Comment not found");
            }
            if (comment.user.toString() !== userId) {
                throw new Error("You can only delete your own comments");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    yield mediaInteraction_model_1.MediaInteraction.findByIdAndUpdate(commentId, { isRemoved: true }, { session });
                    yield media_model_1.Media.findByIdAndUpdate(comment.media, { $inc: { commentCount: -1 } }, { session });
                }));
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Add reaction to comment
     */
    addCommentReaction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.commentId)) {
                throw new Error("Invalid user or comment ID");
            }
            const comment = yield mediaInteraction_model_1.MediaInteraction.findById(data.commentId);
            if (!comment || comment.interactionType !== "comment") {
                throw new Error("Comment not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const userId = new mongoose_1.Types.ObjectId(data.userId);
                    const currentReactions = comment.reactions || {};
                    const userReactions = currentReactions[data.reactionType] || [];
                    let newReactions;
                    if (userReactions.includes(userId)) {
                        // Remove reaction
                        newReactions = userReactions.filter((id) => !id.equals(userId));
                    }
                    else {
                        // Add reaction
                        newReactions = [...userReactions, userId];
                    }
                    const updatedComment = yield mediaInteraction_model_1.MediaInteraction.findByIdAndUpdate(data.commentId, { [`reactions.${data.reactionType}`]: newReactions }, { new: true, session });
                    return {
                        reactionType: data.reactionType,
                        count: newReactions.length,
                    };
                }));
                return result;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Share media
     */
    shareMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaId)) {
                throw new Error("Invalid user or media ID");
            }
            const media = yield media_model_1.Media.findById(data.mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    // Record share interaction
                    yield mediaInteraction_model_1.MediaInteraction.findOneAndUpdate({
                        user: new mongoose_1.Types.ObjectId(data.userId),
                        media: new mongoose_1.Types.ObjectId(data.mediaId),
                        interactionType: "share",
                    }, { isRemoved: false }, { upsert: true, session });
                    // Update media share count
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaId, { $inc: { shareCount: 1 } }, { session });
                }));
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Get comments for media
     */
    getComments(mediaId_1) {
        return __awaiter(this, arguments, void 0, function* (mediaId, page = 1, limit = 20) {
            if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
                throw new Error("Invalid media ID");
            }
            const skip = (page - 1) * limit;
            const comments = yield mediaInteraction_model_1.MediaInteraction.find({
                media: new mongoose_1.Types.ObjectId(mediaId),
                interactionType: "comment",
                isRemoved: { $ne: true },
            })
                .populate("user", "firstName lastName avatar")
                .populate("parentCommentId", "content user")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            const total = yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                media: new mongoose_1.Types.ObjectId(mediaId),
                interactionType: "comment",
                isRemoved: { $ne: true },
            });
            return {
                comments,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Send message
     */
    sendMessage(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.senderId) ||
                !mongoose_1.Types.ObjectId.isValid(data.recipientId)) {
                throw new Error("Invalid sender or recipient ID");
            }
            if (!data.content || data.content.trim().length === 0) {
                throw new Error("Message content is required");
            }
            const session = yield message_model_1.Message.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    // Find or create conversation
                    let conversation = yield conversation_model_1.Conversation.findOne({
                        participants: { $all: [data.senderId, data.recipientId] },
                        isGroupChat: false,
                    }).session(session);
                    if (!conversation) {
                        conversation = yield conversation_model_1.Conversation.create([
                            {
                                participants: [data.senderId, data.recipientId],
                                unreadCount: { [data.recipientId]: 0 },
                            },
                        ], { session });
                    }
                    // Create message
                    const messageData = {
                        sender: new mongoose_1.Types.ObjectId(data.senderId),
                        recipient: new mongoose_1.Types.ObjectId(data.recipientId),
                        content: data.content.trim(),
                        messageType: data.messageType || "text",
                    };
                    if (data.mediaUrl) {
                        messageData.mediaUrl = data.mediaUrl;
                    }
                    if (data.replyTo && mongoose_1.Types.ObjectId.isValid(data.replyTo)) {
                        messageData.replyTo = new mongoose_1.Types.ObjectId(data.replyTo);
                    }
                    const message = yield message_model_1.Message.create([messageData], { session });
                    // Update conversation
                    yield conversation_model_1.Conversation.findByIdAndUpdate(conversation._id, {
                        lastMessage: message[0]._id,
                        lastMessageAt: new Date(),
                        $inc: { [`unreadCount.${data.recipientId}`]: 1 },
                    }, { session });
                    return message[0];
                }));
                // Populate sender info
                const populatedMessage = yield message_model_1.Message.findById(result._id)
                    .populate("sender", "firstName lastName avatar")
                    .populate("recipient", "firstName lastName avatar")
                    .populate("replyTo", "content sender");
                return populatedMessage;
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Get conversation messages
     */
    getConversationMessages(conversationId_1, userId_1) {
        return __awaiter(this, arguments, void 0, function* (conversationId, userId, page = 1, limit = 50) {
            if (!mongoose_1.Types.ObjectId.isValid(conversationId) ||
                !mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid conversation or user ID");
            }
            const conversation = yield conversation_model_1.Conversation.findById(conversationId);
            if (!conversation ||
                !conversation.participants.includes(new mongoose_1.Types.ObjectId(userId))) {
                throw new Error("Conversation not found or access denied");
            }
            const skip = (page - 1) * limit;
            const messages = yield message_model_1.Message.find({
                $or: [
                    { sender: userId, recipient: { $in: conversation.participants } },
                    { recipient: userId, sender: { $in: conversation.participants } },
                ],
                isDeleted: false,
            })
                .populate("sender", "firstName lastName avatar")
                .populate("recipient", "firstName lastName avatar")
                .populate("replyTo", "content sender")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);
            // Mark messages as read
            yield message_model_1.Message.updateMany({
                recipient: userId,
                sender: { $in: conversation.participants },
                isRead: false,
                isDeleted: false,
            }, { isRead: true, readAt: new Date() });
            // Reset unread count
            yield conversation_model_1.Conversation.findByIdAndUpdate(conversationId, {
                $set: { [`unreadCount.${userId}`]: 0 },
            });
            const total = yield message_model_1.Message.countDocuments({
                $or: [
                    { sender: userId, recipient: { $in: conversation.participants } },
                    { recipient: userId, sender: { $in: conversation.participants } },
                ],
                isDeleted: false,
            });
            return {
                messages: messages.reverse(), // Return in chronological order
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Get user conversations
     */
    getUserConversations(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid user ID");
            }
            const conversations = yield conversation_model_1.Conversation.find({
                participants: userId,
                isActive: true,
            })
                .populate("participants", "firstName lastName avatar")
                .populate("lastMessage", "content sender createdAt")
                .populate("groupAdmin", "firstName lastName")
                .sort({ lastMessageAt: -1 });
            return conversations;
        });
    }
    /**
     * Delete message
     */
    deleteMessage(messageId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(messageId) || !mongoose_1.Types.ObjectId.isValid(userId)) {
                throw new Error("Invalid message or user ID");
            }
            const message = yield message_model_1.Message.findById(messageId);
            if (!message) {
                throw new Error("Message not found");
            }
            if (message.sender.toString() !== userId) {
                throw new Error("You can only delete your own messages");
            }
            yield message_model_1.Message.findByIdAndUpdate(messageId, {
                isDeleted: true,
                deletedAt: new Date(),
            });
        });
    }
}
exports.InteractionService = InteractionService;
exports.default = new InteractionService();
