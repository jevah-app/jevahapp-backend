import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { verifyToken } from "../middleware/auth.middleware";
import { User } from "../models/user.model";
import { Media } from "../models/media.model";
import { MediaInteraction } from "../models/mediaInteraction.model";
import { MediaUserAction } from "../models/mediaUserAction.model";
import logger from "../utils/logger";

/**
 * Interface for authenticated socket user
 */
interface AuthenticatedUser {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

/**
 * Interface for comment data
 */
interface CommentData {
  mediaId: string;
  content: string;
  parentCommentId?: string;
}

/**
 * Interface for reaction data
 */
interface ReactionData {
  mediaId: string;
  actionType: "like" | "dislike" | "favorite" | "share";
}

/**
 * Interface for live stream viewer data
 */
interface ViewerData {
  streamId: string;
  action: "join" | "leave";
}

/**
 * Socket.IO service for real-time interactions
 * Handles comments, reactions, live streaming, and user presence
 */
class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, AuthenticatedUser> = new Map();
  private streamViewers: Map<string, Set<string>> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      transports: ["websocket", "polling"],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info("Socket.IO service initialized");
  }

  /**
   * Setup Socket.IO middleware for authentication
   */
  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const decoded = await verifyToken(token, {} as any, {} as any);
        const user = await User.findById((decoded as any).userId).select(
          "email firstName lastName role"
        );

        if (!user) {
          return next(new Error("User not found"));
        }

        const authenticatedUser: AuthenticatedUser = {
          userId: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        };

        socket.data.user = authenticatedUser;
        this.connectedUsers.set(socket.id, authenticatedUser);

        logger.info("User connected via Socket.IO", {
          userId: authenticatedUser.userId,
          email: authenticatedUser.email,
        });

        next();
      } catch (error) {
        logger.error("Socket authentication failed", {
          error: (error as Error).message,
        });
        next(new Error("Authentication failed"));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    this.io.on("connection", socket => {
      const user = socket.data.user as AuthenticatedUser;

      logger.info("Socket connection established", {
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
      socket.on("join-media", (mediaId: string) => {
        this.handleJoinMedia(socket, user, mediaId);
      });

      // Handle leaving media room
      socket.on("leave-media", (mediaId: string) => {
        this.handleLeaveMedia(socket, mediaId);
      });

      // Handle joining content room (universal)
      socket.on(
        "join-content",
        (data: { contentId: string; contentType: string }) => {
          this.handleJoinContent(socket, user, data);
        }
      );

      // Handle leaving content room
      socket.on(
        "leave-content",
        (data: { contentId: string; contentType: string }) => {
          this.handleLeaveContent(socket, data);
        }
      );

      // Handle joining live stream
      socket.on("join-stream", (data: ViewerData) => {
        this.handleJoinStream(socket, user, data);
      });

      // Handle leaving live stream
      socket.on("leave-stream", (data: ViewerData) => {
        this.handleLeaveStream(socket, user, data);
      });

      // Handle new comment
      socket.on("new-comment", async (data: CommentData) => {
        await this.handleNewComment(socket, user, data);
      });

      // Handle comment reaction
      socket.on(
        "comment-reaction",
        async (data: { commentId: string; reaction: string }) => {
          await this.handleCommentReaction(socket, user, data);
        }
      );

      // Handle media reaction
      socket.on("media-reaction", async (data: ReactionData) => {
        await this.handleMediaReaction(socket, user, data);
      });

      // Handle content reaction (universal)
      socket.on(
        "content-reaction",
        async (data: {
          contentId: string;
          contentType: string;
          actionType: string;
        }) => {
          await this.handleContentReaction(socket, user, data);
        }
      );

      // Handle content comment (universal)
      socket.on(
        "content-comment",
        async (data: {
          contentId: string;
          contentType: string;
          content: string;
          parentCommentId?: string;
        }) => {
          await this.handleContentComment(socket, user, data);
        }
      );

      // Handle typing indicator
      socket.on("typing-start", (mediaId: string) => {
        this.handleTypingStart(socket, user, mediaId);
      });

      socket.on("typing-stop", (mediaId: string) => {
        this.handleTypingStop(socket, user, mediaId);
      });

      // Handle user presence
      socket.on("user-presence", (status: "online" | "away" | "offline") => {
        this.handleUserPresence(socket, user, status);
      });

      // Handle live stream chat
      socket.on(
        "stream-chat",
        async (data: { streamId: string; message: string }) => {
          await this.handleStreamChat(socket, user, data);
        }
      );

      // Handle stream status updates
      socket.on(
        "stream-status",
        (data: { streamId: string; status: string }) => {
          this.handleStreamStatus(socket, user, data);
        }
      );

      // Handle private messaging
      socket.on(
        "send-message",
        async (data: {
          recipientId: string;
          content: string;
          messageType?: string;
          mediaUrl?: string;
          replyTo?: string;
        }) => {
          await this.handleSendMessage(socket, user, data);
        }
      );

      // Handle joining private chat room
      socket.on("join-chat", (recipientId: string) => {
        this.handleJoinChat(socket, user, recipientId);
      });

      // Handle leaving private chat room
      socket.on("leave-chat", (recipientId: string) => {
        this.handleLeaveChat(socket, recipientId);
      });

      // Handle typing in chat
      socket.on("chat-typing-start", (recipientId: string) => {
        this.handleChatTypingStart(socket, user, recipientId);
      });

      socket.on("chat-typing-stop", (recipientId: string) => {
        this.handleChatTypingStop(socket, user, recipientId);
      });
    });
  }

  /**
   * Handle user disconnection
   */
  private handleDisconnect(socket: any, user: AuthenticatedUser): void {
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

    logger.info("User disconnected", {
      userId: user.userId,
      socketId: socket.id,
    });
  }

  /**
   * Handle joining media room
   */
  private handleJoinMedia(
    socket: any,
    user: AuthenticatedUser,
    mediaId: string
  ): void {
    socket.join(`media:${mediaId}`);
    logger.debug("User joined media room", {
      userId: user.userId,
      mediaId,
    });
  }

  /**
   * Handle leaving media room
   */
  private handleLeaveMedia(socket: any, mediaId: string): void {
    socket.leave(`media:${mediaId}`);
    logger.debug("User left media room", {
      userId: socket.data.user.userId,
      mediaId,
    });
  }

  /**
   * Handle joining content room (universal)
   */
  private handleJoinContent(
    socket: any,
    user: AuthenticatedUser,
    data: { contentId: string; contentType: string }
  ): void {
    const { contentId, contentType } = data;
    const roomId = `content:${contentType}:${contentId}`;

    socket.join(roomId);

    logger.debug("User joined content room", {
      userId: user.userId,
      contentId,
      contentType,
      roomId,
    });
  }

  /**
   * Handle leaving content room (universal)
   */
  private handleLeaveContent(
    socket: any,
    data: { contentId: string; contentType: string }
  ): void {
    const { contentId, contentType } = data;
    const roomId = `content:${contentType}:${contentId}`;

    socket.leave(roomId);

    logger.debug("User left content room", {
      userId: socket.data.user.userId,
      contentId,
      contentType,
      roomId,
    });
  }

  /**
   * Handle joining live stream
   */
  private handleJoinStream(
    socket: any,
    user: AuthenticatedUser,
    data: ViewerData
  ): void {
    const { streamId } = data;

    socket.join(`stream:${streamId}`);

    if (!this.streamViewers.has(streamId)) {
      this.streamViewers.set(streamId, new Set());
    }

    this.streamViewers.get(streamId)!.add(user.userId);

    const viewerCount = this.streamViewers.get(streamId)!.size;

    this.io.to(`stream:${streamId}`).emit("viewer-joined", {
      streamId,
      userId: user.userId,
      viewerCount,
    });

    logger.info("User joined live stream", {
      userId: user.userId,
      streamId,
      viewerCount,
    });
  }

  /**
   * Handle leaving live stream
   */
  private handleLeaveStream(
    socket: any,
    user: AuthenticatedUser,
    data: ViewerData
  ): void {
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

      logger.info("User left live stream", {
        userId: user.userId,
        streamId,
        viewerCount,
      });
    }
  }

  /**
   * Handle new comment
   */
  private async handleNewComment(
    socket: any,
    user: AuthenticatedUser,
    data: CommentData
  ): Promise<void> {
    try {
      const { mediaId, content, parentCommentId } = data;

      // Validate media exists
      const media = await Media.findById(mediaId);
      if (!media) {
        socket.emit("error", { message: "Media not found" });
        return;
      }

      // Create comment interaction
      const comment = await MediaInteraction.create({
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

      logger.info("New comment created", {
        userId: user.userId,
        mediaId,
        commentId: comment._id,
      });
    } catch (error) {
      logger.error("Error creating comment", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to create comment" });
    }
  }

  /**
   * Handle comment reaction
   */
  private async handleCommentReaction(
    socket: any,
    user: AuthenticatedUser,
    data: { commentId: string; reaction: string }
  ): Promise<void> {
    try {
      const { commentId, reaction } = data;

      // Update comment reaction
      const comment = await MediaInteraction.findByIdAndUpdate(
        commentId,
        { $inc: { [`reactions.${reaction}`]: 1 } },
        { new: true }
      );

      if (comment) {
        this.io.to(`media:${comment.media}`).emit("comment-reaction", {
          commentId,
          reaction,
          count: comment.reactions?.[reaction] || 0,
        });
      }

      logger.info("Comment reaction added", {
        userId: user.userId,
        commentId,
        reaction,
      });
    } catch (error) {
      logger.error("Error adding comment reaction", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to add reaction" });
    }
  }

  /**
   * Handle media reaction (like/unlike)
   */
  private async handleMediaReaction(
    socket: any,
    user: AuthenticatedUser,
    data: ReactionData
  ): Promise<void> {
    try {
      const { mediaId, actionType } = data;

      if (actionType === "like") {
        // Handle like/unlike using the interaction service
        const interactionService = await import("./interaction.service");
        const result = await interactionService.default.toggleLike({
          userId: user.userId,
          mediaId,
        });

        this.io.to(`media:${mediaId}`).emit("media-reaction", {
          mediaId,
          actionType: "like",
          liked: result.liked,
          count: result.likeCount,
        });
      } else {
        // Handle other reactions (share, favorite)
        await MediaUserAction.findOneAndUpdate(
          { user: user.userId, media: mediaId, actionType },
          { isRemoved: false },
          { upsert: true, new: true }
        );

        // Update media counts
        const media = await Media.findByIdAndUpdate(
          mediaId,
          { $inc: { [`${actionType}Count`]: 1 } },
          { new: true }
        );

        if (media) {
          this.io.to(`media:${mediaId}`).emit("media-reaction", {
            mediaId,
            actionType,
            count: media[`${actionType}Count`],
          });
        }
      }

      logger.info("Media reaction added", {
        userId: user.userId,
        mediaId,
        actionType,
      });
    } catch (error) {
      logger.error("Error adding media reaction", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to add reaction" });
    }
  }

  /**
   * Handle typing start
   */
  private handleTypingStart(
    socket: any,
    user: AuthenticatedUser,
    mediaId: string
  ): void {
    socket.to(`media:${mediaId}`).emit("user-typing", {
      userId: user.userId,
      firstName: user.firstName,
      isTyping: true,
    });
  }

  /**
   * Handle typing stop
   */
  private handleTypingStop(
    socket: any,
    user: AuthenticatedUser,
    mediaId: string
  ): void {
    socket.to(`media:${mediaId}`).emit("user-typing", {
      userId: user.userId,
      firstName: user.firstName,
      isTyping: false,
    });
  }

  /**
   * Handle user presence
   */
  private handleUserPresence(
    socket: any,
    user: AuthenticatedUser,
    status: string
  ): void {
    socket.broadcast.emit("user-presence", {
      userId: user.userId,
      status,
    });
  }

  /**
   * Handle live stream chat
   */
  private async handleStreamChat(
    socket: any,
    user: AuthenticatedUser,
    data: { streamId: string; message: string }
  ): Promise<void> {
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

      logger.info("Stream chat message sent", {
        userId: user.userId,
        streamId,
      });
    } catch (error) {
      logger.error("Error sending stream chat", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to send chat message" });
    }
  }

  /**
   * Handle stream status updates
   */
  private handleStreamStatus(
    socket: any,
    user: AuthenticatedUser,
    data: { streamId: string; status: string }
  ): void {
    const { streamId, status } = data;

    this.io.to(`stream:${streamId}`).emit("stream-status", {
      streamId,
      status,
      updatedBy: user.userId,
    });

    logger.info("Stream status updated", {
      userId: user.userId,
      streamId,
      status,
    });
  }

  /**
   * Get connected users count
   */
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  /**
   * Get stream viewers count
   */
  public getStreamViewersCount(streamId: string): number {
    return this.streamViewers.get(streamId)?.size || 0;
  }

  /**
   * Broadcast to all connected users
   */
  public broadcastToAll(event: string, data: any): void {
    this.io.emit(event, data);
  }

  /**
   * Broadcast to specific room
   */
  public broadcastToRoom(room: string, event: string, data: any): void {
    this.io.to(room).emit(event, data);
  }

  /**
   * Send to specific user
   */
  public sendToUser(userId: string, event: string, data: any): void {
    this.io.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Handle sending private message
   */
  private async handleSendMessage(
    socket: any,
    user: AuthenticatedUser,
    data: {
      recipientId: string;
      content: string;
      messageType?: string;
      mediaUrl?: string;
      replyTo?: string;
    }
  ): Promise<void> {
    try {
      const { recipientId, content, messageType, mediaUrl, replyTo } = data;

      // Validate recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        socket.emit("error", { message: "Recipient not found" });
        return;
      }

      // Use interaction service to send message
      const interactionService = await import("./interaction.service");
      const message = await interactionService.default.sendMessage({
        senderId: user.userId,
        recipientId,
        content,
        messageType: messageType as any,
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

      logger.info("Private message sent", {
        senderId: user.userId,
        recipientId,
        messageId: message._id,
      });
    } catch (error) {
      logger.error("Error sending private message", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to send message" });
    }
  }

  /**
   * Handle joining private chat room
   */
  private handleJoinChat(
    socket: any,
    user: AuthenticatedUser,
    recipientId: string
  ): void {
    const chatRoomId = this.getChatRoomId(user.userId, recipientId);
    socket.join(chatRoomId);

    logger.debug("User joined private chat", {
      userId: user.userId,
      recipientId,
      chatRoomId,
    });
  }

  /**
   * Handle leaving private chat room
   */
  private handleLeaveChat(socket: any, recipientId: string): void {
    const chatRoomId = this.getChatRoomId(socket.data.user.userId, recipientId);
    socket.leave(chatRoomId);

    logger.debug("User left private chat", {
      userId: socket.data.user.userId,
      recipientId,
      chatRoomId,
    });
  }

  /**
   * Handle chat typing start
   */
  private handleChatTypingStart(
    socket: any,
    user: AuthenticatedUser,
    recipientId: string
  ): void {
    this.io.to(`user:${recipientId}`).emit("user-typing-chat", {
      userId: user.userId,
      firstName: user.firstName,
      isTyping: true,
    });
  }

  /**
   * Handle chat typing stop
   */
  private handleChatTypingStop(
    socket: any,
    user: AuthenticatedUser,
    recipientId: string
  ): void {
    this.io.to(`user:${recipientId}`).emit("user-typing-chat", {
      userId: user.userId,
      firstName: user.firstName,
      isTyping: false,
    });
  }

  /**
   * Handle content reaction (universal)
   */
  private async handleContentReaction(
    socket: any,
    user: AuthenticatedUser,
    data: { contentId: string; contentType: string; actionType: string }
  ): Promise<void> {
    try {
      const { contentId, contentType, actionType } = data;

      // Use content interaction service
      const contentInteractionService = await import(
        "./contentInteraction.service"
      );

      if (actionType === "like") {
        const result = await contentInteractionService.default.toggleLike(
          user.userId,
          contentId,
          contentType
        );

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

      logger.info("Content reaction added", {
        userId: user.userId,
        contentId,
        contentType,
        actionType,
      });
    } catch (error) {
      logger.error("Error adding content reaction", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to add reaction" });
    }
  }

  /**
   * Handle content comment (universal)
   */
  private async handleContentComment(
    socket: any,
    user: AuthenticatedUser,
    data: {
      contentId: string;
      contentType: string;
      content: string;
      parentCommentId?: string;
    }
  ): Promise<void> {
    try {
      const { contentId, contentType, content, parentCommentId } = data;

      // Use content interaction service
      const contentInteractionService = await import(
        "./contentInteraction.service"
      );

      const comment = await contentInteractionService.default.addComment(
        user.userId,
        contentId,
        contentType,
        content,
        parentCommentId
      );

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

      logger.info("Content comment created", {
        userId: user.userId,
        contentId,
        contentType,
        commentId: comment._id,
      });
    } catch (error) {
      logger.error("Error creating content comment", {
        error: (error as Error).message,
      });
      socket.emit("error", { message: "Failed to create comment" });
    }
  }

  /**
   * Generate chat room ID for two users
   */
  private getChatRoomId(userId1: string, userId2: string): string {
    // Sort user IDs to ensure consistent room ID regardless of who initiates
    const sortedIds = [userId1, userId2].sort();
    return `chat:${sortedIds[0]}:${sortedIds[1]}`;
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

export default SocketService;
