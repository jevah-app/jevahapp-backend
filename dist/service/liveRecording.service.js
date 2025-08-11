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
const client_s3_1 = require("@aws-sdk/client-s3");
const stream_1 = require("stream");
const logger_1 = __importDefault(require("../utils/logger"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Configure S3 client for Cloudflare R2
const s3Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});
class LiveRecordingService {
    constructor() {
        this.hlsServer =
            process.env.CONTABO_HLS_SERVER || "https://your-domain.com/hls";
        this.recordingsDir = path_1.default.join(process.cwd(), "temp-recordings");
        // Ensure recordings directory exists
        if (!fs_1.default.existsSync(this.recordingsDir)) {
            fs_1.default.mkdirSync(this.recordingsDir, { recursive: true });
        }
    }
    /**
     * Start recording a live stream to Cloudflare R2
     */
    startRecording(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                logger_1.default.info("Starting live stream recording", {
                    streamId: config.streamId,
                    streamKey: config.streamKey,
                });
                // Create recording record in database
                const recording = yield media_model_1.Media.create({
                    title: config.title,
                    description: config.description,
                    contentType: "recording",
                    category: config.category,
                    topics: config.topics || [],
                    uploadedBy: config.uploadedBy,
                    isLive: false,
                    isRecording: true,
                    recordingStatus: "recording",
                    streamId: config.streamId,
                    streamKey: config.streamKey,
                    scheduledStart: config.scheduledStart,
                    scheduledEnd: config.scheduledEnd,
                    actualStart: new Date(),
                    concurrentViewers: 0,
                });
                // Start background recording process
                this.recordStreamToR2(config.streamKey, recording._id.toString());
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("create", "recordings", duration, {
                    streamId: config.streamId,
                    recordingId: recording._id.toString(),
                });
                return {
                    recordingId: recording._id.toString(),
                    streamId: config.streamId,
                    r2Url: "",
                    duration: 0,
                    fileSize: 0,
                    status: "recording",
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Failed to start recording", {
                    error: error.message,
                    streamId: config.streamId,
                    duration: `${duration}ms`,
                });
                throw new Error(`Failed to start recording: ${error.message}`);
            }
        });
    }
    /**
     * Stop recording and save to Cloudflare R2
     */
    stopRecording(streamId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const recording = yield media_model_1.Media.findOne({
                    streamId,
                    isRecording: true,
                    recordingStatus: "recording",
                });
                if (!recording) {
                    throw new Error("Recording not found");
                }
                if (recording.uploadedBy.toString() !== userId) {
                    throw new Error("Unauthorized to stop this recording");
                }
                // Update status to processing
                recording.recordingStatus = "processing";
                recording.actualEnd = new Date();
                yield recording.save();
                // Process and upload to R2
                const r2Result = yield this.processAndUploadToR2(streamId, recording);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "recordings", duration, {
                    streamId,
                    recordingId: recording._id.toString(),
                    status: "completed",
                });
                return {
                    recordingId: recording._id.toString(),
                    streamId,
                    r2Url: r2Result.url,
                    duration: r2Result.duration,
                    fileSize: r2Result.fileSize,
                    status: "completed",
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Failed to stop recording", {
                    error: error.message,
                    streamId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Record stream segments and upload to R2
     */
    recordStreamToR2(streamKey, recordingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
                const localDir = path_1.default.join(this.recordingsDir, recordingId);
                if (!fs_1.default.existsSync(localDir)) {
                    fs_1.default.mkdirSync(localDir, { recursive: true });
                }
                // Download HLS segments
                yield this.downloadHLSSegments(hlsUrl, localDir, recordingId);
                // Upload to R2
                yield this.uploadToR2(localDir, recordingId, streamKey);
                // Cleanup local files
                this.cleanupLocalFiles(localDir);
            }
            catch (error) {
                logger_1.default.error("Recording to R2 failed", {
                    error: error.message,
                    streamKey,
                    recordingId,
                });
                // Update recording status to failed
                yield media_model_1.Media.findByIdAndUpdate(recordingId, {
                    recordingStatus: "failed",
                    actualEnd: new Date(),
                });
            }
        });
    }
    /**
     * Download HLS segments from Contabo server
     */
    downloadHLSSegments(hlsUrl, localDir, recordingId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Download playlist
                const playlistResponse = yield axios_1.default.get(hlsUrl);
                const playlist = playlistResponse.data;
                // Save playlist locally
                fs_1.default.writeFileSync(path_1.default.join(localDir, "playlist.m3u8"), playlist);
                // Parse segments from playlist
                const segments = playlist
                    .split("\n")
                    .filter((line) => line.endsWith(".ts"))
                    .map((segment) => segment.trim());
                // Download each segment
                for (const segment of segments) {
                    const segmentUrl = hlsUrl.replace("index.m3u8", segment);
                    const segmentResponse = yield axios_1.default.get(segmentUrl, {
                        responseType: "arraybuffer",
                    });
                    fs_1.default.writeFileSync(path_1.default.join(localDir, segment), segmentResponse.data);
                }
                logger_1.default.info("HLS segments downloaded", {
                    recordingId,
                    segmentsCount: segments.length,
                    localDir,
                });
            }
            catch (error) {
                logger_1.default.error("Failed to download HLS segments", {
                    error: error.message,
                    hlsUrl,
                    recordingId,
                });
                throw error;
            }
        });
    }
    /**
     * Upload recorded content to Cloudflare R2
     */
    uploadToR2(localDir, recordingId, streamKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const files = fs_1.default.readdirSync(localDir);
                const videoFiles = files.filter(file => file.endsWith(".ts"));
                if (videoFiles.length === 0) {
                    throw new Error("No video segments found");
                }
                // Combine segments into single file (simplified approach)
                const combinedFile = path_1.default.join(localDir, "combined.mp4");
                // In production, you'd use FFmpeg to properly combine segments
                // Upload to R2
                const objectKey = `recordings/${recordingId}/${streamKey}-${Date.now()}.mp4`;
                const fileBuffer = fs_1.default.readFileSync(combinedFile);
                const uploadStream = new stream_1.Readable();
                uploadStream.push(fileBuffer);
                uploadStream.push(null);
                const putCommand = new client_s3_1.PutObjectCommand({
                    Bucket: process.env.R2_BUCKET,
                    Key: objectKey,
                    Body: uploadStream,
                    ContentType: "video/mp4",
                    CacheControl: "public, max-age=31536000", // Cache for 1 year
                });
                yield s3Client.send(putCommand);
                // Generate public URL
                const publicUrl = this.generatePublicUrl(objectKey);
                const fileSize = fileBuffer.length;
                const duration = this.calculateDuration(videoFiles.length); // Approximate
                // Update database with R2 URL
                yield media_model_1.Media.findByIdAndUpdate(recordingId, {
                    recordingStatus: "completed",
                    playbackUrl: publicUrl,
                    r2Url: publicUrl,
                    fileSize,
                    duration,
                    isRecording: false,
                });
                logger_1.default.info("Recording uploaded to R2", {
                    recordingId,
                    objectKey,
                    fileSize,
                    duration,
                    publicUrl,
                });
                return {
                    url: publicUrl,
                    duration,
                    fileSize,
                };
            }
            catch (error) {
                logger_1.default.error("Failed to upload to R2", {
                    error: error.message,
                    recordingId,
                    localDir,
                });
                throw error;
            }
        });
    }
    /**
     * Generate public URL for R2 object
     */
    generatePublicUrl(objectKey) {
        const customDomain = process.env.R2_CUSTOM_DOMAIN;
        if (customDomain) {
            return `https://${customDomain}/${objectKey}`;
        }
        // Fallback to Cloudflare R2 public URL format
        const accountId = process.env.R2_ACCOUNT_ID;
        const bucketName = process.env.R2_BUCKET;
        return `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/${objectKey}`;
    }
    /**
     * Calculate approximate duration based on segment count
     */
    calculateDuration(segmentCount) {
        // Assuming 3-second segments (typical HLS fragment duration)
        return segmentCount * 3;
    }
    /**
     * Clean up local temporary files
     */
    cleanupLocalFiles(localDir) {
        try {
            if (fs_1.default.existsSync(localDir)) {
                fs_1.default.rmSync(localDir, { recursive: true, force: true });
                logger_1.default.info("Local recording files cleaned up", { localDir });
            }
        }
        catch (error) {
            logger_1.default.error("Failed to cleanup local files", {
                error: error.message,
                localDir,
            });
        }
    }
    /**
     * Process and upload existing recording to R2
     */
    processAndUploadToR2(streamId, recording) {
        return __awaiter(this, void 0, void 0, function* () {
            // This would handle the actual processing of recorded content
            // For now, return placeholder data
            return {
                url: this.generatePublicUrl(`recordings/${recording._id}/${streamId}.mp4`),
                duration: 3600, // 1 hour placeholder
                fileSize: 100000000, // 100MB placeholder
            };
        });
    }
    /**
     * Get recording status
     */
    getRecordingStatus(streamId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const recording = yield media_model_1.Media.findOne({ streamId });
                if (!recording) {
                    throw new Error("Recording not found");
                }
                return {
                    isRecording: recording.isRecording || false,
                    status: recording.recordingStatus || "unknown",
                    duration: recording.duration || 0,
                    fileSize: recording.fileSize,
                    r2Url: recording.r2Url,
                };
            }
            catch (error) {
                logger_1.default.error("Failed to get recording status", {
                    error: error.message,
                    streamId,
                });
                throw error;
            }
        });
    }
    /**
     * Get all recordings for a user
     */
    getUserRecordings(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield media_model_1.Media.find({
                    uploadedBy: userId,
                    contentType: "recording",
                    recordingStatus: "completed",
                })
                    .sort({ createdAt: -1 })
                    .select("title description category createdAt duration fileSize r2Url");
            }
            catch (error) {
                logger_1.default.error("Failed to get user recordings", {
                    error: error.message,
                    userId,
                });
                throw error;
            }
        });
    }
}
exports.default = new LiveRecordingService();
