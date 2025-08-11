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
exports.getShareStats = exports.getShareUrls = exports.deleteMessage = exports.getUserConversations = exports.getConversationMessages = exports.sendMessage = exports.getComments = exports.shareMedia = exports.addCommentReaction = exports.removeComment = exports.addComment = exports.toggleLike = void 0;
const mongoose_1 = require("mongoose");
const interaction_service_1 = __importDefault(require("../service/interaction.service"));
const share_service_1 = __importDefault(require("../service/share.service"));
const logger_1 = __importDefault(require("../utils/logger"));
// Like/Unlike media
const toggleLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const result = yield interaction_service_1.default.toggleLike({ userId, mediaId });
        res.status(200).json({
            success: true,
            message: result.liked ? "Media liked successfully" : "Media unliked successfully",
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error("Toggle like error", {
            error: error.message,
            userId: req.userId,
            mediaId: req.params.mediaId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
        });
    }
});
exports.toggleLike = toggleLike;
// Add comment
const addComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
            return;
        }
        const comment = yield interaction_service_1.default.addComment({
            userId,
            mediaId,
            content,
            parentCommentId,
        });
        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });
    }
    catch (error) {
        logger_1.default.error("Add comment error", {
            error: error.message,
            userId: req.userId,
            mediaId: req.params.mediaId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to add comment",
        });
    }
});
exports.addComment = addComment;
// Remove comment
const removeComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!commentId || !mongoose_1.Types.ObjectId.isValid(commentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
            return;
        }
        yield interaction_service_1.default.removeComment(commentId, userId);
        res.status(200).json({
            success: true,
            message: "Comment removed successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Remove comment error", {
            error: error.message,
            userId: req.userId,
            commentId: req.params.commentId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        if (error.message.includes("own comments")) {
            res.status(403).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to remove comment",
        });
    }
});
exports.removeComment = removeComment;
// Add comment reaction
const addCommentReaction = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { commentId } = req.params;
        const { reactionType } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!commentId || !mongoose_1.Types.ObjectId.isValid(commentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid comment ID",
            });
            return;
        }
        if (!reactionType) {
            res.status(400).json({
                success: false,
                message: "Reaction type is required",
            });
            return;
        }
        const result = yield interaction_service_1.default.addCommentReaction({
            userId,
            commentId,
            reactionType,
        });
        res.status(200).json({
            success: true,
            message: "Reaction added successfully",
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error("Add comment reaction error", {
            error: error.message,
            userId: req.userId,
            commentId: req.params.commentId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to add reaction",
        });
    }
});
exports.addCommentReaction = addCommentReaction;
// Share media
const shareMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const { platform, message } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        // Record share interaction
        yield interaction_service_1.default.shareMedia({
            userId,
            mediaId,
            platform,
            message,
        });
        // Generate share URLs
        const shareUrls = yield share_service_1.default.generateSocialShareUrls(mediaId, message);
        res.status(200).json({
            success: true,
            message: "Media shared successfully",
            data: {
                shareUrls,
                platform,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Share media error", {
            error: error.message,
            userId: req.userId,
            mediaId: req.params.mediaId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to share media",
        });
    }
});
exports.shareMedia = shareMedia;
// Get comments
const getComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const result = yield interaction_service_1.default.getComments(mediaId, page, limit);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error("Get comments error", {
            error: error.message,
            mediaId: req.params.mediaId,
        });
        if (error.message.includes("Invalid")) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to get comments",
        });
    }
});
exports.getComments = getComments;
// Send message
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { recipientId } = req.params;
        const { content, messageType, mediaUrl, replyTo } = req.body;
        const senderId = req.userId;
        if (!senderId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!recipientId || !mongoose_1.Types.ObjectId.isValid(recipientId)) {
            res.status(400).json({
                success: false,
                message: "Invalid recipient ID",
            });
            return;
        }
        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Message content is required",
            });
            return;
        }
        const message = yield interaction_service_1.default.sendMessage({
            senderId,
            recipientId,
            content,
            messageType,
            mediaUrl,
            replyTo,
        });
        res.status(201).json({
            success: true,
            message: "Message sent successfully",
            data: message,
        });
    }
    catch (error) {
        logger_1.default.error("Send message error", {
            error: error.message,
            senderId: req.userId,
            recipientId: req.params.recipientId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to send message",
        });
    }
});
exports.sendMessage = sendMessage;
// Get conversation messages
const getConversationMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { conversationId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!conversationId || !mongoose_1.Types.ObjectId.isValid(conversationId)) {
            res.status(400).json({
                success: false,
                message: "Invalid conversation ID",
            });
            return;
        }
        const result = yield interaction_service_1.default.getConversationMessages(conversationId, userId, page, limit);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error("Get conversation messages error", {
            error: error.message,
            userId: req.userId,
            conversationId: req.params.conversationId,
        });
        if (error.message.includes("not found") || error.message.includes("access denied")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to get conversation messages",
        });
    }
});
exports.getConversationMessages = getConversationMessages;
// Get user conversations
const getUserConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const conversations = yield interaction_service_1.default.getUserConversations(userId);
        res.status(200).json({
            success: true,
            data: conversations,
        });
    }
    catch (error) {
        logger_1.default.error("Get user conversations error", {
            error: error.message,
            userId: req.userId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to get conversations",
        });
    }
});
exports.getUserConversations = getUserConversations;
// Delete message
const deleteMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messageId } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!messageId || !mongoose_1.Types.ObjectId.isValid(messageId)) {
            res.status(400).json({
                success: false,
                message: "Invalid message ID",
            });
            return;
        }
        yield interaction_service_1.default.deleteMessage(messageId, userId);
        res.status(200).json({
            success: true,
            message: "Message deleted successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Delete message error", {
            error: error.message,
            userId: req.userId,
            messageId: req.params.messageId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        if (error.message.includes("own messages")) {
            res.status(403).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to delete message",
        });
    }
});
exports.deleteMessage = deleteMessage;
// Get share URLs for media
const getShareUrls = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        const { message } = req.query;
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const shareUrls = yield share_service_1.default.generateSocialShareUrls(mediaId, message);
        const qrCode = yield share_service_1.default.generateQRCode(mediaId);
        const embedCode = yield share_service_1.default.generateEmbedCode(mediaId);
        res.status(200).json({
            success: true,
            data: {
                shareUrls,
                qrCode,
                embedCode,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Get share URLs error", {
            error: error.message,
            mediaId: req.params.mediaId,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to get share URLs",
        });
    }
});
exports.getShareUrls = getShareUrls;
// Get share statistics
const getShareStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        if (!mediaId || !mongoose_1.Types.ObjectId.isValid(mediaId)) {
            res.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const stats = yield share_service_1.default.getShareStats(mediaId);
        res.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        logger_1.default.error("Get share stats error", {
            error: error.message,
            mediaId: req.params.mediaId,
        });
        res.status(500).json({
            success: false,
            message: "Failed to get share statistics",
        });
    }
});
exports.getShareStats = getShareStats;
