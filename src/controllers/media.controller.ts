import { Request, Response } from "express";
import { mediaService } from "../service/media.service";
import { Bookmark } from "../models/bookmark.model";
import { Types } from "mongoose";
import { Media } from "../models/media.model";
import contaboStreamingService from "../service/contaboStreaming.service";
import liveRecordingService from "../service/liveRecording.service";

interface UploadMediaRequestBody {
  title: string;
  description?: string;
  contentType: "music" | "videos" | "books" | "live";
  category?: string;
  topics?: string[] | string;
  duration?: number;
}
interface InteractionRequestBody {
  interactionType: "view" | "listen" | "read" | "download";
}

interface UserActionRequestBody {
  actionType: "favorite" | "share";
}

interface SearchQueryParameters {
  search?: string;
  contentType?: string;
  category?: string;
  topics?: string;
  sort?: string;
  page?: string;
  limit?: string;
  creator?: string;
  duration?: "short" | "medium" | "long";
  startDate?: string;
  endDate?: string;
}

// New interfaces for enhanced functionality
interface ViewTrackingRequestBody {
  duration: number; // Duration in seconds
  isComplete?: boolean;
}

interface DownloadRequestBody {
  fileSize: number;
}

interface ShareRequestBody {
  platform?: string;
}

export const getAnalyticsDashboard = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;
    const userRole = request.userRole;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    let analyticsData: any;

    if (userRole === "admin") {
      const mediaCountByContentType =
        await mediaService.getMediaCountByContentType();
      const totalInteractionCounts =
        await mediaService.getTotalInteractionCounts();
      const totalBookmarks = await Bookmark.countDocuments();
      const recentMedia = await mediaService.getRecentMedia(10);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const uploadsLastThirtyDays =
        await mediaService.getMediaCountSinceDate(thirtyDaysAgo);
      const interactionsLastThirtyDays =
        await mediaService.getInteractionCountSinceDate(thirtyDaysAgo);

      analyticsData = {
        isAdmin: true,
        mediaCountByContentType,
        totalInteractionCounts,
        totalBookmarks,
        recentMedia,
        uploadsLastThirtyDays,
        interactionsLastThirtyDays,
      };
    } else {
      const userMediaCountByContentType =
        await mediaService.getUserMediaCountByContentType(userIdentifier);
      const userInteractionCounts =
        await mediaService.getUserInteractionCounts(userIdentifier);
      const userBookmarks =
        await mediaService.getUserBookmarkCount(userIdentifier);
      const userRecentMedia = await mediaService.getUserRecentMedia(
        userIdentifier,
        5
      );
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const userUploadsLastThirtyDays =
        await mediaService.getUserMediaCountSinceDate(
          userIdentifier,
          thirtyDaysAgo
        );
      const userInteractionsLastThirtyDays =
        await mediaService.getUserInteractionCountSinceDate(
          userIdentifier,
          thirtyDaysAgo
        );

      analyticsData = {
        isAdmin: false,
        userMediaCountByContentType,
        userInteractionCounts,
        userBookmarks,
        userRecentMedia,
        userUploadsLastThirtyDays,
        userInteractionsLastThirtyDays,
      };
    }

    response.status(200).json({
      success: true,
      message: "Analytics data retrieved successfully",
      data: analyticsData,
    });
  } catch (error: any) {
    console.error("Analytics error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

export const uploadMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { title, description, contentType, category, topics, duration } =
      request.body as UploadMediaRequestBody;

    // Type assertion for Multer files from upload.fields
    const files = request.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;

    // Check if files object exists
    if (!files) {
      console.log("No files received in request");
      response.status(400).json({
        success: false,
        message: "No files uploaded",
      });
      return;
    }

    const file = files?.file?.[0]; // Access the first file in the 'file' field
    const thumbnail = files?.thumbnail?.[0]; // Access the first file in the 'thumbnail' field

    // Detailed logging for debugging
    console.log("Request Files:", {
      fileExists: !!file,
      fileBufferExists: !!file?.buffer,
      fileMimetype: file?.mimetype,
      fileOriginalname: file?.originalname,
      fileSize: file?.size,
      thumbnailExists: !!thumbnail,
      thumbnailBufferExists: !!thumbnail?.buffer,
      thumbnailMimetype: thumbnail?.mimetype,
      thumbnailOriginalname: thumbnail?.originalname,
      thumbnailSize: thumbnail?.size,
      body: {
        title,
        description,
        contentType,
        category,
        topics,
        duration,
      },
    });

    // Validate required fields
    if (!title || !contentType) {
      response.status(400).json({
        success: false,
        message: "Title and contentType are required",
      });
      return;
    }

    // Validate contentType
    if (!["music", "videos", "books", "live"].includes(contentType)) {
      response.status(400).json({
        success: false,
        message:
          "Invalid content type. Must be 'music', 'videos', 'books', or 'live'",
      });
      return;
    }

    // Validate file presence
    if (!file || !file.buffer) {
      response.status(400).json({
        success: false,
        message: "No file uploaded",
      });
      return;
    }

    // Validate thumbnail presence
    if (!thumbnail || !thumbnail.buffer) {
      response.status(400).json({
        success: false,
        message: "No thumbnail uploaded",
      });
      return;
    }

    // Validate user authentication
    if (!request.userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    // Parse and validate topics
    let parsedTopics: string[] = [];
    if (topics) {
      try {
        parsedTopics = Array.isArray(topics) ? topics : JSON.parse(topics);
        if (!Array.isArray(parsedTopics)) {
          throw new Error("Topics must be an array");
        }
      } catch (error) {
        response.status(400).json({
          success: false,
          message: "Invalid topics format. Must be an array of strings",
        });
        return;
      }
    }

    // Validate duration (optional, only checked if provided)
    if (duration !== undefined && (isNaN(duration) || duration < 0)) {
      response.status(400).json({
        success: false,
        message: "Invalid duration. Must be a non-negative number",
      });
      return;
    }

    // Call mediaService to upload the media
    const media = await mediaService.uploadMedia({
      title,
      description,
      contentType,
      category,
      file: file.buffer,
      fileMimeType: file.mimetype,
      thumbnail: thumbnail.buffer,
      thumbnailMimeType: thumbnail.mimetype,
      uploadedBy: new Types.ObjectId(request.userId),
      topics: parsedTopics,
      duration,
    });

    // Return success response
    response.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      media: {
        ...media.toObject(),
        fileUrl: media.fileUrl,
        thumbnailUrl: media.thumbnailUrl,
      },
    });
  } catch (error: any) {
    console.error("Upload media error:", error);
    response.status(500).json({
      success: false,
      message: `Failed to upload media: ${error.message}`,
    });
  }
};

