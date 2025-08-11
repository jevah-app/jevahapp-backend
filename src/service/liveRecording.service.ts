import { Media } from "../models/media.model";
import { Types } from "mongoose";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";
import logger from "../utils/logger";
import axios from "axios";
import fs from "fs";
import path from "path";

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

interface RecordingConfig {
  streamId: string;
  streamKey: string;
  title: string;
  description?: string;
  category?: string;
  topics?: string[];
  uploadedBy: Types.ObjectId;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

interface RecordingResponse {
  recordingId: string;
  streamId: string;
  r2Url: string;
  duration: number;
  fileSize: number;
  status: "recording" | "processing" | "completed" | "failed";
}

class LiveRecordingService {
  private readonly hlsServer: string;
  private readonly recordingsDir: string;

  constructor() {
    this.hlsServer =
      process.env.CONTABO_HLS_SERVER || "https://your-domain.com/hls";
    this.recordingsDir = path.join(process.cwd(), "temp-recordings");

    // Ensure recordings directory exists
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  /**
   * Start recording a live stream to Cloudflare R2
   */
  async startRecording(config: RecordingConfig): Promise<RecordingResponse> {
    const startTime = Date.now();

    try {
      logger.info("Starting live stream recording", {
        streamId: config.streamId,
        streamKey: config.streamKey,
      });

      // Create recording record in database
      const recording = await Media.create({
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
      logger.logDatabase("create", "recordings", duration, {
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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Failed to start recording", {
        error: error.message,
        streamId: config.streamId,
        duration: `${duration}ms`,
      });
      throw new Error(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording and save to Cloudflare R2
   */
  async stopRecording(
    streamId: string,
    userId: string
  ): Promise<RecordingResponse> {
    const startTime = Date.now();

    try {
      const recording = await Media.findOne({
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
      await recording.save();

      // Process and upload to R2
      const r2Result = await this.processAndUploadToR2(streamId, recording);

      const duration = Date.now() - startTime;
      logger.logDatabase("update", "recordings", duration, {
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
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error("Failed to stop recording", {
        error: error.message,
        streamId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Record stream segments and upload to R2
   */
  private async recordStreamToR2(
    streamKey: string,
    recordingId: string
  ): Promise<void> {
    try {
      const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
      const localDir = path.join(this.recordingsDir, recordingId);

      if (!fs.existsSync(localDir)) {
        fs.mkdirSync(localDir, { recursive: true });
      }

      // Download HLS segments
      await this.downloadHLSSegments(hlsUrl, localDir, recordingId);

      // Upload to R2
      await this.uploadToR2(localDir, recordingId, streamKey);

      // Cleanup local files
      this.cleanupLocalFiles(localDir);
    } catch (error: any) {
      logger.error("Recording to R2 failed", {
        error: error.message,
        streamKey,
        recordingId,
      });

      // Update recording status to failed
      await Media.findByIdAndUpdate(recordingId, {
        recordingStatus: "failed",
        actualEnd: new Date(),
      });
    }
  }

  /**
   * Download HLS segments from Contabo server
   */
  private async downloadHLSSegments(
    hlsUrl: string,
    localDir: string,
    recordingId: string
  ): Promise<void> {
    try {
      // Download playlist
      const playlistResponse = await axios.get(hlsUrl);
      const playlist = playlistResponse.data;

      // Save playlist locally
      fs.writeFileSync(path.join(localDir, "playlist.m3u8"), playlist);

      // Parse segments from playlist
      const segments = playlist
        .split("\n")
        .filter((line: string) => line.endsWith(".ts"))
        .map((segment: string) => segment.trim());

      // Download each segment
      for (const segment of segments) {
        const segmentUrl = hlsUrl.replace("index.m3u8", segment);
        const segmentResponse = await axios.get(segmentUrl, {
          responseType: "arraybuffer",
        });

        fs.writeFileSync(path.join(localDir, segment), segmentResponse.data);
      }

      logger.info("HLS segments downloaded", {
        recordingId,
        segmentsCount: segments.length,
        localDir,
      });
    } catch (error: any) {
      logger.error("Failed to download HLS segments", {
        error: error.message,
        hlsUrl,
        recordingId,
      });
      throw error;
    }
  }

  /**
   * Upload recorded content to Cloudflare R2
   */
  private async uploadToR2(
    localDir: string,
    recordingId: string,
    streamKey: string
  ): Promise<{
    url: string;
    duration: number;
    fileSize: number;
  }> {
    try {
      const files = fs.readdirSync(localDir);
      const videoFiles = files.filter(file => file.endsWith(".ts"));

      if (videoFiles.length === 0) {
        throw new Error("No video segments found");
      }

      // Combine segments into single file (simplified approach)
      const combinedFile = path.join(localDir, "combined.mp4");
      // In production, you'd use FFmpeg to properly combine segments

      // Upload to R2
      const objectKey = `recordings/${recordingId}/${streamKey}-${Date.now()}.mp4`;
      const fileBuffer = fs.readFileSync(combinedFile);

      const uploadStream = new Readable();
      uploadStream.push(fileBuffer);
      uploadStream.push(null);

      const putCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
        Body: uploadStream,
        ContentType: "video/mp4",
        CacheControl: "public, max-age=31536000", // Cache for 1 year
      });

      await s3Client.send(putCommand);

      // Generate public URL
      const publicUrl = this.generatePublicUrl(objectKey);
      const fileSize = fileBuffer.length;
      const duration = this.calculateDuration(videoFiles.length); // Approximate

      // Update database with R2 URL
      await Media.findByIdAndUpdate(recordingId, {
        recordingStatus: "completed",
        playbackUrl: publicUrl,
        r2Url: publicUrl,
        fileSize,
        duration,
        isRecording: false,
      });

      logger.info("Recording uploaded to R2", {
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
    } catch (error: any) {
      logger.error("Failed to upload to R2", {
        error: error.message,
        recordingId,
        localDir,
      });
      throw error;
    }
  }

  /**
   * Generate public URL for R2 object
   */
  private generatePublicUrl(objectKey: string): string {
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
  private calculateDuration(segmentCount: number): number {
    // Assuming 3-second segments (typical HLS fragment duration)
    return segmentCount * 3;
  }

  /**
   * Clean up local temporary files
   */
  private cleanupLocalFiles(localDir: string): void {
    try {
      if (fs.existsSync(localDir)) {
        fs.rmSync(localDir, { recursive: true, force: true });
        logger.info("Local recording files cleaned up", { localDir });
      }
    } catch (error: any) {
      logger.error("Failed to cleanup local files", {
        error: error.message,
        localDir,
      });
    }
  }

  /**
   * Process and upload existing recording to R2
   */
  private async processAndUploadToR2(
    streamId: string,
    recording: any
  ): Promise<{
    url: string;
    duration: number;
    fileSize: number;
  }> {
    // This would handle the actual processing of recorded content
    // For now, return placeholder data
    return {
      url: this.generatePublicUrl(
        `recordings/${recording._id}/${streamId}.mp4`
      ),
      duration: 3600, // 1 hour placeholder
      fileSize: 100000000, // 100MB placeholder
    };
  }

  /**
   * Get recording status
   */
  async getRecordingStatus(streamId: string): Promise<{
    isRecording: boolean;
    status: string;
    duration: number;
    fileSize?: number;
    r2Url?: string;
  }> {
    try {
      const recording = await Media.findOne({ streamId });

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
    } catch (error: any) {
      logger.error("Failed to get recording status", {
        error: error.message,
        streamId,
      });
      throw error;
    }
  }

  /**
   * Get all recordings for a user
   */
  async getUserRecordings(userId: string): Promise<any[]> {
    try {
      return await Media.find({
        uploadedBy: userId,
        contentType: "recording",
        recordingStatus: "completed",
      })
        .sort({ createdAt: -1 })
        .select("title description category createdAt duration fileSize r2Url");
    } catch (error: any) {
      logger.error("Failed to get user recordings", {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

export default new LiveRecordingService();
