import mongoose, { Types, ClientSession } from "mongoose";
import { MediaInteraction } from "../models/mediaInteraction.model";
import { Media } from "../models/media.model";
import { User } from "../models/user.model";
import { Devotional } from "../models/devotional.model";
import { DevotionalLike } from "../models/devotionalLike.model";
import logger from "../utils/logger";

export interface ContentInteractionInput {
  userId: string;
  contentId: string;
  contentType:
    | "media"
    | "devotional"
    | "artist"
    | "merch"
    | "ebook"
    | "podcast";
  actionType: "like" | "comment" | "share" | "favorite" | "bookmark";
  content?: string; // For comments
  parentCommentId?: string; // For nested comments
  reactionType?: string; // For reactions
}

export interface ContentMetadata {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  author?: {
    id: string;
    name: string;
    avatar?: string;
  };
  stats: {
    likes: number;
    comments: number;
    shares: number;
    views: number;
    downloads?: number;
  };
  userInteraction: {
    hasLiked: boolean;
    hasCommented: boolean;
    hasShared: boolean;
    hasFavorited: boolean;
    hasBookmarked: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export class ContentInteractionService {
  /**
   * Toggle like on any content type
   */
  async toggleLike(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(contentId)) {
      throw new Error("Invalid user or content ID");
    }

    const session: ClientSession = await Media.startSession();
    try {
      let liked = false;
      await session.withTransaction(async () => {
        // Handle different content types
        switch (contentType) {
          case "media":
            liked = await this.toggleMediaLike(userId, contentId, session);
            break;
          case "devotional":
            liked = await this.toggleDevotionalLike(userId, contentId, session);
            break;
          case "artist":
            liked = await this.toggleArtistFollow(userId, contentId, session);
            break;
          case "merch":
            liked = await this.toggleMerchFavorite(userId, contentId, session);
            break;
          default:
            throw new Error(`Unsupported content type: ${contentType}`);
        }
      });

      return {
        liked,
        likeCount: await this.getLikeCount(contentId, contentType),
      };
    } finally {
      session.endSession();
    }
  }

  /**
   * Add comment to any content type
   */
  async addComment(
    userId: string,
    contentId: string,
    contentType: string,
    content: string,
    parentCommentId?: string
  ): Promise<any> {
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(contentId)) {
      throw new Error("Invalid user or content ID");
    }

    if (!content || content.trim().length === 0) {
      throw new Error("Comment content is required");
    }

    // Only media and devotional support comments for now
    if (!["media", "devotional"].includes(contentType)) {
      throw new Error(
        `Comments not supported for content type: ${contentType}`
      );
    }

    const session: ClientSession = await Media.startSession();
    try {
      const comment = await session.withTransaction(async () => {
        const commentData: any = {
          user: new Types.ObjectId(userId),
          media: new Types.ObjectId(contentId),
          interactionType: "comment",
          content: content.trim(),
        };

        if (parentCommentId && Types.ObjectId.isValid(parentCommentId)) {
          commentData.parentCommentId = new Types.ObjectId(parentCommentId);
        }

        const comment = await MediaInteraction.create([commentData], {
          session,
        });

        // Update content comment count
        if (contentType === "media") {
          await Media.findByIdAndUpdate(
            contentId,
            { $inc: { commentCount: 1 } },
            { session }
          );
        }

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
   * Get content metadata for frontend UI
   */
  async getContentMetadata(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<ContentMetadata> {
    if (!Types.ObjectId.isValid(contentId)) {
      throw new Error("Invalid content ID");
    }

    let content: any;
    let author: any;

    // Get content based on type
    switch (contentType) {
      case "media":
        content = await Media.findById(contentId).populate(
          "uploadedBy",
          "firstName lastName avatar"
        );
        author = content?.uploadedBy;
        break;
      case "devotional":
        content = await Devotional.findById(contentId).populate(
          "author",
          "firstName lastName avatar"
        );
        author = content?.author;
        break;
      case "artist":
        content = await User.findById(contentId).select(
          "firstName lastName avatar artistProfile"
        );
        author = content;
        break;
      case "merch":
        content = await Media.findById(contentId).populate(
          "uploadedBy",
          "firstName lastName avatar"
        );
        author = content?.uploadedBy;
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }

    if (!content) {
      throw new Error("Content not found");
    }

    // Get stats
    const stats = await this.getContentStats(contentId, contentType);

    // Get user interactions
    const userInteraction = await this.getUserInteraction(
      userId,
      contentId,
      contentType
    );

    return {
      id: content._id.toString(),
      title:
        content.title || content.firstName || content.artistProfile?.artistName,
      description:
        content.description || content.bio || content.artistProfile?.bio,
      contentType,
      author: author
        ? {
            id: author._id.toString(),
            name:
              author.firstName + " " + author.lastName ||
              author.artistProfile?.artistName,
            avatar: author.avatar,
          }
        : undefined,
      stats,
      userInteraction,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  /**
   * Get content statistics
   */
  private async getContentStats(
    contentId: string,
    contentType: string
  ): Promise<any> {
    switch (contentType) {
      case "media":
        const media = await Media.findById(contentId);
        return {
          likes: media?.likeCount || 0,
          comments: media?.commentCount || 0,
          shares: media?.shareCount || 0,
          views: media?.viewCount || 0,
          downloads: media?.downloadCount || 0,
        };
      case "devotional":
        const devotional = await Devotional.findById(contentId);
        const devotionalLikes = await DevotionalLike.countDocuments({
          devotional: contentId,
        });
        return {
          likes: devotionalLikes,
          comments: 0, // Devotionals don't have comments yet
          shares: 0,
          views: devotional?.viewCount || 0,
        };
      case "artist":
        const artist = await User.findById(contentId);
        return {
          likes: 0,
          comments: 0,
          shares: 0,
          views: 0,
          followers: artist?.artistProfile?.followerCount || 0,
        };
      case "merch":
        const merch = await Media.findById(contentId);
        return {
          likes: merch?.likeCount || 0,
          comments: merch?.commentCount || 0,
          shares: merch?.shareCount || 0,
          views: merch?.viewCount || 0,
          sales: 0, // TODO: Implement sales tracking
        };
      default:
        return { likes: 0, comments: 0, shares: 0, views: 0 };
    }
  }

  /**
   * Get user interaction status
   */
  private async getUserInteraction(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<any> {
    if (!userId) {
      return {
        hasLiked: false,
        hasCommented: false,
        hasShared: false,
        hasFavorited: false,
        hasBookmarked: false,
      };
    }

    const [hasLiked, hasCommented, hasShared, hasFavorited, hasBookmarked] =
      await Promise.all([
        this.checkUserLike(userId, contentId, contentType),
        this.checkUserComment(userId, contentId, contentType),
        this.checkUserShare(userId, contentId, contentType),
        this.checkUserFavorite(userId, contentId, contentType),
        this.checkUserBookmark(userId, contentId, contentType),
      ]);

    return {
      hasLiked,
      hasCommented,
      hasShared,
      hasFavorited,
      hasBookmarked,
    };
  }

  /**
   * Check if user has liked content
   */
  private async checkUserLike(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    switch (contentType) {
      case "media":
        const mediaLike = await MediaInteraction.findOne({
          user: userId,
          media: contentId,
          interactionType: "like",
          isRemoved: { $ne: true },
        });
        return !!mediaLike;
      case "devotional":
        const devotionalLike = await DevotionalLike.findOne({
          user: userId,
          devotional: contentId,
        });
        return !!devotionalLike;
      case "artist":
        const artist = await User.findById(userId);
        return artist?.following?.includes(contentId) || false;
      default:
        return false;
    }
  }

  /**
   * Check if user has commented on content
   */
  private async checkUserComment(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    if (!["media", "devotional"].includes(contentType)) return false;

    const comment = await MediaInteraction.findOne({
      user: userId,
      media: contentId,
      interactionType: "comment",
      isRemoved: { $ne: true },
    });
    return !!comment;
  }

  /**
   * Check if user has shared content
   */
  private async checkUserShare(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    const share = await MediaInteraction.findOne({
      user: userId,
      media: contentId,
      interactionType: "share",
      isRemoved: { $ne: true },
    });
    return !!share;
  }

  /**
   * Check if user has favorited content
   */
  private async checkUserFavorite(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    const favorite = await MediaInteraction.findOne({
      user: userId,
      media: contentId,
      interactionType: "favorite",
      isRemoved: { $ne: true },
    });
    return !!favorite;
  }

  /**
   * Check if user has bookmarked content
   */
  private async checkUserBookmark(
    userId: string,
    contentId: string,
    contentType: string
  ): Promise<boolean> {
    // TODO: Implement bookmark system
    return false;
  }

  /**
   * Get like count for content
   */
  private async getLikeCount(
    contentId: string,
    contentType: string
  ): Promise<number> {
    switch (contentType) {
      case "media":
        const media = await Media.findById(contentId);
        return media?.likeCount || 0;
      case "devotional":
        const devotionalLikes = await DevotionalLike.countDocuments({
          devotional: contentId,
        });
        return devotionalLikes;
      case "artist":
        const artist = await User.findById(contentId);
        return artist?.artistProfile?.followerCount || 0;
      default:
        return 0;
    }
  }

  /**
   * Toggle media like
   */
  private async toggleMediaLike(
    userId: string,
    contentId: string,
    session: ClientSession
  ): Promise<boolean> {
    const existingLike = await MediaInteraction.findOne({
      user: new Types.ObjectId(userId),
      media: new Types.ObjectId(contentId),
      interactionType: "like",
      isRemoved: { $ne: true },
    }).session(session);

    if (existingLike) {
      // Unlike
      await MediaInteraction.findByIdAndUpdate(
        existingLike._id,
        { isRemoved: true },
        { session }
      );
      await Media.findByIdAndUpdate(
        contentId,
        { $inc: { likeCount: -1 } },
        { session }
      );
      return false;
    } else {
      // Like
      await MediaInteraction.findOneAndUpdate(
        {
          user: new Types.ObjectId(userId),
          media: new Types.ObjectId(contentId),
          interactionType: "like",
        },
        { isRemoved: false },
        { upsert: true, session }
      );
      await Media.findByIdAndUpdate(
        contentId,
        { $inc: { likeCount: 1 } },
        { session }
      );
      return true;
    }
  }

  /**
   * Toggle devotional like
   */
  private async toggleDevotionalLike(
    userId: string,
    contentId: string,
    session: ClientSession
  ): Promise<boolean> {
    const existingLike = await DevotionalLike.findOne({
      user: new Types.ObjectId(userId),
      devotional: new Types.ObjectId(contentId),
    }).session(session);

    if (existingLike) {
      // Unlike
      await DevotionalLike.findByIdAndDelete(existingLike._id, { session });
      await Devotional.findByIdAndUpdate(
        contentId,
        { $inc: { likeCount: -1 } },
        { session }
      );
      return false;
    } else {
      // Like
      await DevotionalLike.create(
        [
          {
            user: new Types.ObjectId(userId),
            devotional: new Types.ObjectId(contentId),
          },
        ],
        { session }
      );
      await Devotional.findByIdAndUpdate(
        contentId,
        { $inc: { likeCount: 1 } },
        { session }
      );
      return true;
    }
  }

  /**
   * Toggle artist follow
   */
  private async toggleArtistFollow(
    userId: string,
    contentId: string,
    session: ClientSession
  ): Promise<boolean> {
    const follower = await User.findById(userId).session(session);
    const artist = await User.findById(contentId).session(session);

    if (!follower || !artist) {
      throw new Error("User or artist not found");
    }

    const isFollowing = follower.following?.some(
      (followedArtistId: Types.ObjectId) =>
        followedArtistId.equals(new Types.ObjectId(contentId))
    );

    if (isFollowing) {
      // Unfollow
      await User.findByIdAndUpdate(
        userId,
        { $pull: { following: new Types.ObjectId(contentId) } },
        { session }
      );
      await User.findByIdAndUpdate(
        contentId,
        {
          $pull: { followers: new Types.ObjectId(userId) },
          $inc: { "artistProfile.followerCount": -1 },
        },
        { session }
      );
      return false;
    } else {
      // Follow
      await User.findByIdAndUpdate(
        userId,
        { $push: { following: new Types.ObjectId(contentId) } },
        { session }
      );
      await User.findByIdAndUpdate(
        contentId,
        {
          $push: { followers: new Types.ObjectId(userId) },
          $inc: { "artistProfile.followerCount": 1 },
        },
        { session }
      );
      return true;
    }
  }

  /**
   * Toggle merch favorite
   */
  private async toggleMerchFavorite(
    userId: string,
    contentId: string,
    session: ClientSession
  ): Promise<boolean> {
    const existingFavorite = await MediaInteraction.findOne({
      user: new Types.ObjectId(userId),
      media: new Types.ObjectId(contentId),
      interactionType: "favorite",
      isRemoved: { $ne: true },
    }).session(session);

    if (existingFavorite) {
      // Remove favorite
      await MediaInteraction.findByIdAndUpdate(
        existingFavorite._id,
        { isRemoved: true },
        { session }
      );
      return false;
    } else {
      // Add favorite
      await MediaInteraction.findOneAndUpdate(
        {
          user: new Types.ObjectId(userId),
          media: new Types.ObjectId(contentId),
          interactionType: "favorite",
        },
        { isRemoved: false },
        { upsert: true, session }
      );
      return true;
    }
  }
}

export default new ContentInteractionService();
