import mongoose, { Types, ClientSession } from "mongoose";
import { MediaInteraction } from "../models/mediaInteraction.model";
import { Media } from "../models/media.model";
import { User } from "../models/user.model";
import { Message } from "../models/message.model";
import { Conversation } from "../models/conversation.model";
import logger from "../utils/logger";

export interface LikeMediaInput {
  userId: string;
  mediaId: string;
}

export interface CommentInput {
  userId: string;
  mediaId: string;
  content: string;
  parentCommentId?: string;
}

export interface ReactionInput {
  userId: string;
  commentId: string;
  reactionType: string;
}

export interface ShareInput {
  userId: string;
  mediaId: string;
  platform?: string;
  message?: string;
}

export interface MessageInput {
  senderId: string;
  recipientId: string;
  content: string;
  messageType?: "text" | "image" | "audio" | "video" | "file";
  mediaUrl?: string;
  replyTo?: string;
}

export class InteractionService {
  /**
   * Toggle like on media
   */
  async toggleLike(
    data: LikeMediaInput
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (
      !Types.ObjectId.isValid(data.userId) ||
      !Types.ObjectId.isValid(data.mediaId)
    ) {
      throw new Error("Invalid user or media ID");
    }

    const media = await Media.findById(data.mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    const session: ClientSession = await Media.startSession();
    try {
      let liked = false;
      await session.withTransaction(async () => {
        const existingLike = await MediaInteraction.findOne({
          user: new Types.ObjectId(data.userId),
          media: new Types.ObjectId(data.mediaId),
          interactionType: "like",
          isRemoved: { $ne: true },
        }).session(session);

        if (existingLike) {
          // Unlike: Soft delete the like
          await MediaInteraction.findByIdAndUpdate(
            existingLike._id,
            { isRemoved: true },
            { session }
          );
          await Media.findByIdAndUpdate(
            data.mediaId,
            { $inc: { likeCount: -1 } },
            { session }
          );
        } else {
          // Like: Create new like or restore existing
          await MediaInteraction.findOneAndUpdate(
            {
              user: new Types.ObjectId(data.userId),
              media: new Types.ObjectId(data.mediaId),
              interactionType: "like",
            },
            { isRemoved: false },
            { upsert: true, session }
          );
          await Media.findByIdAndUpdate(
            data.mediaId,
            { $inc: { likeCount: 1 } },
            { session }
          );
          liked = true;
        }
      });

      const updatedMedia = await Media.findById(data.mediaId);
      return { liked, likeCount: updatedMedia?.likeCount || 0 };
    } finally {
      session.endSession();
    }
  }

  /**
   * Add comment to media
   */
  async addComment(data: CommentInput): Promise<any> {
    if (
      !Types.ObjectId.isValid(data.userId) ||
      !Types.ObjectId.isValid(data.mediaId)
    ) {
      throw new Error("Invalid user or media ID");
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error("Comment content is required");
    }

    const media = await Media.findById(data.mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    const session: ClientSession = await Media.startSession();
    try {
      const comment = await session.withTransaction(async () => {
        const commentData: any = {
          user: new Types.ObjectId(data.userId),
          media: new Types.ObjectId(data.mediaId),
          interactionType: "comment",
          content: data.content.trim(),
        };

        if (
          data.parentCommentId &&
          Types.ObjectId.isValid(data.parentCommentId)
        ) {
          commentData.parentCommentId = new Types.ObjectId(
            data.parentCommentId
          );
        }

        const comment = await MediaInteraction.create([commentData], {
          session,
        });

        // Update media comment count
        await Media.findByIdAndUpdate(
          data.mediaId,
          { $inc: { commentCount: 1 } },
          { session }
        );

        return comment[0];
      });

      // Populate user info for response
      const populatedComment = await MediaInteraction.findById(comment._id)
        .populate("user", "firstName lastName avatar")
        .populate("parentCommentId", "content user");

      return populatedComment;
    } finally {
      session.endSession();
    }
  }

  /**
   * Remove comment
   */
  async removeComment(commentId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(commentId) || !Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid comment or user ID");
    }

    const comment = await MediaInteraction.findById(commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    if (comment.user.toString() !== userId) {
      throw new Error("You can only delete your own comments");
    }

    const session: ClientSession = await Media.startSession();
    try {
      await session.withTransaction(async () => {
        await MediaInteraction.findByIdAndUpdate(
          commentId,
          { isRemoved: true },
          { session }
        );

        await Media.findByIdAndUpdate(
          comment.media,
          { $inc: { commentCount: -1 } },
          { session }
        );
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Add reaction to comment
   */
  async addCommentReaction(
    data: ReactionInput
  ): Promise<{ reactionType: string; count: number }> {
    if (
      !Types.ObjectId.isValid(data.userId) ||
      !Types.ObjectId.isValid(data.commentId)
    ) {
      throw new Error("Invalid user or comment ID");
    }

    const comment = await MediaInteraction.findById(data.commentId);
    if (!comment || comment.interactionType !== "comment") {
      throw new Error("Comment not found");
    }

    const session: ClientSession = await Media.startSession();
    try {
      const result = await session.withTransaction(async () => {
        const userId = new Types.ObjectId(data.userId);
        const currentReactions = comment.reactions || {};
        const userReactions = currentReactions[data.reactionType] || [];

        let newReactions;
        if (userReactions.includes(userId)) {
          // Remove reaction
          newReactions = userReactions.filter((id: any) => !id.equals(userId));
        } else {
          // Add reaction
          newReactions = [...userReactions, userId];
        }

        const updatedComment = await MediaInteraction.findByIdAndUpdate(
          data.commentId,
          { [`reactions.${data.reactionType}`]: newReactions },
          { new: true, session }
        );

        return {
          reactionType: data.reactionType,
          count: newReactions.length,
        };
      });

      return result;
    } finally {
      session.endSession();
    }
  }

  /**
   * Share media
   */
  async shareMedia(data: ShareInput): Promise<void> {
    if (
      !Types.ObjectId.isValid(data.userId) ||
      !Types.ObjectId.isValid(data.mediaId)
    ) {
      throw new Error("Invalid user or media ID");
    }

    const media = await Media.findById(data.mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    const session: ClientSession = await Media.startSession();
    try {
      await session.withTransaction(async () => {
        // Record share interaction
        await MediaInteraction.findOneAndUpdate(
          {
            user: new Types.ObjectId(data.userId),
            media: new Types.ObjectId(data.mediaId),
            interactionType: "share",
          },
          { isRemoved: false },
          { upsert: true, session }
        );

        // Update media share count
        await Media.findByIdAndUpdate(
          data.mediaId,
          { $inc: { shareCount: 1 } },
          { session }
        );
      });
    } finally {
      session.endSession();
    }
  }

  /**
   * Get comments for media
   */
  async getComments(
    mediaId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<any> {
    if (!Types.ObjectId.isValid(mediaId)) {
      throw new Error("Invalid media ID");
    }

    const skip = (page - 1) * limit;

    const comments = await MediaInteraction.find({
      media: new Types.ObjectId(mediaId),
      interactionType: "comment",
      isRemoved: { $ne: true },
    })
      .populate("user", "firstName lastName avatar")
      .populate("parentCommentId", "content user")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MediaInteraction.countDocuments({
      media: new Types.ObjectId(mediaId),
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
  }

  /**
   * Send message
   */
  async sendMessage(data: MessageInput): Promise<any> {
    if (
      !Types.ObjectId.isValid(data.senderId) ||
      !Types.ObjectId.isValid(data.recipientId)
    ) {
      throw new Error("Invalid sender or recipient ID");
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error("Message content is required");
    }

    const session: ClientSession = await Message.startSession();
    try {
      const result = await session.withTransaction(async () => {
        // Find or create conversation
        let conversation = await Conversation.findOne({
          participants: { $all: [data.senderId, data.recipientId] },
          isGroupChat: false,
        }).session(session);

        if (!conversation) {
          conversation = await Conversation.create(
            [
              {
                participants: [data.senderId, data.recipientId],
                unreadCount: { [data.recipientId]: 0 },
              },
            ],
            { session }
          );
        }

        // Create message
        const messageData: any = {
          sender: new Types.ObjectId(data.senderId),
          recipient: new Types.ObjectId(data.recipientId),
          content: data.content.trim(),
          messageType: data.messageType || "text",
        };

        if (data.mediaUrl) {
          messageData.mediaUrl = data.mediaUrl;
        }

        if (data.replyTo && Types.ObjectId.isValid(data.replyTo)) {
          messageData.replyTo = new Types.ObjectId(data.replyTo);
        }

        const message = await Message.create([messageData], { session });

        // Update conversation
        await Conversation.findByIdAndUpdate(
          conversation._id,
          {
            lastMessage: message[0]._id,
            lastMessageAt: new Date(),
            $inc: { [`unreadCount.${data.recipientId}`]: 1 },
          },
          { session }
        );

        return message[0];
      });

      // Populate sender info
      const populatedMessage = await Message.findById(result._id)
        .populate("sender", "firstName lastName avatar")
        .populate("recipient", "firstName lastName avatar")
        .populate("replyTo", "content sender");

      return populatedMessage;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get conversation messages
   */
  async getConversationMessages(
    conversationId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<any> {
    if (
      !Types.ObjectId.isValid(conversationId) ||
      !Types.ObjectId.isValid(userId)
    ) {
      throw new Error("Invalid conversation or user ID");
    }

    const conversation = await Conversation.findById(conversationId);
    if (
      !conversation ||
      !conversation.participants.includes(new Types.ObjectId(userId))
    ) {
      throw new Error("Conversation not found or access denied");
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({
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
    await Message.updateMany(
      {
        recipient: userId,
        sender: { $in: conversation.participants },
        isRead: false,
        isDeleted: false,
      },
      { isRead: true, readAt: new Date() }
    );

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: { [`unreadCount.${userId}`]: 0 },
    });

    const total = await Message.countDocuments({
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
  }

  /**
   * Get user conversations
   */
  async getUserConversations(userId: string): Promise<any[]> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID");
    }

    const conversations = await Conversation.find({
      participants: userId,
      isActive: true,
    })
      .populate("participants", "firstName lastName avatar")
      .populate("lastMessage", "content sender createdAt")
      .populate("groupAdmin", "firstName lastName")
      .sort({ lastMessageAt: -1 });

    return conversations;
  }

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(messageId) || !Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid message or user ID");
    }

    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.sender.toString() !== userId) {
      throw new Error("You can only delete your own messages");
    }

    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
    });
  }
}

export default new InteractionService();
