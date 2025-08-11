import mongoose, { Schema, Document } from "mongoose";

// Define media content types
export type MediaContentType =
  | "music"
  | "videos"
  | "ebook"
  | "podcast"
  | "devotional"
  | "sermon"
  | "live"
  | "recording"
  | "audio"
  | "merch";

// Define live stream status
export type LiveStreamStatus = "scheduled" | "live" | "ended" | "archived";

// Define recording status
export type RecordingStatus =
  | "recording"
  | "processing"
  | "completed"
  | "failed";

// Define the Media interface for TypeScript
export interface IMedia extends Document {
  title: string;
  description?: string;
  contentType: MediaContentType;
  category?: string;
  fileUrl: string;
  fileMimeType?: string;
  thumbnailUrl?: string; // Thumbnail for media
  previewUrl?: string; // Preview/teaser video
  coverImageUrl?: string; // Cover image for ebooks/merch
  topics?: string[];
  uploadedBy: mongoose.Types.ObjectId;
  viewCount: number;
  listenCount: number;
  readCount: number;
  downloadCount: number;
  favoriteCount: number;
  shareCount: number;
  likeCount: number;
  commentCount: number;
  isLive?: boolean;
  liveStreamStatus?: LiveStreamStatus;
  streamKey?: string;
  streamId?: string; // New field for Contabo stream ID
  playbackUrl?: string;
  hlsUrl?: string; // New field for HLS URL
  dashUrl?: string; // New field for DASH URL
  rtmpUrl?: string;
  // Recording fields
  isRecording?: boolean;
  recordingStatus?: RecordingStatus;
  r2Url?: string; // Cloudflare R2 URL for recorded content
  fileSize?: number; // Size of recorded file in bytes
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  concurrentViewers?: number;
  duration?: number;
  // New fields for enhanced functionality
  isDownloadable?: boolean;
  downloadUrl?: string;
  shareUrl?: string;
  viewThreshold?: number; // Minimum seconds to count as a view

  // Merchandise fields
  price?: number;
  currency?: string;
  stockQuantity?: number;
  isAvailable?: boolean;
  merchCategory?: string; // Renamed to avoid conflict with existing category
  tags?: string[];

  // Analytics fields
  totalViews?: number;
  totalLikes?: number;
  totalShares?: number;
  totalDownloads?: number;
  averageWatchTime?: number;
  completionRate?: number;

  // Library fields
  isInLibrary?: boolean;
  libraryAddedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose schema
const mediaSchema = new Schema<IMedia>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contentType: {
      type: String,
      enum: [
        "music",
        "videos",
        "books",
        "live",
        "recording",
        "audio",
        "merch",
        "ebook",
        "podcast",
        "devotional",
        "sermon",
      ],
      required: true,
    },
    category: {
      type: String,
      trim: true,
      enum: [
        "worship",
        "inspiration",
        "youth",
        "teachings",
        "marriage",
        "counselling",
      ],
    },
    fileUrl: {
      type: String,
      required: function () {
        return this.contentType !== "live";
      },
    },
    fileMimeType: {
      type: String,
    },
    thumbnailUrl: {
      type: String,
      required: function () {
        return this.contentType !== "live"; // Thumbnail required for music, videos, books
      },
    },
    topics: {
      type: [String],
      default: [],
      validate: {
        validator: function (tags: string[]) {
          const allowedTopics = [
            "faith",
            "healing",
            "grace",
            "prayer",
            "maturity",
            "spiritual growth",
            "worship",
            "inspiration",
            "gospel",
            "sunday-service",
            "christian",
            "bible study",
            "testimony",
            "evangelism",
            "family",
            "marriage",
            "youth",
            "children",
            "music ministry",
            "praise",
            "sermon",
            "teaching",
            "discipleship",
            "leadership",
            "community",
            "outreach",
            "missions",
            "prayer meeting",
            "bible study",
            "fellowship",
            "celebration",
            "repentance",
            "forgiveness",
            "love",
            "hope",
            "joy",
            "peace",
            "patience",
            "kindness",
            "goodness",
            "faithfulness",
            "gentleness",
            "self-control"
          ];
          return tags.every(tag => allowedTopics.includes(tag.toLowerCase()));
        },
        message: props => `Invalid topics: ${props.value}`,
      },
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    listenCount: {
      type: Number,
      default: 0,
    },
    readCount: {
      type: Number,
      default: 0,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    favoriteCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    isLive: {
      type: Boolean,
      default: false,
    },
    liveStreamStatus: {
      type: String,
      enum: ["scheduled", "live", "ended", "archived"],
    },
    streamKey: {
      type: String,
      unique: true,
      sparse: true,
    },
    playbackUrl: {
      type: String,
    },
    hlsUrl: {
      type: String,
    },
    dashUrl: {
      type: String,
    },
    rtmpUrl: {
      type: String,
    },
    // Recording fields
    isRecording: {
      type: Boolean,
      default: false,
    },
    recordingStatus: {
      type: String,
      enum: ["recording", "processing", "completed", "failed"],
    },
    r2Url: {
      type: String,
    },
    fileSize: {
      type: Number,
      min: 0,
    },
    scheduledStart: {
      type: Date,
    },
    scheduledEnd: {
      type: Date,
    },
    actualStart: {
      type: Date,
    },
    actualEnd: {
      type: Date,
    },
    concurrentViewers: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      min: 0,
    },
    // New fields for enhanced functionality
    isDownloadable: {
      type: Boolean,
      default: false, // Only artists can make content downloadable
    },
    downloadUrl: {
      type: String,
      // Will be generated for downloadable content
    },
    shareUrl: {
      type: String,
      // Will be generated for sharing
    },
    viewThreshold: {
      type: Number,
      default: 30, // 30 seconds minimum to count as a view
      min: 5,
      max: 300,
    },
    // Merchandise fields
    price: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    stockQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    merchCategory: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Analytics fields
    totalViews: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalShares: {
      type: Number,
      default: 0,
    },
    totalDownloads: {
      type: Number,
      default: 0,
    },
    averageWatchTime: {
      type: Number,
      default: 0,
    },
    completionRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Library fields
    isInLibrary: {
      type: Boolean,
      default: false,
    },
    libraryAddedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
mediaSchema.index({ isLive: 1, liveStreamStatus: 1 });
mediaSchema.index({
  title: "text",
  category: 1,
  contentType: 1,
  uploadedBy: 1,
  createdAt: 1,
});
mediaSchema.index({ isDownloadable: 1 });
mediaSchema.index({ shareUrl: 1 });

export const Media =
  mongoose.models.Media || mongoose.model<IMedia>("Media", mediaSchema);
