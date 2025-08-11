"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const socket_io_1 = require("socket.io");
const auth_middleware_1 = require("../middleware/auth.middleware");
const user_model_1 = require("../models/user.model");
const media_model_1 = require("../models/media.model");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const mediaUserAction_model_1 = require("../models/mediaUserAction.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Socket.IO service for real-time interactions
 * Handles comments, reactions, live streaming, and user presence
 */
class SocketService {
    constructor(server) {
        this.connectedUsers = new Map();
        this.streamViewers = new Map();
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"],
                credentials: true,
            },
            transports: ["websocket", "polling"],
        });
        this.setupMiddleware();
        this.setupEventHandlers();
        logger_1.default.info("Socket.IO service initialized");
    }
    /**
     * Setup Socket.IO middleware for authentication
     */
    setupMiddleware() {
        this.io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const token = socket.handshake.auth.token ||
                    ((_a = socket.handshake.headers.authorization) === null || _a === void 0 ? void 0 : _a.replace("Bearer ", ""));
                if (!token) {
                    return next(new Error("Authentication token required"));
                }
                const decoded = yield (0, auth_middleware_1.verifyToken)(token, {}, {});
                const user = yield user_model_1.User.findById(decoded.userId).select("email firstName lastName role");
                if (!user) {
                    return next(new Error("User not found"));
                }
                const authenticatedUser = {
                    userId: user._id.toString(),
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                };
                socket.data.user = authenticatedUser;
                this.connectedUsers.set(socket.id, authenticatedUser);
                logger_1.default.info("User connected via Socket.IO", {
                    userId: authenticatedUser.userId,
                    email: authenticatedUser.email,
                });
                next();
            }
            catch (error) {
                logger_1.default.error("Socket authentication failed", {
                    error: error.message,
                });
                next(new Error("Authentication failed"));
            }
        }));
    }
    /**
     * Setup Socket.IO event handlers
     */
    setupEventHandlers() {
        this.io.on("connection", socket => {
            const user = socket.data.user;
            logger_1.default.info("Socket connection established", {
                userId: user.userId,
                socketId: socket.id,
            });
            // Join user to their personal room
            socket.join(`user:${user.userId}`);
            // Handle disconnection
            socket.on("disconnect", () => {
                this.handleDisconnect(socket, user);
            });
            // Handle joining media room (for comments and reactions)
            socket.on("join-media", (mediaId) => {
                this.handleJoinMedia(socket, user, mediaId);
            });
            // Handle leaving media room
            socket.on("leave-media", (mediaId) => {
                this.handleLeaveMedia(socket, mediaId);
            });
            // Handle joining content room (universal)
            socket.on("join-content", (data) => {
                this.handleJoinContent(socket, user, data);
            });
            // Handle leaving content room
            socket.on("leave-content", (data) => {
                this.handleLeaveContent(socket, data);
            });
            // Handle joining live stream
            socket.on("join-stream", (data) => {
                this.handleJoinStream(socket, user, data);
            });
            // Handle leaving live stream
            socket.on("leave-stream", (data) => {
                this.handleLeaveStream(socket, user, data);
            });
            // Handle new comment
            socket.on("new-comment", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleNewComment(socket, user, data);
            }));
            // Handle comment reaction
            socket.on("comment-reaction", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleCommentReaction(socket, user, data);
            }));
            // Handle media reaction
            socket.on("media-reaction", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleMediaReaction(socket, user, data);
            }));
            // Handle content reaction (universal)
            socket.on("content-reaction", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleContentReaction(socket, user, data);
            }));
            // Handle content comment (universal)
            socket.on("content-comment", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleContentComment(socket, user, data);
            }));
            // Handle typing indicator
            socket.on("typing-start", (mediaId) => {
                this.handleTypingStart(socket, user, mediaId);
            });
            socket.on("typing-stop", (mediaId) => {
                this.handleTypingStop(socket, user, mediaId);
            });
            // Handle user presence
            socket.on("user-presence", (status) => {
                this.handleUserPresence(socket, user, status);
            });
            // Handle live stream chat
            socket.on("stream-chat", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleStreamChat(socket, user, data);
            }));
            // Handle stream status updates
            socket.on("stream-status", (data) => {
                this.handleStreamStatus(socket, user, data);
            });
            // Handle private messaging
            socket.on("send-message", (data) => __awaiter(this, void 0, void 0, function* () {
                yield this.handleSendMessage(socket, user, data);
            }));
            // Handle joining private chat room
            socket.on("join-chat", (recipientId) => {
                this.handleJoinChat(socket, user, recipientId);
            });
            // Handle leaving private chat room
            socket.on("leave-chat", (recipientId) => {
                this.handleLeaveChat(socket, recipientId);
            });
            // Handle typing in chat
            socket.on("chat-typing-start", (recipientId) => {
                this.handleChatTypingStart(socket, user, recipientId);
            });
            socket.on("chat-typing-stop", (recipientId) => {
                this.handleChatTypingStop(socket, user, recipientId);
            });
        });
    }
    /**
     * Handle user disconnection
     */
    handleDisconnect(socket, user) {
        this.connectedUsers.delete(socket.id);
        // Remove user from all stream viewers
        this.streamViewers.forEach((viewers, streamId) => {
            if (viewers.has(user.userId)) {
                viewers.delete(user.userId);
                this.io.to(`stream:${streamId}`).emit("viewer-left", {
                    streamId,
                    userId: user.userId,
                    viewerCount: viewers.size,
                });
            }
        });
        logger_1.default.info("User disconnected", {
            userId: user.userId,
            socketId: socket.id,
        });
    }
    /**
     * Handle joining media room
     */
    handleJoinMedia(socket, user, mediaId) {
        socket.join(`media:${mediaId}`);
        logger_1.default.debug("User joined media room", {
            userId: user.userId,
            mediaId,
        });
    }
    /**
     * Handle leaving media room
     */
    handleLeaveMedia(socket, mediaId) {
        socket.leave(`media:${mediaId}`);
        logger_1.default.debug("User left media room", {
            userId: socket.data.user.userId,
            mediaId,
        });
    }
    /**
     * Handle joining content room (universal)
     */
    handleJoinContent(socket, user, data) {
        const { contentId, contentType } = data;
        const roomId = `content:${contentType}:${contentId}`;
        socket.join(roomId);
        logger_1.default.debug("User joined content room", {
            userId: user.userId,
            contentId,
            contentType,
            roomId,
        });
    }
    /**
     * Handle leaving content room (universal)
     */
    handleLeaveContent(socket, data) {
        const { contentId, contentType } = data;
        const roomId = `content:${contentType}:${contentId}`;
        socket.leave(roomId);
        logger_1.default.debug("User left content room", {
            userId: socket.data.user.userId,
            contentId,
            contentType,
            roomId,
        });
    }
    /**
     * Handle joining live stream
     */
    handleJoinStream(socket, user, data) {
        const { streamId } = data;
        socket.join(`stream:${streamId}`);
        if (!this.streamViewers.has(streamId)) {
            this.streamViewers.set(streamId, new Set());
        }
        this.streamViewers.get(streamId).add(user.userId);
        const viewerCount = this.streamViewers.get(streamId).size;
        this.io.to(`stream:${streamId}`).emit("viewer-joined", {
            streamId,
            userId: user.userId,
            viewerCount,
        });
        logger_1.default.info("User joined live stream", {
            userId: user.userId,
            streamId,
            viewerCount,
        });
    }
    /**
     * Handle leaving live stream
     */
    handleLeaveStream(socket, user, data) {
        const { streamId } = data;
        socket.leave(`stream:${streamId}`);
        const viewers = this.streamViewers.get(streamId);
        if (viewers) {
            viewers.delete(user.userId);
            const viewerCount = viewers.size;
            this.io.to(`stream:${streamId}`).emit("viewer-left", {
                streamId,
                userId: user.userId,
                viewerCount,
            });
            logger_1.default.info("User left live stream", {
                userId: user.userId,
                streamId,
                viewerCount,
            });
        }
    }
    /**
     * Handle new comment
     */
    handleNewComment(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaId, content, parentCommentId } = data;
                // Validate media exists
                const media = yield media_model_1.Media.findById(mediaId);
                if (!media) {
                    socket.emit("error", { message: "Media not found" });
                    return;
                }
                // Create comment interaction
                const comment = yield mediaInteraction_model_1.MediaInteraction.create({
                    user: user.userId,
                    media: mediaId,
                    interactionType: "comment",
                    content,
                    parentCommentId,
                });
                const commentData = {
                    id: comment._id,
                    content: comment.content,
                    user: {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    },
                    createdAt: comment.createdAt,
                    parentCommentId,
                };
                // Broadcast to all users in the media room
                this.io.to(`media:${mediaId}`).emit("new-comment", commentData);
                logger_1.default.info("New comment created", {
                    userId: user.userId,
                    mediaId,
                    commentId: comment._id,
                });
            }
            catch (error) {
                logger_1.default.error("Error creating comment", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to create comment" });
            }
        });
    }
    /**
     * Handle comment reaction
     */
    handleCommentReaction(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { commentId, reaction } = data;
                // Update comment reaction
                const comment = yield mediaInteraction_model_1.MediaInteraction.findByIdAndUpdate(commentId, { $inc: { [`reactions.${reaction}`]: 1 } }, { new: true });
                if (comment) {
                    this.io.to(`media:${comment.media}`).emit("comment-reaction", {
                        commentId,
                        reaction,
                        count: ((_a = comment.reactions) === null || _a === void 0 ? void 0 : _a[reaction]) || 0,
                    });
                }
                logger_1.default.info("Comment reaction added", {
                    userId: user.userId,
                    commentId,
                    reaction,
                });
            }
            catch (error) {
                logger_1.default.error("Error adding comment reaction", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to add reaction" });
            }
        });
    }
    /**
     * Handle media reaction (like/unlike)
     */
    handleMediaReaction(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaId, actionType } = data;
                if (actionType === "like") {
                    // Handle like/unlike using the interaction service
                    const interactionService = yield Promise.resolve().then(() => __importStar(require("./interaction.service")));
                    const result = yield interactionService.default.toggleLike({
                        userId: user.userId,
                        mediaId,
                    });
                    this.io.to(`media:${mediaId}`).emit("media-reaction", {
                        mediaId,
                        actionType: "like",
                        liked: result.liked,
                        count: result.likeCount,
                    });
                }
                else {
                    // Handle other reactions (share, favorite)
                    yield mediaUserAction_model_1.MediaUserAction.findOneAndUpdate({ user: user.userId, media: mediaId, actionType }, { isRemoved: false }, { upsert: true, new: true });
                    // Update media counts
                    const media = yield media_model_1.Media.findByIdAndUpdate(mediaId, { $inc: { [`${actionType}Count`]: 1 } }, { new: true });
                    if (media) {
                        this.io.to(`media:${mediaId}`).emit("media-reaction", {
                            mediaId,
                            actionType,
                            count: media[`${actionType}Count`],
                        });
                    }
                }
                logger_1.default.info("Media reaction added", {
                    userId: user.userId,
                    mediaId,
                    actionType,
                });
            }
            catch (error) {
                logger_1.default.error("Error adding media reaction", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to add reaction" });
            }
        });
    }
    /**
     * Handle typing start
     */
    handleTypingStart(socket, user, mediaId) {
        socket.to(`media:${mediaId}`).emit("user-typing", {
            userId: user.userId,
            firstName: user.firstName,
            isTyping: true,
        });
    }
    /**
     * Handle typing stop
     */
    handleTypingStop(socket, user, mediaId) {
        socket.to(`media:${mediaId}`).emit("user-typing", {
            userId: user.userId,
            firstName: user.firstName,
            isTyping: false,
        });
    }
    /**
     * Handle user presence
     */
    handleUserPresence(socket, user, status) {
        socket.broadcast.emit("user-presence", {
            userId: user.userId,
            status,
        });
    }
    /**
     * Handle live stream chat
     */
    handleStreamChat(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { streamId, message } = data;
                const chatMessage = {
                    id: Date.now().toString(),
                    message,
                    user: {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    },
                    timestamp: new Date(),
                };
                this.io.to(`stream:${streamId}`).emit("stream-chat", chatMessage);
                logger_1.default.info("Stream chat message sent", {
                    userId: user.userId,
                    streamId,
                });
            }
            catch (error) {
                logger_1.default.error("Error sending stream chat", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to send chat message" });
            }
        });
    }
    /**
     * Handle stream status updates
     */
    handleStreamStatus(socket, user, data) {
        const { streamId, status } = data;
        this.io.to(`stream:${streamId}`).emit("stream-status", {
            streamId,
            status,
            updatedBy: user.userId,
        });
        logger_1.default.info("Stream status updated", {
            userId: user.userId,
            streamId,
            status,
        });
    }
    /**
     * Get connected users count
     */
    getConnectedUsersCount() {
        return this.connectedUsers.size;
    }
    /**
     * Get stream viewers count
     */
    getStreamViewersCount(streamId) {
        var _a;
        return ((_a = this.streamViewers.get(streamId)) === null || _a === void 0 ? void 0 : _a.size) || 0;
    }
    /**
     * Broadcast to all connected users
     */
    broadcastToAll(event, data) {
        this.io.emit(event, data);
    }
    /**
     * Broadcast to specific room
     */
    broadcastToRoom(room, event, data) {
        this.io.to(room).emit(event, data);
    }
    /**
     * Send to specific user
     */
    sendToUser(userId, event, data) {
        this.io.to(`user:${userId}`).emit(event, data);
    }
    /**
     * Handle sending private message
     */
    handleSendMessage(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { recipientId, content, messageType, mediaUrl, replyTo } = data;
                // Validate recipient exists
                const recipient = yield user_model_1.User.findById(recipientId);
                if (!recipient) {
                    socket.emit("error", { message: "Recipient not found" });
                    return;
                }
                // Use interaction service to send message
                const interactionService = yield Promise.resolve().then(() => __importStar(require("./interaction.service")));
                const message = yield interactionService.default.sendMessage({
                    senderId: user.userId,
                    recipientId,
                    content,
                    messageType: messageType,
                    mediaUrl,
                    replyTo,
                });
                // Send to recipient if online
                this.io.to(`user:${recipientId}`).emit("new-message", {
                    message,
                    sender: {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    },
                });
                // Send confirmation to sender
                socket.emit("message-sent", {
                    messageId: message._id,
                    timestamp: new Date(),
                });
                logger_1.default.info("Private message sent", {
                    senderId: user.userId,
                    recipientId,
                    messageId: message._id,
                });
            }
            catch (error) {
                logger_1.default.error("Error sending private message", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to send message" });
            }
        });
    }
    /**
     * Handle joining private chat room
     */
    handleJoinChat(socket, user, recipientId) {
        const chatRoomId = this.getChatRoomId(user.userId, recipientId);
        socket.join(chatRoomId);
        logger_1.default.debug("User joined private chat", {
            userId: user.userId,
            recipientId,
            chatRoomId,
        });
    }
    /**
     * Handle leaving private chat room
     */
    handleLeaveChat(socket, recipientId) {
        const chatRoomId = this.getChatRoomId(socket.data.user.userId, recipientId);
        socket.leave(chatRoomId);
        logger_1.default.debug("User left private chat", {
            userId: socket.data.user.userId,
            recipientId,
            chatRoomId,
        });
    }
    /**
     * Handle chat typing start
     */
    handleChatTypingStart(socket, user, recipientId) {
        this.io.to(`user:${recipientId}`).emit("user-typing-chat", {
            userId: user.userId,
            firstName: user.firstName,
            isTyping: true,
        });
    }
    /**
     * Handle chat typing stop
     */
    handleChatTypingStop(socket, user, recipientId) {
        this.io.to(`user:${recipientId}`).emit("user-typing-chat", {
            userId: user.userId,
            firstName: user.firstName,
            isTyping: false,
        });
    }
    /**
     * Handle content reaction (universal)
     */
    handleContentReaction(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { contentId, contentType, actionType } = data;
                // Use content interaction service
                const contentInteractionService = yield Promise.resolve().then(() => __importStar(require("./contentInteraction.service")));
                if (actionType === "like") {
                    const result = yield contentInteractionService.default.toggleLike(user.userId, contentId, contentType);
                    // Broadcast to all users viewing this content
                    this.io
                        .to(`content:${contentType}:${contentId}`)
                        .emit("content-reaction", {
                        contentId,
                        contentType,
                        actionType: "like",
                        liked: result.liked,
                        count: result.likeCount,
                        user: {
                            id: user.userId,
                            firstName: user.firstName,
                            lastName: user.lastName,
                        },
                    });
                }
                logger_1.default.info("Content reaction added", {
                    userId: user.userId,
                    contentId,
                    contentType,
                    actionType,
                });
            }
            catch (error) {
                logger_1.default.error("Error adding content reaction", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to add reaction" });
            }
        });
    }
    /**
     * Handle content comment (universal)
     */
    handleContentComment(socket, user, data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { contentId, contentType, content, parentCommentId } = data;
                // Use content interaction service
                const contentInteractionService = yield Promise.resolve().then(() => __importStar(require("./contentInteraction.service")));
                const comment = yield contentInteractionService.default.addComment(user.userId, contentId, contentType, content, parentCommentId);
                const commentData = {
                    id: comment._id,
                    content: comment.content,
                    user: {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                    },
                    createdAt: comment.createdAt,
                    parentCommentId,
                    contentType,
                };
                // Broadcast to all users viewing this content
                this.io
                    .to(`content:${contentType}:${contentId}`)
                    .emit("content-comment", commentData);
                logger_1.default.info("Content comment created", {
                    userId: user.userId,
                    contentId,
                    contentType,
                    commentId: comment._id,
                });
            }
            catch (error) {
                logger_1.default.error("Error creating content comment", {
                    error: error.message,
                });
                socket.emit("error", { message: "Failed to create comment" });
            }
        });
    }
    /**
     * Generate chat room ID for two users
     */
    getChatRoomId(userId1, userId2) {
        // Sort user IDs to ensure consistent room ID regardless of who initiates
        const sortedIds = [userId1, userId2].sort();
        return `chat:${sortedIds[0]}:${sortedIds[1]}`;
    }
    /**
     * Get Socket.IO server instance
     */
    getIO() {
        return this.io;
    }
}
exports.default = SocketService;