export const getAllMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const filters = request.query;
    const mediaList = await mediaService.getAllMedia(filters);

    response.status(200).json({
      success: true,
      media: mediaList.media,
      pagination: mediaList.pagination,
    });
  } catch (error: any) {
    console.error("Fetch media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve media",
    });
  }
};

export const searchMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      search,
      contentType,
      category,
      topics,
      sort,
      page,
      limit,
      creator,
      duration,
      startDate,
      endDate,
    } = request.query as SearchQueryParameters;

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

    const filters: any = {};
    if (search) filters.search = search;
    if (contentType) filters.contentType = contentType;
    if (category) filters.category = category;
    if (topics) filters.topics = topics;
    if (sort) filters.sort = sort;
    if (page) filters.page = page;
    if (limit) filters.limit = limit;
    if (creator) filters.creator = creator;
    if (duration) filters.duration = duration;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await mediaService.getAllMedia(filters);

    response.status(200).json({
      success: true,
      message: "Media search completed",
      media: result.media,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error("Search media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to search media",
    });
  }
};

export const getMediaByIdentifier = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const media = await mediaService.getMediaByIdentifier(id);
    const interactionCounts = await mediaService.getInteractionCounts(id);

    response.status(200).json({
      success: true,
      media: {
        ...media.toObject(),
        ...interactionCounts,
      },
    });
  } catch (error: any) {
    console.error("Get media by identifier error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to fetch media item",
    });
  }
};

