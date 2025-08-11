import { Media } from "../models/media.model";
import { Types } from "mongoose";
import crypto from "crypto";

interface StreamConfig {
  title: string;
  description?: string;
  category?: string;
  topics?: string[];
  uploadedBy: Types.ObjectId;
  scheduledStart?: Date;
  scheduledEnd?: Date;
}

interface StreamResponse {
  streamKey: string;
  rtmpUrl: string;
  playbackUrl: string;
  hlsUrl: string;
  dashUrl: string;
  streamId: string;
}

class ContaboStreamingService {
  private readonly rtmpServer: string;
  private readonly hlsServer: string;
  private readonly dashServer: string;
  private readonly streamKeyPrefix: string;

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
  private generateStreamKey(): string {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex");
    return `${this.streamKeyPrefix}_${timestamp}_${random}`;
  }

  /**
   * Start a new live stream on Contabo
   */
  async startLiveStream(config: StreamConfig): Promise<StreamResponse> {
    try {
      const streamKey = this.generateStreamKey();
      const streamId = crypto.randomBytes(16).toString("hex");

      // Contabo RTMP URL
      const rtmpUrl = `${this.rtmpServer}/${streamKey}`;

      // HLS and DASH URLs for playback
      const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
      const dashUrl = `${this.dashServer}/${streamKey}/manifest.mpd`;

      // Main playback URL (HLS is more widely supported)
      const playbackUrl = hlsUrl;

      // Create media record in database
      const media = await Media.create({
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
    } catch (error: any) {
      console.error("Contabo live stream creation error:", error);
      throw new Error(`Failed to start Contabo live stream: ${error.message}`);
    }
  }

  /**
   * End a live stream
   */
  async endLiveStream(streamId: string, userId: string): Promise<void> {
    try {
      const stream = await Media.findOne({
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
      await stream.save();

      console.log("Contabo live stream ended:", {
        streamId,
        streamKey: stream.streamKey,
      });

      // Note: With Contabo, you might need to implement additional cleanup
      // depending on your server configuration (e.g., stopping nginx-rtmp processes)
    } catch (error: any) {
      console.error("End Contabo live stream error:", error);
      throw error;
    }
  }

  /**
   * Get stream status and viewer count
   */
  async getStreamStatus(streamId: string): Promise<{
    isLive: boolean;
    concurrentViewers: number;
    duration: number;
    status: string;
  }> {
    try {
      const stream = await Media.findOne({ streamId });

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
    } catch (error: any) {
      console.error("Get stream status error:", error);
      throw error;
    }
  }

  /**
   * Update concurrent viewer count
   */
  async updateViewerCount(
    streamId: string,
    viewerCount: number
  ): Promise<void> {
    try {
      await Media.findOneAndUpdate(
        { streamId },
        { concurrentViewers: Math.max(0, viewerCount) }
      );
    } catch (error: any) {
      console.error("Update viewer count error:", error);
    }
  }

  /**
   * Get all active live streams
   */
  async getActiveStreams(): Promise<any[]> {
    try {
      return await Media.find({
        isLive: true,
        liveStreamStatus: "live",
      })
        .sort({ createdAt: -1 })
        .populate("uploadedBy", "firstName lastName email")
        .select(
          "title description category createdAt thumbnailUrl streamId concurrentViewers"
        );
    } catch (error: any) {
      console.error("Get active streams error:", error);
      throw error;
    }
  }

  /**
   * Schedule a live stream
   */
  async scheduleLiveStream(
    config: StreamConfig & { scheduledStart: Date; scheduledEnd?: Date }
  ): Promise<StreamResponse> {
    try {
      const streamKey = this.generateStreamKey();
      const streamId = crypto.randomBytes(16).toString("hex");

      const rtmpUrl = `${this.rtmpServer}/${streamKey}`;
      const hlsUrl = `${this.hlsServer}/${streamKey}/index.m3u8`;
      const dashUrl = `${this.dashServer}/${streamKey}/manifest.mpd`;
      const playbackUrl = hlsUrl;

      const media = await Media.create({
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
    } catch (error: any) {
      console.error("Schedule Contabo live stream error:", error);
      throw new Error(
        `Failed to schedule Contabo live stream: ${error.message}`
      );
    }
  }

  /**
   * Get stream statistics
   */
  async getStreamStats(streamId: string): Promise<{
    totalViews: number;
    peakViewers: number;
    averageViewers: number;
    duration: number;
    startTime: Date;
    endTime?: Date;
  }> {
    try {
      const stream = await Media.findOne({ streamId });

      if (!stream) {
        throw new Error("Stream not found");
      }

      const duration =
        stream.actualStart && stream.actualEnd
          ? Math.floor(
              (stream.actualEnd.getTime() - stream.actualStart.getTime()) / 1000
            )
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
    } catch (error: any) {
      console.error("Get stream stats error:", error);
      throw error;
    }
  }
}

export default new ContaboStreamingService();
