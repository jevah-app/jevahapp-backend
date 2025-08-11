import { Request, Response } from "express";
import { devotionalService } from "../service/devotionals.service";
import { Types } from "mongoose";

// Interface for create devotional request body
interface CreateDevotionalBody {
  title: string;
  content: string;
  scriptureReference?: string;
  author?: string;
  tags?: string[];
}

// Interface for update devotional request body
interface UpdateDevotionalBody {
  title?: string;
  content?: string;
  scriptureReference?: string;
  author?: string;
  tags?: string[];
}

// Interface for list devotionals query parameters
interface ListDevotionalsQuery {
  search?: string;
  tags?: string;
  submittedBy?: string;
  sort?: string;
  page?: string;
  limit?: string;
}

// Interface for devotional response (to handle lean() output)
interface DevotionalResponse {
  _id: string;
  title: string;
  content: string;
  scriptureReference?: string;
  author?: string;
  submittedBy: { username?: string };
  tags?: string[];
  likeCount: number;
  createdAt?: string;
  updatedAt?: Date;
}

/**
 * Create a new devotional
 */
export const createDevotional = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const { title, content, scriptureReference, author, tags } =
      request.body as CreateDevotionalBody;

    if (!title || !content) {
      response.status(400).json({
        success: false,
        message: "Title and content are required",
      });
      return;
    }

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const devotional = await devotionalService.createDevotional({
      title,
      content,
      scriptureReference,
      author,
      tags,
      submittedBy: userId,
    });

    response.status(201).json({
      success: true,
      message: "Devotional submitted successfully",
      devotional,
    });
  } catch (error) {
    console.error("Create devotional error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to create devotional",
    });
  }
};

/**
 * List all devotionals with filters, pagination, and sorting
 */
export const listDevotionals = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const { search, tags, submittedBy, sort, page, limit } =
      request.query as ListDevotionalsQuery;

    // Validate query parameters
    if (page && isNaN(parseInt(page))) {
      response.status(400).json({
        success: false,
        message: "Invalid page number",
      });
      return;
    }
    if (limit && isNaN(parseInt(limit))) {
      response.status(400).json({
        success: false,
        message: "Invalid limit",
      });
      return;
    }

    // Build filters object
    const filters: any = {};
    if (search) filters.search = search;
    if (tags) filters.tags = tags;
    if (submittedBy) filters.submittedBy = submittedBy;
    if (sort) filters.sort = sort;
    if (page) filters.page = page;
    if (limit) filters.limit = limit;

    const result = await devotionalService.listDevotionals(filters, userId);

    // Add hasLiked status for each devotional
    const devotionals = await Promise.all(
      result.devotionals.map(async (devotional: any) => {
        const hasLiked = userId
          ? await devotionalService.hasUserLikedDevotional(
              userId,
              devotional._id.toString()
            )
          : false;
        return { ...devotional, hasLiked };
      })
    );

    response.status(200).json({
      success: true,
      message: "Devotionals retrieved successfully",
      devotionals,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("List devotionals error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve devotionals",
    });
  }
};

/**
 * Get a single devotional by ID
 */
export const getDevotionalById = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userId = request.userId;

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid devotional ID",
      });
      return;
    }

    const devotional = await devotionalService.getDevotionalById(id);
    const hasLiked = userId
      ? await devotionalService.hasUserLikedDevotional(userId, id)
      : false;

    response.status(200).json({
      success: true,
      message: "Devotional retrieved successfully",
      devotional: { ...devotional, hasLiked },
    });
  } catch (error: any) {
    console.error("Get devotional error:", error);
    response.status(error.message === "Devotional not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to retrieve devotional",
    });
  }
};

/**
 * Update a devotional
 */
export const updateDevotional = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userId = request.userId;
    const userRole = request.userRole;
    const { title, content, scriptureReference, author, tags } =
      request.body as UpdateDevotionalBody;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid devotional ID",
      });
      return;
    }

    const updateDevotional = async (
      request: Request,
      response: Response
    ): Promise<void> => {
      try {
        const { id } = request.params;
        const userId = request.userId;
        const userRole = request.userRole;
        const { title, content, scriptureReference, author, tags } =
          request.body as UpdateDevotionalBody;

        if (!userId) {
          response.status(401).json({
            success: false,
            message: "Unauthorized: User not authenticated",
          });
          return;
        }

        if (!Types.ObjectId.isValid(id)) {
          response.status(400).json({
            success: false,
            message: "Invalid devotional ID",
          });
          return;
        }

        const updatedDevotional = await devotionalService.updateDevotional(
          id,
          userId,
          userRole || "", // Provide default value
          {
            title,
            content,
            scriptureReference,
            author,
            tags,
          }
        );

        response.status(200).json({
          success: true,
          message: "Devotional updated successfully",
          devotional: updatedDevotional,
        });
      } catch (error: any) {
        console.error("Update devotional error:", error);
        response
          .status(error.message === "Devotional not found" ? 404 : 403)
          .json({
            success: false,
            message: error.message || "Failed to update devotional",
          });
      }
    };

    response.status(200).json({
      success: true,
      message: "Devotional updated successfully",
      devotional: updateDevotional,
    });
  } catch (error: any) {
    console.error("Update devotional error:", error);
    response.status(error.message === "Devotional not found" ? 404 : 403).json({
      success: false,
      message: error.message || "Failed to update devotional",
    });
  }
};

/**
 * Like or unlike a devotional
 */
export const likeDevotional = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userId = request.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid devotional ID",
      });
      return;
    }

    const { liked, likeCount } = await devotionalService.likeDevotional({
      userId,
      devotionalId: id,
    });

    response.status(200).json({
      success: true,
      message: liked ? "Devotional liked" : "Devotional unliked",
      data: { liked, likeCount },
    });
  } catch (error: any) {
    console.error("Like devotional error:", error);
    response.status(error.message === "Devotional not found" ? 404 : 500).json({
      success: false,
      message: error.message || "Failed to like devotional",
    });
  }
};
