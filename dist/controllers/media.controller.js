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
exports.getUserRecordings = exports.getRecordingStatus = exports.stopRecording = exports.startRecording = exports.getStreamStats = exports.scheduleLiveStream = exports.getStreamStatus = exports.getLiveStreams = exports.endMuxLiveStream = exports.startMuxLiveStream = exports.getViewedMedia = exports.addToViewedMedia = exports.getUserActionStatus = exports.recordUserAction = exports.shareMedia = exports.downloadMedia = exports.trackViewWithDuration = exports.recordMediaInteraction = exports.bookmarkMedia = exports.deleteMedia = exports.getMediaStats = exports.getMediaByIdentifier = exports.searchMedia = exports.getAllMedia = exports.uploadMedia = exports.getAnalyticsDashboard = void 0;
const media_service_1 = require("../service/media.service");
const bookmark_model_1 = require("../models/bookmark.model");
const mongoose_1 = require("mongoose");
const media_model_1 = require("../models/media.model");
const contaboStreaming_service_1 = __importDefault(require("../service/contaboStreaming.service"));
const liveRecording_service_1 = __importDefault(require("../service/liveRecording.service"));
const getAnalyticsDashboard = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        let analyticsData;
        if (userRole === "admin") {
            const mediaCountByContentType = yield media_service_1.mediaService.getMediaCountByContentType();
            const totalInteractionCounts = yield media_service_1.mediaService.getTotalInteractionCounts();
            const totalBookmarks = yield bookmark_model_1.Bookmark.countDocuments();
            const recentMedia = yield media_service_1.mediaService.getRecentMedia(10);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const uploadsLastThirtyDays = yield media_service_1.mediaService.getMediaCountSinceDate(thirtyDaysAgo);
            const interactionsLastThirtyDays = yield media_service_1.mediaService.getInteractionCountSinceDate(thirtyDaysAgo);
            analyticsData = {
                isAdmin: true,
                mediaCountByContentType,
                totalInteractionCounts,
                totalBookmarks,
                recentMedia,
                uploadsLastThirtyDays,
                interactionsLastThirtyDays,
            };
        }
        else {
            const userMediaCountByContentType = yield media_service_1.mediaService.getUserMediaCountByContentType(userIdentifier);
            const userInteractionCounts = yield media_service_1.mediaService.getUserInteractionCounts(userIdentifier);
            const userBookmarks = yield media_service_1.mediaService.getUserBookmarkCount(userIdentifier);
            const userRecentMedia = yield media_service_1.mediaService.getUserRecentMedia(userIdentifier, 5);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const userUploadsLastThirtyDays = yield media_service_1.mediaService.getUserMediaCountSinceDate(userIdentifier, thirtyDaysAgo);
            const userInteractionsLastThirtyDays = yield media_service_1.mediaService.getUserInteractionCountSinceDate(userIdentifier, thirtyDaysAgo);
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
    }
    catch (error) {
        console.error("Analytics error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to fetch analytics",
        });
    }
});
exports.getAnalyticsDashboard = getAnalyticsDashboard;
const uploadMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { title, description, contentType, category, topics, duration } = request.body;
        // Type assertion for Multer files from upload.fields
        const files = request.files;
        // Check if files object exists
        if (!files) {
            console.log("No files received in request");
            response.status(400).json({
                success: false,
                message: "No files uploaded",
            });
            return;
        }
        const file = (_a = files === null || files === void 0 ? void 0 : files.file) === null || _a === void 0 ? void 0 : _a[0]; // Access the first file in the 'file' field
        const thumbnail = (_b = files === null || files === void 0 ? void 0 : files.thumbnail) === null || _b === void 0 ? void 0 : _b[0]; // Access the first file in the 'thumbnail' field
        // Detailed logging for debugging
        console.log("Request Files:", {
            fileExists: !!file,
            fileBufferExists: !!(file === null || file === void 0 ? void 0 : file.buffer),
            fileMimetype: file === null || file === void 0 ? void 0 : file.mimetype,
            fileOriginalname: file === null || file === void 0 ? void 0 : file.originalname,
            fileSize: file === null || file === void 0 ? void 0 : file.size,
            thumbnailExists: !!thumbnail,
            thumbnailBufferExists: !!(thumbnail === null || thumbnail === void 0 ? void 0 : thumbnail.buffer),
            thumbnailMimetype: thumbnail === null || thumbnail === void 0 ? void 0 : thumbnail.mimetype,
            thumbnailOriginalname: thumbnail === null || thumbnail === void 0 ? void 0 : thumbnail.originalname,
            thumbnailSize: thumbnail === null || thumbnail === void 0 ? void 0 : thumbnail.size,
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
                message: "Invalid content type. Must be 'music', 'videos', 'books', or 'live'",
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
        let parsedTopics = [];
        if (topics) {
            try {
                parsedTopics = Array.isArray(topics) ? topics : JSON.parse(topics);
                if (!Array.isArray(parsedTopics)) {
                    throw new Error("Topics must be an array");
                }
            }
            catch (error) {
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
        const media = yield media_service_1.mediaService.uploadMedia({
            title,
            description,
            contentType,
            category,
            file: file.buffer,
            fileMimeType: file.mimetype,
            thumbnail: thumbnail.buffer,
            thumbnailMimeType: thumbnail.mimetype,
            uploadedBy: new mongoose_1.Types.ObjectId(request.userId),
            topics: parsedTopics,
            duration,
        });
        // Return success response
        response.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            media: Object.assign(Object.assign({}, media.toObject()), { fileUrl: media.fileUrl, thumbnailUrl: media.thumbnailUrl }),
        });
    }
    catch (error) {
        console.error("Upload media error:", error);
        response.status(500).json({
            success: false,
            message: `Failed to upload media: ${error.message}`,
        });
    }
});
exports.uploadMedia = uploadMedia;
const getAllMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const filters = request.query;
        const mediaList = yield media_service_1.mediaService.getAllMedia(filters);
        response.status(200).json({
            success: true,
            media: mediaList.media,
            pagination: mediaList.pagination,
        });
    }
    catch (error) {
        console.error("Fetch media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve media",
        });
    }
});
exports.getAllMedia = getAllMedia;
const searchMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search, contentType, category, topics, sort, page, limit, creator, duration, startDate, endDate, } = request.query;
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
        const filters = {};
        if (search)
            filters.search = search;
        if (contentType)
            filters.contentType = contentType;
        if (category)
            filters.category = category;
        if (topics)
            filters.topics = topics;
        if (sort)
            filters.sort = sort;
        if (page)
            filters.page = page;
        if (limit)
            filters.limit = limit;
        if (creator)
            filters.creator = creator;
        if (duration)
            filters.duration = duration;
        if (startDate)
            filters.startDate = startDate;
        if (endDate)
            filters.endDate = endDate;
        const result = yield media_service_1.mediaService.getAllMedia(filters);
        response.status(200).json({
            success: true,
            message: "Media search completed",
            media: result.media,
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("Search media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to search media",
        });
    }
});
exports.searchMedia = searchMedia;
const getMediaByIdentifier = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const media = yield media_service_1.mediaService.getMediaByIdentifier(id);
        const interactionCounts = yield media_service_1.mediaService.getInteractionCounts(id);
        response.status(200).json({
            success: true,
            media: Object.assign(Object.assign({}, media.toObject()), interactionCounts),
        });
    }
    catch (error) {
        console.error("Get media by identifier error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to fetch media item",
        });
    }
});
exports.getMediaByIdentifier = getMediaByIdentifier;
const getMediaStats = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const stats = yield media_service_1.mediaService.getInteractionCounts(id);
        response.status(200).json({
            success: true,
            message: "Media stats retrieved successfully",
            stats,
        });
    }
    catch (error) {
        console.error("Get media stats error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to fetch media stats",
        });
    }
});
exports.getMediaStats = getMediaStats;
const deleteMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        yield media_service_1.mediaService.deleteMedia(id, userIdentifier, userRole);
        response.status(200).json({
            success: true,
            message: "Media deleted successfully",
        });
    }
    catch (error) {
        console.error("Delete media error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to delete media",
        });
    }
});
exports.deleteMedia = deleteMedia;
const bookmarkMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const mediaExists = yield media_service_1.mediaService.getMediaByIdentifier(id);
        if (!mediaExists) {
            response.status(404).json({
                success: false,
                message: "Media not found",
            });
            return;
        }
        const existingBookmark = yield bookmark_model_1.Bookmark.findOne({
            user: new mongoose_1.Types.ObjectId(userIdentifier),
            media: new mongoose_1.Types.ObjectId(id),
        });
        if (existingBookmark) {
            response.status(400).json({
                success: false,
                message: "Media already saved",
            });
            return;
        }
        const bookmark = yield bookmark_model_1.Bookmark.create({
            user: new mongoose_1.Types.ObjectId(userIdentifier),
            media: new mongoose_1.Types.ObjectId(id),
        });
        response.status(200).json({
            success: true,
            message: `Saved media ${id}`,
            bookmark,
        });
    }
    catch (error) {
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
});
exports.bookmarkMedia = bookmarkMedia;
const recordMediaInteraction = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { interactionType } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
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
        const interaction = yield media_service_1.mediaService.recordInteraction({
            userIdentifier,
            mediaIdentifier: id,
            interactionType,
        });
        // If interaction is a view, add to viewed media list
        if (interactionType === "view") {
            yield media_service_1.mediaService.addToViewedMedia(userIdentifier, id);
        }
        response.status(201).json({
            success: true,
            message: `Recorded ${interactionType} for media ${id}`,
            interaction,
        });
    }
    catch (error) {
        console.error("Record media interaction error:", error);
        if (error.message.includes("Invalid") ||
            error.message.includes("already") ||
            error.message.includes("Media not found")) {
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
});
exports.recordMediaInteraction = recordMediaInteraction;
// New method for tracking views with duration
const trackViewWithDuration = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { duration, isComplete } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
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
        const result = yield media_service_1.mediaService.trackViewWithDuration({
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
    }
    catch (error) {
        console.error("Track view with duration error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("Invalid") ||
                error.message.includes("required")) {
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
});
exports.trackViewWithDuration = trackViewWithDuration;
// New method for downloading media
const downloadMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { fileSize } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
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
        const result = yield media_service_1.mediaService.downloadMedia({
            userIdentifier,
            mediaIdentifier: id,
            fileSize,
        });
        response.status(200).json({
            success: true,
            message: "Download recorded successfully",
            downloadUrl: result.downloadUrl,
        });
    }
    catch (error) {
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
            if (error.message.includes("Invalid") ||
                error.message.includes("required")) {
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
});
exports.downloadMedia = downloadMedia;
// New method for sharing media
const shareMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const { platform } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media ID",
            });
            return;
        }
        const result = yield media_service_1.mediaService.shareMedia({
            userIdentifier,
            mediaIdentifier: id,
            platform,
        });
        response.status(200).json({
            success: true,
            message: "Share recorded successfully",
            shareUrl: result.shareUrl,
        });
    }
    catch (error) {
        console.error("Share media error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("Invalid") ||
                error.message.includes("required")) {
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
});
exports.shareMedia = shareMedia;
const recordUserAction = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = request.params;
        const { actionType } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!id || !mongoose_1.Types.ObjectId.isValid(id)) {
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
        const action = yield media_service_1.mediaService.recordUserAction({
            userIdentifier,
            mediaIdentifier: id,
            actionType,
        });
        const isRemoved = action.removed;
        const message = isRemoved
            ? `Removed ${actionType} from media ${id}`
            : `Added ${actionType} to media ${id}`;
        response.status(201).json({
            success: true,
            message,
            action: Object.assign(Object.assign({}, action.toObject()), { isRemoved }),
        });
    }
    catch (error) {
        console.error("Record user action error:", error);
        const safeActionType = ((_a = request.body) === null || _a === void 0 ? void 0 : _a.actionType) || "unknown action";
        if (error instanceof Error) {
            if (error.message.includes("own content")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("Invalid") ||
                error.message.includes("Media not found")) {
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
});
exports.recordUserAction = recordUserAction;
const getUserActionStatus = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const status = yield media_service_1.mediaService.getUserActionStatus(userIdentifier, id);
        response.status(200).json({
            success: true,
            message: "User action status retrieved successfully",
            status,
        });
    }
    catch (error) {
        console.error("Get user action status error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to get user action status",
        });
    }
});
exports.getUserActionStatus = getUserActionStatus;
const addToViewedMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.Types.ObjectId.isValid(mediaId)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const result = yield media_service_1.mediaService.addToViewedMedia(userIdentifier, mediaId);
        response.status(201).json({
            success: true,
            message: "Added media to viewed list",
            viewedMedia: result.viewedMedia,
        });
    }
    catch (error) {
        console.error("Add to viewed media error:", error);
        response.status(error.message === "Media not found" ? 404 : 400).json({
            success: false,
            message: error.message || "Failed to add to viewed media",
        });
    }
});
exports.addToViewedMedia = addToViewedMedia;
const getViewedMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const viewedMedia = yield media_service_1.mediaService.getViewedMedia(userIdentifier);
        response.status(200).json({
            success: true,
            message: "Retrieved viewed media list",
            viewedMedia,
        });
    }
    catch (error) {
        console.error("Get viewed media error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve viewed media",
        });
    }
});
exports.getViewedMedia = getViewedMedia;
const startMuxLiveStream = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const stream = yield contaboStreaming_service_1.default.startLiveStream({
            title,
            description,
            category,
            topics: Array.isArray(topics)
                ? topics
                : typeof topics === "string"
                    ? topics.split(",").map(t => t.trim())
                    : [],
            uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
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
    }
    catch (error) {
        console.error("Contabo live stream creation error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to start live stream",
        });
    }
});
exports.startMuxLiveStream = startMuxLiveStream;
const endMuxLiveStream = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid media identifier",
            });
            return;
        }
        const stream = yield media_model_1.Media.findById(id);
        if (!stream || !stream.isLive) {
            response.status(404).json({
                success: false,
                message: "Live stream not found",
            });
            return;
        }
        if (stream.uploadedBy.toString() !== userIdentifier &&
            request.userRole !== "admin") {
            response.status(403).json({
                success: false,
                message: "Unauthorized to end this live stream",
            });
            return;
        }
        yield contaboStreaming_service_1.default.endLiveStream(stream.streamId, userIdentifier);
        response.status(200).json({
            success: true,
            message: "Live stream ended successfully",
        });
    }
    catch (error) {
        console.error("End live stream error:", error);
        response
            .status(error.message === "Live stream not found" ? 404 : 500)
            .json({
            success: false,
            message: error.message || "Failed to end live stream",
        });
    }
});
exports.endMuxLiveStream = endMuxLiveStream;
const getLiveStreams = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const streams = yield contaboStreaming_service_1.default.getActiveStreams();
        response.status(200).json({
            success: true,
            streams,
        });
    }
    catch (error) {
        console.error("Get live streams error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve live streams",
        });
    }
});
exports.getLiveStreams = getLiveStreams;
// New Contabo-specific endpoints
const getStreamStatus = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const status = yield contaboStreaming_service_1.default.getStreamStatus(streamId);
        response.status(200).json({
            success: true,
            status,
        });
    }
    catch (error) {
        console.error("Get stream status error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get stream status",
        });
    }
});
exports.getStreamStatus = getStreamStatus;
const scheduleLiveStream = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, category, topics, scheduledStart, scheduledEnd, } = request.body;
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
        const stream = yield contaboStreaming_service_1.default.scheduleLiveStream({
            title,
            description,
            category,
            topics: Array.isArray(topics)
                ? topics
                : typeof topics === "string"
                    ? topics.split(",").map(t => t.trim())
                    : [],
            uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
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
    }
    catch (error) {
        console.error("Schedule live stream error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to schedule live stream",
        });
    }
});
exports.scheduleLiveStream = scheduleLiveStream;
const getStreamStats = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const stats = yield contaboStreaming_service_1.default.getStreamStats(streamId);
        response.status(200).json({
            success: true,
            stats,
        });
    }
    catch (error) {
        console.error("Get stream stats error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get stream statistics",
        });
    }
});
exports.getStreamStats = getStreamStats;
/**
 * Start recording a live stream
 */
