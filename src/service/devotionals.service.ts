import { Devotional } from "../models/devotional.model";
import { DevotionalLike } from "../models/devotionalLike.model";
import { Types, ClientSession } from "mongoose";

interface DevotionalInput {
  title: string;
  content: string;
  scriptureReference?: string;
  author?: string;
  submittedBy: Types.ObjectId | string;
  tags?: string[];
}

interface UpdateDevotionalInput {
  title?: string;
  content?: string;
  scriptureReference?: string;
  author?: string;
  tags?: string[];
}

interface LikeDevotionalInput {
  userId: string;
  devotionalId: string;
}

export class DevotionalService {
  /**
   * Create a new devotional
   */
  async createDevotional(data: DevotionalInput) {
    const devotional = new Devotional({
      title: data.title,
      content: data.content,
      scriptureReference: data.scriptureReference,
      author: data.author,
      submittedBy:
        typeof data.submittedBy === "string"
          ? new Types.ObjectId(data.submittedBy)
          : data.submittedBy,
      tags: data.tags || [],
      likeCount: 0,
    });

    await devotional.save();
    return devotional;
  }

  /**
   * List devotionals with filters, pagination, and sorting
   */
  async listDevotionals(filters: any = {}, userId?: string) {
    const query: any = {};

    // Search by title or scripture reference
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: "i" } },
        { scriptureReference: { $regex: filters.search, $options: "i" } },
      ];
    }

    // Filter by tags
    if (filters.tags) {
      const tagsArray = Array.isArray(filters.tags)
        ? filters.tags
        : filters.tags.split(",");
      query.tags = {
        $in: tagsArray.map((tag: string) => new RegExp(tag, "i")),
      };
    }

    // Filter by submittedBy (e.g., user's own devotionals)
    if (filters.submittedBy === "me" && userId) {
      query.submittedBy = new Types.ObjectId(userId);
    } else if (
      filters.submittedBy &&
      Types.ObjectId.isValid(filters.submittedBy)
    ) {
      query.submittedBy = new Types.ObjectId(filters.submittedBy);
    }

    // Sorting
    const sort = filters.sort || "-createdAt"; // Default: newest first

    // Pagination
    const page = parseInt(filters.page as string) || 1;
    const limit = parseInt(filters.limit as string) || 10;
    const skip = (page - 1) * limit;

    const devotionals = await Devotional.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("submittedBy", "username")
      .lean();

    const total = await Devotional.countDocuments(query);

    return {
      devotionals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single devotional by ID
   */
  async getDevotionalById(devotionalId: string) {
    if (!Types.ObjectId.isValid(devotionalId)) {
      throw new Error("Invalid devotional ID");
    }

    const devotional = await Devotional.findById(devotionalId)
      .populate("submittedBy", "username")
      .lean();

    if (!devotional) {
      throw new Error("Devotional not found");
    }

    return devotional;
  }

  /**
   * Update a devotional
   */
  async updateDevotional(
    devotionalId: string,
    userId: string,
    userRole: string,
    data: UpdateDevotionalInput
  ) {
    if (!Types.ObjectId.isValid(devotionalId)) {
      throw new Error("Invalid devotional ID");
    }

    const devotional = await Devotional.findById(devotionalId);
    if (!devotional) {
      throw new Error("Devotional not found");
    }

    if (devotional.submittedBy.toString() !== userId && userRole !== "admin") {
      throw new Error("Unauthorized to edit this devotional");
    }

    const updateData: any = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.scriptureReference !== undefined)
      updateData.scriptureReference = data.scriptureReference;
    if (data.author !== undefined) updateData.author = data.author;
    if (data.tags) updateData.tags = data.tags;

    const updatedDevotional = await Devotional.findByIdAndUpdate(
      devotionalId,
      { $set: updateData },
      { new: true }
    )
      .populate("submittedBy", "username")
      .lean();

    return updatedDevotional;
  }

  /**
   * Toggle like on a devotional
   */
  async likeDevotional(data: LikeDevotionalInput) {
    if (
      !Types.ObjectId.isValid(data.userId) ||
      !Types.ObjectId.isValid(data.devotionalId)
    ) {
      throw new Error("Invalid user or devotional ID");
    }

    const devotional = await Devotional.findById(data.devotionalId);
    if (!devotional) {
      throw new Error("Devotional not found");
    }

    const session: ClientSession = await Devotional.startSession();
    try {
      let liked = false;
      await session.withTransaction(async () => {
        const existingLike = await DevotionalLike.findOne({
          user: new Types.ObjectId(data.userId),
          devotional: new Types.ObjectId(data.devotionalId),
        }).session(session);

        if (existingLike) {
          // Unlike: Remove like and decrement likeCount
          await DevotionalLike.findByIdAndDelete(existingLike._id).session(
            session
          );
          await Devotional.findByIdAndUpdate(
            data.devotionalId,
            { $inc: { likeCount: -1 } },
            { session }
          );
        } else {
          // Like: Add like and increment likeCount
          await DevotionalLike.create(
            [
              {
                user: new Types.ObjectId(data.userId),
                devotional: new Types.ObjectId(data.devotionalId),
              },
            ],
            { session }
          );
          await Devotional.findByIdAndUpdate(
            data.devotionalId,
            { $inc: { likeCount: 1 } },
            { session }
          );
          liked = true;
        }
      });

      return { liked, likeCount: devotional.likeCount + (liked ? 1 : -1) };
    } finally {
      session.endSession();
    }
  }

  /**
   * Check if user has liked a devotional
   */
  async hasUserLikedDevotional(userId: string, devotionalId: string) {
    if (
      !Types.ObjectId.isValid(userId) ||
      !Types.ObjectId.isValid(devotionalId)
    ) {
      return false;
    }

    const like = await DevotionalLike.findOne({
      user: new Types.ObjectId(userId),
      devotional: new Types.ObjectId(devotionalId),
    });

    return !!like;
  }
}

export const devotionalService = new DevotionalService();