export const getMediaStats = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const stats = await mediaService.getInteractionCounts(id);

    response.status(200).json({
      success: true,
      message: "Media stats retrieved successfully",
      stats,
    });
  } catch (error: any) {
    console.error("Get media stats error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to fetch media stats",
    });
  }
};

export const deleteMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;
    const userRole = request.userRole;

    if (!userIdentifier || !userRole) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    await mediaService.deleteMedia(id, userIdentifier, userRole);

    response.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete media error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to delete media",
    });
  }
};

export const bookmarkMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const mediaExists = await mediaService.getMediaByIdentifier(id);
    if (!mediaExists) {
      response.status(404).json({
        success: false,
        message: "Media not found",
      });
      return;
    }

    const existingBookmark = await Bookmark.findOne({
      user: new Types.ObjectId(userIdentifier),
      media: new Types.ObjectId(id),
    });

    if (existingBookmark) {
      response.status(400).json({
        success: false,
        message: "Media already saved",
      });
      return;
    }

    const bookmark = await Bookmark.create({
      user: new Types.ObjectId(userIdentifier),
      media: new Types.ObjectId(id),
    });

    response.status(200).json({
      success: true,
      message: `Saved media ${id}`,
      bookmark,
    });
  } catch (error: any) {
    console.error("Bookmark media error:", error);
    if (error.code === 11000) {
      response.status(400).json({
        success: false,
        message: "Media already saved",
      });
      return;
    }
    response.status(500).json({
      success: false,
      message: "Failed to save media",
    });
  }
};

export const recordMediaInteraction = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { interactionType } = request.body as InteractionRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    if (!["view", "listen", "read", "download"].includes(interactionType)) {
      response.status(400).json({
        success: false,
        message: "Invalid interaction type",
      });
      return;
    }

    const interaction = await mediaService.recordInteraction({
      userIdentifier,
      mediaIdentifier: id,
      interactionType,
    });

    // If interaction is a view, add to viewed media list
    if (interactionType === "view") {
      await mediaService.addToViewedMedia(userIdentifier, id);
    }

    response.status(201).json({
      success: true,
      message: `Recorded ${interactionType} for media ${id}`,
      interaction,
    });
  } catch (error: any) {
    console.error("Record media interaction error:", error);
    if (
      error.message.includes("Invalid") ||
      error.message.includes("already") ||
      error.message.includes("Media not found")
    ) {
      response.status(error.message === "Media not found" ? 404 : 400).json({
        success: false,
        message: error.message,
      });
      return;
    }
    response.status(500).json({
      success: false,
      message: "Failed to record interaction",
    });
  }
};

// New method for tracking views with duration
export const trackViewWithDuration = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { duration, isComplete } = request.body as ViewTrackingRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    if (typeof duration !== "number" || duration < 0) {
      response.status(400).json({
        success: false,
        message: "Duration must be a positive number",
      });
      return;
    }

    const result = await mediaService.trackViewWithDuration({
      userIdentifier,
      mediaIdentifier: id,
      duration,
      isComplete: isComplete || false,
    });

    response.status(200).json({
      success: true,
      message: "View tracked successfully",
      countedAsView: result.countedAsView,
      duration,
    });
  } catch (error: unknown) {
    console.error("Track view with duration error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        response.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes("Invalid") ||
        error.message.includes("required")
      ) {
        response.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    response.status(500).json({
      success: false,
      message: "Failed to track view",
    });
  }
};

// New method for downloading media
export const downloadMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { fileSize } = request.body as DownloadRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    if (typeof fileSize !== "number" || fileSize <= 0) {
      response.status(400).json({
        success: false,
        message: "File size must be a positive number",
      });
      return;
    }

    const result = await mediaService.downloadMedia({
      userIdentifier,
      mediaIdentifier: id,
      fileSize,
    });

    response.status(200).json({
      success: true,
      message: "Download recorded successfully",
      downloadUrl: result.downloadUrl,
    });
  } catch (error: unknown) {
    console.error("Download media error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        response.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (error.message.includes("not available for download")) {
        response.status(403).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes("Invalid") ||
        error.message.includes("required")
      ) {
        response.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    response.status(500).json({
      success: false,
      message: "Failed to record download",
    });
  }
};