const startRecording = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { streamId, streamKey, title, description, category, topics } = request.body;
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
        const recording = yield liveRecording_service_1.default.startRecording({
            streamId,
            streamKey,
            title,
            description,
            category,
            topics: topics ? JSON.parse(topics) : [],
            uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
        });
        response.status(201).json({
            success: true,
            message: "Recording started successfully",
            recording,
        });
    }
    catch (error) {
        console.error("Start recording error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to start recording",
        });
    }
});
exports.startRecording = startRecording;
/**
 * Stop recording a live stream
 */
const stopRecording = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const recording = yield liveRecording_service_1.default.stopRecording(streamId, userIdentifier);
        response.status(200).json({
            success: true,
            message: "Recording stopped successfully",
            recording,
        });
    }
    catch (error) {
        console.error("Stop recording error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to stop recording",
        });
    }
});
exports.stopRecording = stopRecording;
/**
 * Get recording status
 */
const getRecordingStatus = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
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
        const status = yield liveRecording_service_1.default.getRecordingStatus(streamId);
        response.status(200).json({
            success: true,
            status,
        });
    }
    catch (error) {
        console.error("Get recording status error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get recording status",
        });
    }
});
exports.getRecordingStatus = getRecordingStatus;
/**
 * Get user's recordings
 */
const getUserRecordings = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const recordings = yield liveRecording_service_1.default.getUserRecordings(userIdentifier);
        response.status(200).json({
            success: true,
            recordings,
        });
    }
    catch (error) {
        console.error("Get user recordings error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get user recordings",
        });
    }
});
exports.getUserRecordings = getUserRecordings;
