import { DatingProfile, Match, DatingMessage } from "../models/dating.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import logger from "../utils/logger";

interface DatingProfileData {
  lookingFor: "men" | "women" | "both";
  ageRange: {
    min: number;
    max: number;
  };
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: [number, number];
  };
  bio: string;
  interests: string[];
  photos: string[];
  mainPhoto: string;
  height?: number;
  education?: string;
  occupation?: string;
  faithLevel:
    | "very_important"
    | "important"
    | "somewhat_important"
    | "not_important";
  denomination?: string;
  preferences: {
    maxDistance: number;
    ageRange: {
      min: number;
      max: number;
    };
    faithLevel:
      | "very_important"
      | "important"
      | "somewhat_important"
      | "not_important";
  };
}

interface DatingFilters {
  ageRange?: {
    min: number;
    max: number;
  };
  faithLevel?: string;
  denomination?: string;
  maxDistance?: number;
  interests?: string[];
}

class DatingService {
  /**
   * Create or update dating profile
   */
  async createOrUpdateProfile(
    userId: string,
    profileData: DatingProfileData
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const profile = await DatingProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        {
          ...profileData,
          userId: new Types.ObjectId(userId),
          lastActive: new Date(),
        },
        { new: true, upsert: true, runValidators: true }
      );

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "datingProfile", duration, {
        userId,
        operation: "createOrUpdateProfile",
      });

      return profile;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error creating/updating dating profile", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get dating profile
   */
  async getProfile(userId: string): Promise<any> {
    const startTime = Date.now();

    try {
      const profile = await DatingProfile.findOne({
        userId: new Types.ObjectId(userId),
      }).populate("userId", "firstName lastName email avatar age gender");

      if (!profile) {
        throw new Error("Dating profile not found");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("find", "datingProfile", duration, {
        userId,
      });

      return profile;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting dating profile", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get potential matches
   */
  async getPotentialMatches(
    userId: string,
    filters: DatingFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    profiles: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const userProfile = await DatingProfile.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (!userProfile) {
        throw new Error("Dating profile not found");
      }

      const skip = (page - 1) * limit;
      const matchStage: any = {
        userId: { $ne: new Types.ObjectId(userId) },
        isActive: true,
        lookingFor:
          user.gender === "male"
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

      const [profiles, total] = await Promise.all([
        DatingProfile.aggregate(pipeline as any),
        DatingProfile.countDocuments(matchStage),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "datingProfile", duration, {
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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting potential matches", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Like a profile (create match)
   */
  async likeProfile(userId: string, likedUserId: string): Promise<any> {
    const startTime = Date.now();

    try {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          {
            user1: new Types.ObjectId(userId),
            user2: new Types.ObjectId(likedUserId),
          },
          {
            user1: new Types.ObjectId(likedUserId),
            user2: new Types.ObjectId(userId),
          },
        ],
      });

      if (existingMatch) {
        throw new Error("Match already exists");
      }

      // Create new match
      const match = await Match.create({
        user1: new Types.ObjectId(userId),
        user2: new Types.ObjectId(likedUserId),
        status: "pending",
        matchedAt: new Date(),
        isActive: true,
      });

      const duration = Date.now() - startTime;
      logger.logDatabase("create", "match", duration, {
        userId,
        likedUserId,
      });

      return match;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error liking profile", {
        error: error.message,
        userId,
        likedUserId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Accept or reject a match
   */
  async respondToMatch(
    userId: string,
    matchId: string,
    response: "accepted" | "rejected"
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const match = await Match.findOneAndUpdate(
        {
          _id: matchId,
          user2: new Types.ObjectId(userId),
          status: "pending",
        },
        {
          status: response,
          ...(response === "accepted" && { lastMessageAt: new Date() }),
        },
        { new: true }
      );

      if (!match) {
        throw new Error("Match not found or already responded");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "match", duration, {
        userId,
        matchId,
        response,
      });

      return match;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error responding to match", {
        error: error.message,
        userId,
        matchId,
        response,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get user's matches
   */
  async getUserMatches(
    userId: string,
    status?: "pending" | "accepted" | "rejected"
  ): Promise<any[]> {
    const startTime = Date.now();

    try {
      const matchStage: any = {
        $or: [
          { user1: new Types.ObjectId(userId) },
          { user2: new Types.ObjectId(userId) },
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
                      { $ne: ["$_id", new Types.ObjectId(userId)] },
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

      const matches = await Match.aggregate(pipeline as any);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "match", duration, {
        operation: "getUserMatches",
        userId,
        status,
      });

      return matches;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting user matches", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Send message in a match
   */
  async sendMessage(
    senderId: string,
    matchId: string,
    content: string,
    messageType: "text" | "image" | "voice" | "gift" = "text",
    attachments?: string[]
  ): Promise<any> {
    const startTime = Date.now();

    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error("Match not found");
      }

      // Verify sender is part of the match
      if (
        match.user1.toString() !== senderId &&
        match.user2.toString() !== senderId
      ) {
        throw new Error("Unauthorized to send message in this match");
      }

      // Determine receiver
      const receiverId =
        match.user1.toString() === senderId ? match.user2 : match.user1;

      const message = await DatingMessage.create({
        matchId: new Types.ObjectId(matchId),
        sender: new Types.ObjectId(senderId),
        receiver: new Types.ObjectId(receiverId),
        content,
        messageType,
        attachments: attachments || [],
        isRead: false,
      });

      // Update match's last message time
      await Match.findByIdAndUpdate(matchId, {
        lastMessageAt: new Date(),
      });

      const duration = Date.now() - startTime;
      logger.logDatabase("create", "datingMessage", duration, {
        senderId,
        matchId,
        messageType,
      });

      return message;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error sending message", {
        error: error.message,
        senderId,
        matchId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get messages in a match
   */
  async getMatchMessages(
    userId: string,
    matchId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const startTime = Date.now();

    try {
      const match = await Match.findById(matchId);
      if (!match) {
        throw new Error("Match not found");
      }

      // Verify user is part of the match
      if (
        match.user1.toString() !== userId &&
        match.user2.toString() !== userId
      ) {
        throw new Error("Unauthorized to access this match");
      }

      const skip = (page - 1) * limit;

      const pipeline = [
        { $match: { matchId: new Types.ObjectId(matchId) } },
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

      const [messages, total] = await Promise.all([
        DatingMessage.aggregate(pipeline as any),
        DatingMessage.countDocuments({ matchId: new Types.ObjectId(matchId) }),
      ]);

      const totalPages = Math.ceil(total / limit);

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "datingMessage", duration, {
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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error getting match messages", {
        error: error.message,
        userId,
        matchId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, matchId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await DatingMessage.updateMany(
        {
          matchId: new Types.ObjectId(matchId),
          receiver: new Types.ObjectId(userId),
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "datingMessage", duration, {
        userId,
        matchId,
        operation: "markMessagesAsRead",
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error marking messages as read", {
        error: error.message,
        userId,
        matchId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get unread message count
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const count = await DatingMessage.countDocuments({
        receiver: new Types.ObjectId(userId),
        isRead: false,
      });

      return count;
    } catch (error: any) {
      logger.error("Error getting unread message count", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Deactivate dating profile
   */
  async deactivateProfile(userId: string): Promise<void> {
    const startTime = Date.now();

    try {
      await DatingProfile.findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { isActive: false }
      );

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "datingProfile", duration, {
        userId,
        operation: "deactivateProfile",
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Error deactivating profile", {
        error: error.message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

export default new DatingService();
