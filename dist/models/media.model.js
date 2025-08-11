"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Media = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Define the Mongoose schema
const mediaSchema = new mongoose_1.Schema({
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
            validator: function (tags) {
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
exports.Media = mongoose_1.default.models.Media || mongoose_1.default.model("Media", mediaSchema);