// New method for sharing media
export const shareMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { platform } = request.body as ShareRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    const result = await mediaService.shareMedia({
      userIdentifier,
      mediaIdentifier: id,
      platform,
    });

    response.status(200).json({
      success: true,
      message: "Share recorded successfully",
      shareUrl: result.shareUrl,
    });
  } catch (error: unknown) {
    console.error("Share media error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        response.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes("Invalid") ||
        error.message.includes("required")
      ) {
        response.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    response.status(500).json({
      success: false,
      message: "Failed to record share",
    });
  }
};

export const recordUserAction = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const { actionType } = request.body as UserActionRequestBody;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
      return;
    }

    if (!["favorite", "share"].includes(actionType)) {
      response.status(400).json({
        success: false,
        message: "Invalid action type",
      });
      return;
    }

    const action = await mediaService.recordUserAction({
      userIdentifier,
      mediaIdentifier: id,
      actionType,
    });

    const isRemoved = (action as any).removed;
    const message = isRemoved
      ? `Removed ${actionType} from media ${id}`
      : `Added ${actionType} to media ${id}`;

    response.status(201).json({
      success: true,
      message,
      action: {
        ...action.toObject(),
        isRemoved,
      },
    });
  } catch (error: unknown) {
    console.error("Record user action error:", error);
    const safeActionType = request.body?.actionType || "unknown action";

    if (error instanceof Error) {
      if (error.message.includes("own content")) {
        response.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes("Invalid") ||
        error.message.includes("Media not found")
      ) {
        response.status(error.message === "Media not found" ? 404 : 400).json({
          success: false,
          message: error.message,
        });
        return;
      }
    }

    response.status(500).json({
      success: false,
      message: `Failed to record ${safeActionType}`,
    });
  }
};

export const getUserActionStatus = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const status = await mediaService.getUserActionStatus(userIdentifier, id);

    response.status(200).json({
      success: true,
      message: "User action status retrieved successfully",
      status,
    });
  } catch (error: any) {
    console.error("Get user action status error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to get user action status",
    });
  }
};

export const addToViewedMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { mediaId } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(mediaId)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const result = await mediaService.addToViewedMedia(userIdentifier, mediaId);

    response.status(201).json({
      success: true,
      message: "Added media to viewed list",
      viewedMedia: result.viewedMedia,
    });
  } catch (error: any) {
    console.error("Add to viewed media error:", error);
    response.status(error.message === "Media not found" ? 404 : 400).json({
      success: false,
      message: error.message || "Failed to add to viewed media",
    });
  }
};

export const getViewedMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const viewedMedia = await mediaService.getViewedMedia(userIdentifier);

    response.status(200).json({
      success: true,
      message: "Retrieved viewed media list",
      viewedMedia,
    });
  } catch (error: any) {
    console.error("Get viewed media error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve viewed media",
    });
  }
};

export const startMuxLiveStream = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { title, description, category, topics } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const stream = await contaboStreamingService.startLiveStream({
      title,
      description,
      category,
      topics: Array.isArray(topics)
        ? topics
        : typeof topics === "string"
          ? topics.split(",").map(t => t.trim())
          : [],
      uploadedBy: new Types.ObjectId(userIdentifier),
    });

    response.status(201).json({
      success: true,
      message: "Live stream started successfully",
      stream: {
        streamKey: stream.streamKey,
        rtmpUrl: stream.rtmpUrl,
        playbackUrl: stream.playbackUrl,
        hlsUrl: stream.hlsUrl,
        dashUrl: stream.dashUrl,
        streamId: stream.streamId,
      },
    });
  } catch (error: any) {
    console.error("Contabo live stream creation error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to start live stream",
    });
  }
};

