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
const media_model_1 = require("../models/media.model");
const crypto_1 = __importDefault(require("crypto"));
class ContaboStreamingService {
    constructor() {
        // Contabo server configuration
        this.rtmpServer =
            process.env.CONTABO_RTMP_SERVER || "rtmp://your-contabo-server.com/live";
        this.hlsServer =
            process.env.CONTABO_HLS_SERVER || "https://your-contabo-server.com/hls";
        this.dashServer =
            process.env.CONTABO_DASH_SERVER || "https://your-contabo-server.com/dash";
        this.streamKeyPrefix = process.env.CONTABO_STREAM_KEY_PREFIX || "jevah";
    }
    /**
     * Generate a unique stream key for Contabo
     */
    generateStreamKey() {
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(8).toString("hex");
        return `${this.streamKeyPrefix}_${timestamp}_${random}`;
    }
    /**
     * Start a new live stream on Contabo
     */
    startLiveStream(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const streamKey = this.generateStreamKey();
                const streamId = crypto_1.default.randomBytes(16).toString("hex");
                // Contabo RTMP URL
                const rtmpUrl = `${this.rtmpServer}/${streamKey}`;
                // HLS and DASH URLs for playback
                const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
                const dashUrl = `${this.dashServer}/${streamKey}/manifest.mpd`;
                // Main playback URL (HLS is more widely supported)
                const playbackUrl = hlsUrl;
                // Create media record in database
                const media = yield media_model_1.Media.create({
                    title: config.title,
                    description: config.description,
                    contentType: "live",
                    category: config.category,
                    topics: config.topics || [],
                    uploadedBy: config.uploadedBy,
                    isLive: true,
                    liveStreamStatus: "live",
                    streamKey,
                    rtmpUrl,
                    playbackUrl,
                    hlsUrl,
                    dashUrl,
                    streamId,
                    scheduledStart: config.scheduledStart,
                    scheduledEnd: config.scheduledEnd,
                    actualStart: new Date(),
                    concurrentViewers: 0,
                });
                console.log("Contabo live stream started:", {
                    streamKey,
                    streamId,
                    rtmpUrl,
                    playbackUrl,
                });
                return {
                    streamKey,
                    rtmpUrl,
                    playbackUrl,
                    hlsUrl,
                    dashUrl,
                    streamId,
                };
            }
            catch (error) {
                console.error("Contabo live stream creation error:", error);
                throw new Error(`Failed to start Contabo live stream: ${error.message}`);
            }
        });
    }
    /**
     * End a live stream
     */
    endLiveStream(streamId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield media_model_1.Media.findOne({
                    streamId,
                    isLive: true,
                    liveStreamStatus: "live",
                });
                if (!stream) {
                    throw new Error("Live stream not found");
                }
                // Check if user is authorized to end the stream
                if (stream.uploadedBy.toString() !== userId) {
                    throw new Error("Unauthorized to end this live stream");
                }
                // Update stream status
                stream.liveStreamStatus = "ended";
                stream.actualEnd = new Date();
                yield stream.save();
                console.log("Contabo live stream ended:", {
                    streamId,
                    streamKey: stream.streamKey,
                });
                // Note: With Contabo, you might need to implement additional cleanup
                // depending on your server configuration (e.g., stopping nginx-rtmp processes)
            }
            catch (error) {
                console.error("End Contabo live stream error:", error);
                throw error;
            }
        });
    }
    /**
     * Get stream status and viewer count
     */
    getStreamStatus(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield media_model_1.Media.findOne({ streamId });
                if (!stream) {
                    throw new Error("Stream not found");
                }
                const duration = stream.actualStart
                    ? Math.floor((Date.now() - stream.actualStart.getTime()) / 1000)
                    : 0;
                return {
                    isLive: stream.isLive && stream.liveStreamStatus === "live",
                    concurrentViewers: stream.concurrentViewers || 0,
                    duration,
                    status: stream.liveStreamStatus || "unknown",
                };
            }
            catch (error) {
                console.error("Get stream status error:", error);
                throw error;
            }
        });
    }
    /**
     * Update concurrent viewer count
     */
    updateViewerCount(streamId, viewerCount) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield media_model_1.Media.findOneAndUpdate({ streamId }, { concurrentViewers: Math.max(0, viewerCount) });
            }
            catch (error) {
                console.error("Update viewer count error:", error);
            }
        });
    }
    /**
     * Get all active live streams
     */
    getActiveStreams() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield media_model_1.Media.find({
                    isLive: true,
                    liveStreamStatus: "live",
                })
                    .sort({ createdAt: -1 })
                    .populate("uploadedBy", "firstName lastName email")
                    .select("title description category createdAt thumbnailUrl streamId concurrentViewers");
            }
            catch (error) {
                console.error("Get active streams error:", error);
                throw error;
            }
        });
    }
    /**
     * Schedule a live stream
     */
    scheduleLiveStream(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const streamKey = this.generateStreamKey();
                const streamId = crypto_1.default.randomBytes(16).toString("hex");
                const rtmpUrl = `${this.rtmpServer}/${streamKey}`;
                const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
                const dashUrl = `${this.dashServer}/${streamKey}/manifest.mpd`;
                const playbackUrl = hlsUrl;
                const media = yield media_model_1.Media.create({
                    title: config.title,
                    description: config.description,
                    contentType: "live",
                    category: config.category,
                    topics: config.topics || [],
                    uploadedBy: config.uploadedBy,
                    isLive: true,
                    liveStreamStatus: "scheduled",
                    streamKey,
                    rtmpUrl,
                    playbackUrl,
                    hlsUrl,
                    dashUrl,
                    streamId,
                    scheduledStart: config.scheduledStart,
                    scheduledEnd: config.scheduledEnd,
                    concurrentViewers: 0,
                });
                console.log("Contabo live stream scheduled:", {
                    streamKey,
                    streamId,
                    scheduledStart: config.scheduledStart,
                });
                return {
                    streamKey,
                    rtmpUrl,
                    playbackUrl,
                    hlsUrl,
                    dashUrl,
                    streamId,
                };
            }
            catch (error) {
                console.error("Schedule Contabo live stream error:", error);
                throw new Error(`Failed to schedule Contabo live stream: ${error.message}`);
            }
        });
    }
    /**
     * Get stream statistics
     */
    getStreamStats(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stream = yield media_model_1.Media.findOne({ streamId });
                if (!stream) {
                    throw new Error("Stream not found");
                }
                const duration = stream.actualStart && stream.actualEnd
                    ? Math.floor((stream.actualEnd.getTime() - stream.actualStart.getTime()) / 1000)
                    : stream.actualStart
                        ? Math.floor((Date.now() - stream.actualStart.getTime()) / 1000)
                        : 0;
                return {
                    totalViews: stream.viewCount || 0,
                    peakViewers: stream.concurrentViewers || 0,
                    averageViewers: stream.concurrentViewers || 0, // You might want to track this separately
                    duration,
                    startTime: stream.actualStart || new Date(),
                    endTime: stream.actualEnd,
                };
            }
            catch (error) {
                console.error("Get stream stats error:", error);
                throw error;
            }
        });
    }
}
exports.default = new ContaboStreamingService();
