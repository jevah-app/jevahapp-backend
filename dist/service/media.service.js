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
exports.mediaService = exports.MediaService = void 0;
const media_model_1 = require("../models/media.model");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const bookmark_model_1 = require("../models/bookmark.model");
const user_model_1 = require("../models/user.model");
const userViewedMedia_model_1 = require("../models/userViewedMedia.model");
const mediaUserAction_model_1 = require("../models/mediaUserAction.model");
const mongoose_1 = require("mongoose");
const fileUpload_service_1 = __importDefault(require("./fileUpload.service"));
const email_config_1 = require("../config/email.config");
class MediaService {
    uploadMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const validMimeTypes = {
                videos: [
                    "video/mp4",
                    "video/webm",
                    "video/ogg",
                    "video/avi",
                    "video/mov",
                ],
                music: [
                    "audio/mpeg",
                    "audio/mp3",
                    "audio/wav",
                    "audio/ogg",
                    "audio/aac",
                    "audio/flac",
                ],
                books: ["application/pdf", "application/epub+zip"],
                live: [],
            };
            const validThumbnailMimeTypes = [
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/jpg",
            ];
            if (!["music", "videos", "books", "live"].includes(data.contentType)) {
                throw new Error(`Invalid content type: ${data.contentType}. Must be 'music', 'videos', 'books', or 'live'`);
            }
            if (data.contentType !== "live") {
                if (!data.file || !data.fileMimeType) {
                    throw new Error(`File and file MIME type are required for ${data.contentType} content type`);
                }
                if (!validMimeTypes[data.contentType].includes(data.fileMimeType)) {
                    throw new Error(`Invalid file MIME type for ${data.contentType}: ${data.fileMimeType}`);
                }
                if (!data.thumbnail || !data.thumbnailMimeType) {
                    throw new Error(`Thumbnail and thumbnail MIME type are required for ${data.contentType} content type`);
                }
                if (!validThumbnailMimeTypes.includes(data.thumbnailMimeType)) {
                    throw new Error(`Invalid thumbnail MIME type: ${data.thumbnailMimeType}. Must be JPEG, PNG, or WebP`);
                }
                if (data.thumbnail.length > 5 * 1024 * 1024) {
                    throw new Error("Thumbnail size must be less than 5MB");
                }
            }
            let fileUrl;
            let thumbnailUrl;
            let fileObjectKey;
            let thumbnailObjectKey;
            try {
                if (data.contentType !== "live" && data.file && data.fileMimeType) {
                    const uploadResult = yield fileUpload_service_1.default.uploadMedia(data.file, `media-${data.contentType}`, data.fileMimeType);
                    fileUrl = uploadResult.secure_url;
                    fileObjectKey = uploadResult.objectKey;
                }
                if (data.contentType !== "live" &&
                    data.thumbnail &&
                    data.thumbnailMimeType) {
                    const thumbnailResult = yield fileUpload_service_1.default.uploadMedia(data.thumbnail, "media-thumbnails", data.thumbnailMimeType);
                    thumbnailUrl = thumbnailResult.secure_url;
                    thumbnailObjectKey = thumbnailResult.objectKey;
                }
                const uploader = yield user_model_1.User.findById(data.uploadedBy);
                if (!uploader) {
                    throw new Error("Uploader not found");
                }
                const isArtist = uploader.role === "artist" && uploader.isVerifiedArtist;
                const isDownloadable = data.isDownloadable && isArtist;
                const shareUrl = `${process.env.FRONTEND_URL || "https://example.com"}/media/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                let downloadUrl;
                if (isDownloadable && fileUrl) {
                    downloadUrl = `${process.env.API_URL || "https://api.example.com"}/media/download/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                }
                const mediaData = {
                    title: data.title,
                    description: data.description,
                    contentType: data.contentType,
                    category: data.category,
                    fileUrl,
                    fileMimeType: data.fileMimeType,
                    fileObjectKey,
                    thumbnailUrl,
                    thumbnailObjectKey,
                    topics: data.topics,
                    uploadedBy: new mongoose_1.Types.ObjectId(data.uploadedBy),
                    duration: data.duration,
                    isLive: data.isLive || false,
                    liveStreamStatus: data.liveStreamStatus,
                    streamKey: data.streamKey,
                    rtmpUrl: data.rtmpUrl,
                    playbackUrl: data.playbackUrl,
                    isDownloadable,
                    downloadUrl,
                    shareUrl,
                    viewThreshold: data.viewThreshold || 30,
                };
                const media = yield media_model_1.Media.create(mediaData);
                return media;
            }
            catch (error) {
                if (fileObjectKey) {
                    try {
                        yield fileUpload_service_1.default.deleteMedia(fileObjectKey);
                    }
                    catch (deleteError) {
                        console.error("Failed to delete uploaded file from R2:", deleteError);
                    }
                }
                if (thumbnailObjectKey) {
                    try {
                        yield fileUpload_service_1.default.deleteMedia(thumbnailObjectKey);
                    }
                    catch (deleteError) {
                        console.error("Failed to delete uploaded thumbnail from R2:", deleteError);
                    }
                }
                throw error;
            }
        });
    }
    getAllMedia() {
        return __awaiter(this, arguments, void 0, function* (filters = {}) {
            const query = {};
            if (filters.search) {
                query.title = { $regex: filters.search, $options: "i" };
            }
            if (filters.contentType) {
                query.contentType = filters.contentType;
            }
            if (filters.category) {
                query.category = { $regex: filters.category, $options: "i" };
            }
            if (filters.topics) {
                const topicsArray = Array.isArray(filters.topics)
                    ? filters.topics
                    : filters.topics.split(",");
                query.topics = {
                    $in: topicsArray.map((topic) => new RegExp(topic, "i")),
                };
            }
            if (filters.creator) {
                const user = yield user_model_1.User.findOne({ username: filters.creator });
                if (user) {
                    query.uploadedBy = user._id;
                }
                else {
                    query.uploadedBy = null;
                }
            }
            const durationRanges = {
                short: { $lte: 5 * 60 },
                medium: { $gte: 5 * 60, $lte: 15 * 60 },
                long: { $gt: 15 * 60 },
            };
            if (filters.duration) {
                const durationKey = filters.duration;
                if (durationRanges[durationKey]) {
                    query.duration = durationRanges[durationKey];
                }
            }
            if (filters.startDate || filters.endDate) {
                query.createdAt = {};
                if (filters.startDate) {
                    query.createdAt.$gte = new Date(filters.startDate);
                }
                if (filters.endDate) {
                    query.createdAt.$lte = new Date(filters.endDate);
                }
            }
            let sort = filters.sort || "-createdAt";
            if (filters.sort === "trending") {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                query.createdAt = { $gte: sevenDaysAgo };
                sort = "-viewCount -listenCount -readCount";
            }
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;
            const mediaList = yield media_model_1.Media.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("uploadedBy", "firstName lastName avatar")
                .lean();
            const total = yield media_model_1.Media.countDocuments(query);
            return {
                media: mediaList,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            };
        });
    }
    getMediaByIdentifier(mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier)
                .select("title contentType category fileUrl thumbnailUrl topics uploadedBy duration createdAt updatedAt isDownloadable downloadUrl shareUrl viewThreshold")
                .populate("uploadedBy", "firstName lastName avatar");
            if (!media) {
                throw new Error("Media not found");
            }
            return media;
        });
    }
    deleteMedia(mediaIdentifier, userIdentifier, userRole) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            if (media.uploadedBy.toString() !== userIdentifier &&
                userRole !== "admin") {
                throw new Error("Unauthorized to delete this media");
            }
            if (media.fileObjectKey) {
                try {
                    yield fileUpload_service_1.default.deleteMedia(media.fileObjectKey);
                }
                catch (error) {
                    console.error("Error deleting media file from R2:", error);
                }
            }
            if (media.thumbnailObjectKey) {
                try {
                    yield fileUpload_service_1.default.deleteMedia(media.thumbnailObjectKey);
                }
                catch (error) {
                    console.error("Error deleting thumbnail file from R2:", error);
                }
            }
            yield media_model_1.Media.findByIdAndDelete(mediaIdentifier);
            return true;
        });
    }
    recordInteraction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userIdentifier) ||
                !mongoose_1.Types.ObjectId.isValid(data.mediaIdentifier)) {
                throw new Error("Invalid user or media identifier");
            }
            const media = yield media_model_1.Media.findById(data.mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            if ((media.contentType === "videos" && data.interactionType !== "view") ||
                (media.contentType === "music" && data.interactionType !== "listen") ||
                (media.contentType === "books" &&
                    !["read", "download"].includes(data.interactionType))) {
                throw new Error(`Invalid interaction type ${data.interactionType} for ${media.contentType} media`);
            }
            const session = yield media_model_1.Media.startSession();
            try {
                const interaction = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const existingInteraction = yield mediaInteraction_model_1.MediaInteraction.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                        media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                        interactionType: data.interactionType,
                    }).session(session);
                    if (existingInteraction) {
                        throw new Error(`User has already ${data.interactionType} this media`);
                    }
                    const interaction = yield mediaInteraction_model_1.MediaInteraction.create([
                        {
                            user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                            media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                            interactionType: data.interactionType,
                            lastInteraction: new Date(),
                            count: 1,
                            interactions: data.duration
                                ? [
                                    {
                                        timestamp: new Date(),
                                        duration: data.duration,
                                        isComplete: false,
                                    },
                                ]
                                : [],
                        },
                    ], { session });
                    const updateField = {};
                    if (data.interactionType === "view")
                        updateField.viewCount = 1;
                    if (data.interactionType === "listen")
                        updateField.listenCount = 1;
                    if (data.interactionType === "read")
                        updateField.readCount = 1;
                    if (data.interactionType === "download")
                        updateField.downloadCount = 1;
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaIdentifier, { $inc: updateField }, { session });
                    return interaction[0];
                }));
                return interaction;
            }
            finally {
                session.endSession();
            }
        });
    }
    getInteractionCounts(mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier).select("contentType viewCount listenCount readCount downloadCount favoriteCount shareCount");
            if (!media) {
                throw new Error("Media not found");
            }
            const result = {};
            if (media.contentType === "videos")
                result.viewCount = media.viewCount;
            if (media.contentType === "music")
                result.listenCount = media.listenCount;
            if (media.contentType === "books") {
                result.readCount = media.readCount;
                result.downloadCount = media.downloadCount;
            }
            result.favoriteCount = media.favoriteCount;
            result.shareCount = media.shareCount;
            return result;
        });
    }
    recordUserAction(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data.userIdentifier || !data.mediaIdentifier || !data.actionType) {
                throw new Error("User identifier, media identifier, and action type are required");
            }
            if (!["favorite", "share"].includes(data.actionType)) {
                throw new Error("Invalid action type. Must be 'favorite' or 'share'");
            }
            const media = yield media_model_1.Media.findById(data.mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            const user = yield user_model_1.User.findById(data.userIdentifier);
            if (!user) {
                throw new Error("User not found");
            }
            if (media.uploadedBy.toString() === data.userIdentifier) {
                throw new Error("You cannot favorite or share your own content");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                const action = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const existingAction = yield mediaUserAction_model_1.MediaUserAction.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                        media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                        actionType: data.actionType,
                    }).session(session);
                    let resultAction;
                    const updateField = {};
                    if (existingAction) {
                        yield mediaUserAction_model_1.MediaUserAction.findByIdAndDelete(existingAction._id).session(session);
                        if (data.actionType === "favorite")
                            updateField.favoriteCount = -1;
                        if (data.actionType === "share")
                            updateField.shareCount = -1;
                        resultAction = Object.assign(Object.assign({}, existingAction.toObject()), { _id: existingAction._id, removed: true });
                    }
                    else {
                        const newAction = yield mediaUserAction_model_1.MediaUserAction.create([
                            {
                                user: new mongoose_1.Types.ObjectId(data.userIdentifier),
                                media: new mongoose_1.Types.ObjectId(data.mediaIdentifier),
                                actionType: data.actionType,
                                createdAt: new Date(),
                            },
                        ], { session });
                        if (data.actionType === "favorite")
                            updateField.favoriteCount = 1;
                        if (data.actionType === "share")
                            updateField.shareCount = 1;
                        resultAction = newAction[0];
                    }
                    yield media_model_1.Media.findByIdAndUpdate(data.mediaIdentifier, { $inc: updateField }, { session });
                    if (data.actionType === "favorite" && !resultAction.removed) {
                        try {
                            const artist = yield user_model_1.User.findById(media.uploadedBy);
                            if (artist &&
                                artist.email &&
                                ((_a = artist.emailNotifications) === null || _a === void 0 ? void 0 : _a.mediaLikes)) {
                                yield email_config_1.EmailService.sendMediaLikedEmail(artist.email, media.title, artist.firstName || ((_b = artist.artistProfile) === null || _b === void 0 ? void 0 : _b.artistName) || "Artist");
                            }
                        }
                        catch (emailError) {
                            console.error("Failed to send like notification email:", emailError);
                        }
                    }
                    return resultAction;
                }));
                return action;
            }
            finally {
                session.endSession();
            }
        });
    }
    getUserActionStatus(userIdentifier, mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier) ||
                !mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid user or media identifier");
            }
            const actions = yield mediaUserAction_model_1.MediaUserAction.find({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
                media: new mongoose_1.Types.ObjectId(mediaIdentifier),
            }).select("actionType");
            const status = { isFavorited: false, isShared: false };
            actions.forEach((action) => {
                if (action.actionType === "favorite")
                    status.isFavorited = true;
                if (action.actionType === "share")
                    status.isShared = true;
            });
            return status;
        });
    }
    addToViewedMedia(userIdentifier, mediaIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier) ||
                !mongoose_1.Types.ObjectId.isValid(mediaIdentifier)) {
                throw new Error("Invalid user or media identifier");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            const session = yield userViewedMedia_model_1.UserViewedMedia.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const update = yield userViewedMedia_model_1.UserViewedMedia.findOneAndUpdate({ user: new mongoose_1.Types.ObjectId(userIdentifier) }, {
                        $push: {
                            viewedMedia: {
                                $each: [
                                    {
                                        media: new mongoose_1.Types.ObjectId(mediaIdentifier),
                                        viewedAt: new Date(),
                                    },
                                ],
                                $slice: -50,
                            },
                        },
                    }, { upsert: true, new: true, session });
                    return update;
                }));
                return result;
            }
            finally {
                session.endSession();
            }
        });
    }
    getViewedMedia(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            const viewedMedia = yield userViewedMedia_model_1.UserViewedMedia.findOne({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
            })
                .populate({
                path: "viewedMedia.media",
                select: "title contentType category createdAt thumbnailUrl fileUrl topics duration uploadedBy",
                populate: { path: "uploadedBy", select: "firstName lastName avatar" },
            })
                .lean();
            return viewedMedia ? viewedMedia.viewedMedia : [];
        });
    }
    getMediaCountByContentType() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield media_model_1.Media.aggregate([
                { $group: { _id: "$contentType", count: { $sum: 1 } } },
                { $project: { contentType: "$_id", count: 1, _id: 0 } },
            ]);
            const counts = {
                music: 0,
                videos: 0,
                books: 0,
                live: 0,
            };
            result.forEach((item) => {
                counts[item.contentType] = item.count;
            });
            return counts;
        });
    }
    getTotalInteractionCounts() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const result = yield media_model_1.Media.aggregate([
                {
                    $group: {
                        _id: null,
                        totalViews: { $sum: "$viewCount" },
                        totalListens: { $sum: "$listenCount" },
                        totalReads: { $sum: "$readCount" },
                        totalDownloads: { $sum: "$downloadCount" },
                        totalFavorites: { $sum: "$favoriteCount" },
                        totalShares: { $sum: "$shareCount" },
                    },
                },
            ]);
            return {
                totalViews: ((_a = result[0]) === null || _a === void 0 ? void 0 : _a.totalViews) || 0,
                totalListens: ((_b = result[0]) === null || _b === void 0 ? void 0 : _b.totalListens) || 0,
                totalReads: ((_c = result[0]) === null || _c === void 0 ? void 0 : _c.totalReads) || 0,
                totalDownloads: ((_d = result[0]) === null || _d === void 0 ? void 0 : _d.totalDownloads) || 0,
                totalFavorites: ((_e = result[0]) === null || _e === void 0 ? void 0 : _e.totalFavorites) || 0,
                totalShares: ((_f = result[0]) === null || _f === void 0 ? void 0 : _f.totalShares) || 0,
            };
        });
    }
    getRecentMedia(limit) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title contentType category createdAt thumbnailUrl fileUrl duration")
                .populate("uploadedBy", "firstName lastName avatar")
                .lean();
        });
    }
    getMediaCountSinceDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield media_model_1.Media.countDocuments({ createdAt: { $gte: since } });
        });
    }
    getInteractionCountSinceDate(since) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                createdAt: { $gte: since },
            });
        });
    }
    getUserMediaCountByContentType(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            const result = yield media_model_1.Media.aggregate([
                { $match: { uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier) } },
                { $group: { _id: "$contentType", count: { $sum: 1 } } },
                { $project: { contentType: "$_id", count: 1, _id: 0 } },
            ]);
            const counts = {
                music: 0,
                videos: 0,
                books: 0,
                live: 0,
            };
            result.forEach((item) => {
                counts[item.contentType] = item.count;
            });
            return counts;
        });
    }
    getUserInteractionCounts(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            const result = yield mediaInteraction_model_1.MediaInteraction.aggregate([
                { $match: { user: new mongoose_1.Types.ObjectId(userIdentifier) } },
                { $group: { _id: "$interactionType", count: { $sum: "$count" } } },
                { $project: { interactionType: "$_id", count: 1, _id: 0 } },
            ]);
            const counts = {
                totalViews: 0,
                totalListens: 0,
                totalReads: 0,
                totalDownloads: 0,
            };
            result.forEach((item) => {
                if (item.interactionType === "view")
                    counts.totalViews = item.count;
                if (item.interactionType === "listen")
                    counts.totalListens = item.count;
                if (item.interactionType === "read")
                    counts.totalReads = item.count;
                if (item.interactionType === "download")
                    counts.totalDownloads = item.count;
            });
            return counts;
        });
    }
    getUserBookmarkCount(userIdentifier) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield bookmark_model_1.Bookmark.countDocuments({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
            });
        });
    }
    getUserRecentMedia(userIdentifier, limit) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield media_model_1.Media.find({ uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier) })
                .sort({ createdAt: -1 })
                .limit(limit)
                .select("title contentType category createdAt thumbnailUrl fileUrl duration")
                .populate("uploadedBy", "firstName lastName avatar")
                .lean();
        });
    }
    getUserMediaCountSinceDate(userIdentifier, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield media_model_1.Media.countDocuments({
                uploadedBy: new mongoose_1.Types.ObjectId(userIdentifier),
                createdAt: { $gte: since },
            });
        });
    }
    getUserInteractionCountSinceDate(userIdentifier, since) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userIdentifier)) {
                throw new Error("Invalid user identifier");
            }
            return yield mediaInteraction_model_1.MediaInteraction.countDocuments({
                user: new mongoose_1.Types.ObjectId(userIdentifier),
                createdAt: { $gte: since },
            });
        });
    }
    trackViewWithDuration(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userIdentifier, mediaIdentifier, duration, isComplete = false, } = data;
            if (!userIdentifier || !mediaIdentifier) {
                throw new Error("User identifier and media identifier are required");
            }
            if (duration < 0) {
                throw new Error("Duration must be a positive number");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            const user = yield user_model_1.User.findById(userIdentifier);
            if (!user) {
                throw new Error("User not found");
            }
            let shouldCountAsView = false;
            const session = yield media_model_1.Media.startSession();
            try {
                const result = yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    const viewThreshold = media.viewThreshold || 30;
                    shouldCountAsView = duration >= viewThreshold;
                    if (shouldCountAsView) {
                        yield media_model_1.Media.findByIdAndUpdate(mediaIdentifier, { $inc: { viewCount: 1 } }, { session });
                        yield mediaInteraction_model_1.MediaInteraction.findOneAndUpdate({
                            user: new mongoose_1.Types.ObjectId(userIdentifier),
                            media: new mongoose_1.Types.ObjectId(mediaIdentifier),
                            interactionType: "view",
                        }, {
                            $inc: { count: 1 },
                            $set: { lastInteraction: new Date() },
                            $push: {
                                interactions: {
                                    timestamp: new Date(),
                                    duration,
                                    isComplete,
                                },
                            },
                        }, { upsert: true, session });
                        yield this.addToViewedMedia(userIdentifier, mediaIdentifier);
                        if (media.uploadedBy.toString() !== userIdentifier) {
                            try {
                                const artist = yield user_model_1.User.findById(media.uploadedBy);
                                if (artist &&
                                    artist.email &&
                                    ((_a = artist.emailNotifications) === null || _a === void 0 ? void 0 : _a.mediaLikes)) {
                                    yield email_config_1.EmailService.sendMediaLikedEmail(artist.email, media.title, artist.firstName ||
                                        ((_b = artist.artistProfile) === null || _b === void 0 ? void 0 : _b.artistName) ||
                                        "Artist");
                                }
                            }
                            catch (emailError) {
                                console.error("Failed to send view notification email:", emailError);
                            }
                        }
                    }
                    return { success: true, countedAsView: shouldCountAsView };
                }));
                return result;
            }
            finally {
                session.endSession();
            }
        });
    }
    downloadMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userIdentifier, mediaIdentifier, fileSize } = data;
            if (!userIdentifier || !mediaIdentifier) {
                throw new Error("User identifier and media identifier are required");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            if (!media.isDownloadable) {
                throw new Error("This media is not available for download");
            }
            const user = yield user_model_1.User.findById(userIdentifier);
            if (!user) {
                throw new Error("User not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield media_model_1.Media.findByIdAndUpdate(mediaIdentifier, { $inc: { downloadCount: 1 } }, { session });
                    yield mediaInteraction_model_1.MediaInteraction.findOneAndUpdate({
                        user: new mongoose_1.Types.ObjectId(userIdentifier),
                        media: new mongoose_1.Types.ObjectId(mediaIdentifier),
                        interactionType: "download",
                    }, {
                        $inc: { count: 1 },
                        $set: { lastInteraction: new Date() },
                        $push: {
                            interactions: {
                                timestamp: new Date(),
                                fileSize,
                            },
                        },
                    }, { upsert: true, session });
                    yield user_model_1.User.findByIdAndUpdate(userIdentifier, {
                        $push: {
                            offlineDownloads: {
                                mediaId: new mongoose_1.Types.ObjectId(mediaIdentifier),
                                mediaTitle: media.title,
                                mediaType: media.contentType === "music"
                                    ? "audio"
                                    : media.contentType === "books"
                                        ? "books"
                                        : media.contentType,
                                downloadDate: new Date(),
                                fileSize,
                            },
                        },
                    }, { session });
                    if (media.uploadedBy.toString() !== userIdentifier) {
                        try {
                            const artist = yield user_model_1.User.findById(media.uploadedBy);
                            if (artist &&
                                artist.email &&
                                ((_a = artist.emailNotifications) === null || _a === void 0 ? void 0 : _a.songDownloads)) {
                                yield email_config_1.EmailService.sendSongDownloadedEmail(artist.email, artist.firstName ||
                                    ((_b = artist.artistProfile) === null || _b === void 0 ? void 0 : _b.artistName) ||
                                    "Artist", media.title, user.firstName || user.email);
                            }
                        }
                        catch (emailError) {
                            console.error("Failed to send download notification email:", emailError);
                        }
                    }
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, downloadUrl: media.downloadUrl };
        });
    }
    shareMedia(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userIdentifier, mediaIdentifier, platform } = data;
            if (!userIdentifier || !mediaIdentifier) {
                throw new Error("User identifier and media identifier are required");
            }
            const media = yield media_model_1.Media.findById(mediaIdentifier);
            if (!media) {
                throw new Error("Media not found");
            }
            const user = yield user_model_1.User.findById(userIdentifier);
            if (!user) {
                throw new Error("User not found");
            }
            const session = yield media_model_1.Media.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b;
                    yield media_model_1.Media.findByIdAndUpdate(mediaIdentifier, { $inc: { shareCount: 1 } }, { session });
                    yield mediaUserAction_model_1.MediaUserAction.findOneAndUpdate({
                        user: new mongoose_1.Types.ObjectId(userIdentifier),
                        media: new mongoose_1.Types.ObjectId(mediaIdentifier),
                        actionType: "share",
                    }, {
                        $set: { createdAt: new Date() },
                        $push: {
                            metadata: {
                                platform,
                                sharedAt: new Date(),
                            },
                        },
                    }, { upsert: true, session });
                    if (media.uploadedBy.toString() !== userIdentifier) {
                        try {
                            const artist = yield user_model_1.User.findById(media.uploadedBy);
                            if (artist &&
                                artist.email &&
                                ((_a = artist.emailNotifications) === null || _a === void 0 ? void 0 : _a.mediaShares)) {
                                yield email_config_1.EmailService.sendMediaSharedEmail(artist.email, media.title, artist.firstName || ((_b = artist.artistProfile) === null || _b === void 0 ? void 0 : _b.artistName) || "Artist");
                            }
                        }
                        catch (emailError) {
                            console.error("Failed to send share notification email:", emailError);
                        }
                    }
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, shareUrl: media.shareUrl };
        });
    }
}
exports.MediaService = MediaService;
exports.mediaService = new MediaService();