export const endMuxLiveStream = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { id } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!Types.ObjectId.isValid(id)) {
      response.status(400).json({
        success: false,
        message: "Invalid media identifier",
      });
      return;
    }

    const stream = await Media.findById(id);

    if (!stream || !stream.isLive) {
      response.status(404).json({
        success: false,
        message: "Live stream not found",
      });
      return;
    }

    if (
      stream.uploadedBy.toString() !== userIdentifier &&
      request.userRole !== "admin"
    ) {
      response.status(403).json({
        success: false,
        message: "Unauthorized to end this live stream",
      });
      return;
    }

    await contaboStreamingService.endLiveStream(
      stream.streamId!,
      userIdentifier
    );

    response.status(200).json({
      success: true,
      message: "Live stream ended successfully",
    });
  } catch (error: any) {
    console.error("End live stream error:", error);
    response
      .status(error.message === "Live stream not found" ? 404 : 500)
      .json({
        success: false,
        message: error.message || "Failed to end live stream",
      });
  }
};

export const getLiveStreams = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const streams = await contaboStreamingService.getActiveStreams();

    response.status(200).json({
      success: true,
      streams,
    });
  } catch (error: any) {
    console.error("Get live streams error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to retrieve live streams",
    });
  }
};

// New Contabo-specific endpoints

export const getStreamStatus = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { streamId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const status = await contaboStreamingService.getStreamStatus(streamId);

    response.status(200).json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error("Get stream status error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to get stream status",
    });
  }
};

export const scheduleLiveStream = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      category,
      topics,
      scheduledStart,
      scheduledEnd,
    } = request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!scheduledStart) {
      response.status(400).json({
        success: false,
        message: "Scheduled start time is required",
      });
      return;
    }

    const stream = await contaboStreamingService.scheduleLiveStream({
      title,
      description,
      category,
      topics: Array.isArray(topics)
        ? topics
        : typeof topics === "string"
          ? topics.split(",").map(t => t.trim())
          : [],
      uploadedBy: new Types.ObjectId(userIdentifier),
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : undefined,
    });

    response.status(201).json({
      success: true,
      message: "Live stream scheduled successfully",
      stream: {
        streamKey: stream.streamKey,
        rtmpUrl: stream.rtmpUrl,
        playbackUrl: stream.playbackUrl,
        hlsUrl: stream.hlsUrl,
        dashUrl: stream.dashUrl,
        streamId: stream.streamId,
        scheduledStart,
        scheduledEnd,
      },
    });
  } catch (error: any) {
    console.error("Schedule live stream error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to schedule live stream",
    });
  }
};

export const getStreamStats = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { streamId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const stats = await contaboStreamingService.getStreamStats(streamId);

    response.status(200).json({
      success: true,
      stats,
    });
  } catch (error: any) {
    console.error("Get stream stats error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to get stream statistics",
    });
  }
};

/**
 * Start recording a live stream
 */
export const startRecording = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { streamId, streamKey, title, description, category, topics } =
      request.body;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!streamId || !streamKey || !title) {
      response.status(400).json({
        success: false,
        message: "Stream ID, stream key, and title are required",
      });
      return;
    }

    const recording = await liveRecordingService.startRecording({
      streamId,
      streamKey,
      title,
      description,
      category,
      topics: topics ? JSON.parse(topics) : [],
      uploadedBy: new Types.ObjectId(userIdentifier),
    });

    response.status(201).json({
      success: true,
      message: "Recording started successfully",
      recording,
    });
  } catch (error: any) {
    console.error("Start recording error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to start recording",
    });
  }
};

/**
 * Stop recording a live stream
 */
export const stopRecording = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { streamId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const recording = await liveRecordingService.stopRecording(
      streamId,
      userIdentifier
    );

    response.status(200).json({
      success: true,
      message: "Recording stopped successfully",
      recording,
    });
  } catch (error: any) {
    console.error("Stop recording error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to stop recording",
    });
  }
};

/**
 * Get recording status
 */
export const getRecordingStatus = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { streamId } = request.params;
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const status = await liveRecordingService.getRecordingStatus(streamId);

    response.status(200).json({
      success: true,
      status,
    });
  } catch (error: any) {
    console.error("Get recording status error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to get recording status",
    });
  }
};

/**
 * Get user's recordings
 */
export const getUserRecordings = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userIdentifier = request.userId;

    if (!userIdentifier) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const recordings =
      await liveRecordingService.getUserRecordings(userIdentifier);

    response.status(200).json({
      success: true,
      recordings,
    });
  } catch (error: any) {
    console.error("Get user recordings error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to get user recordings",
    });
  }
};
