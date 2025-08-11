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
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const interests_1 = require("../constants/interests");
// Define the Mongoose schema for the User model
const userSchema = new mongoose_1.Schema({
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String, required: true, unique: true },
    provider: { type: String, enum: ["clerk", "email"], required: true },
    clerkId: { type: String },
    avatar: { type: String }, // optional legacy avatar field
    avatarUpload: { type: String }, // used in current profile update flow
    password: { type: String },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    age: { type: Number },
    isKid: { type: Boolean },
    section: { type: String, enum: ["kids", "adults"] },
    role: {
        type: String,
        enum: [
            "learner",
            "parent",
            "educator",
            "moderator",
            "admin",
            "content_creator",
            "vendor",
            "church_admin",
            "artist",
        ],
    },
    location: { type: String },
    interests: {
        type: [String],
        enum: interests_1.VALID_INTERESTS,
        default: [],
    },
    isProfileComplete: { type: Boolean },
    hasConsentedToPrivacyPolicy: { type: Boolean },
    isEmailVerified: { type: Boolean, default: false },
    subscriptionTier: {
        type: String,
        enum: ["free", "premium"],
        default: "free",
    },
    subscriptionStatus: {
        type: String,
        enum: ["active", "cancelled", "expired", "pending"],
        default: "pending",
    },
    subscriptionEndDate: { type: Date },
    parentalControlEnabled: { type: Boolean, default: false },
    parentEmail: { type: String },
    isVerifiedCreator: { type: Boolean, default: false },
    isVerifiedVendor: { type: Boolean, default: false },
    isVerifiedChurch: { type: Boolean, default: false },
    isVerifiedArtist: { type: Boolean, default: false },
    // Artist-specific fields
    artistProfile: {
        artistName: { type: String },
        genre: { type: [String], default: [] },
        bio: { type: String },
        socialMedia: {
            instagram: { type: String },
            twitter: { type: String },
            facebook: { type: String },
            youtube: { type: String },
            spotify: { type: String },
        },
        isVerifiedArtist: { type: Boolean, default: false },
        verificationDocuments: { type: [String], default: [] },
        recordLabel: { type: String },
        yearsActive: { type: Number },
        // New fields for enhanced artist functionality
        followerCount: { type: Number, default: 0 },
        followingCount: { type: Number, default: 0 },
        hasMerch: { type: Boolean, default: false },
        merchEnabled: { type: Boolean, default: false },
    },
    // New fields for enhanced functionality
    following: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    followers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    offlineDownloads: [
        {
            mediaId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Media",
                required: true,
            },
            mediaTitle: { type: String, required: true },
            mediaType: { type: String, required: true },
            downloadDate: { type: Date, default: Date.now },
            fileSize: { type: Number, required: true },
            localPath: { type: String },
        },
    ],
    merchItems: [
        {
            id: { type: String, required: true },
            name: { type: String, required: true },
            description: { type: String },
            price: { type: Number, required: true, min: 0 },
            imageUrl: { type: String, required: true },
            category: { type: String, required: true },
            isAvailable: { type: Boolean, default: true },
            stockCount: { type: Number, min: 0 },
        },
    ],
    library: [
        {
            mediaId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "Media",
                required: true,
            },
            mediaTitle: { type: String, required: true },
            mediaType: { type: String, required: true },
            contentType: { type: String, required: true },
            thumbnailUrl: { type: String },
            artistName: { type: String },
            savedAt: { type: Date, default: Date.now },
            lastAccessed: { type: Date },
            playCount: { type: Number, default: 0 },
            isFavorite: { type: Boolean, default: false },
        },
    ],
    userActivities: [
        {
            action: { type: String, required: true },
            resourceType: { type: String, required: true },
            resourceId: {
                type: mongoose_1.Schema.Types.ObjectId,
                required: true,
            },
            metadata: { type: mongoose_1.Schema.Types.Mixed },
            ipAddress: { type: String },
            userAgent: { type: String },
            timestamp: { type: Date, default: Date.now },
        },
    ],
    emailNotifications: {
        newFollowers: { type: Boolean, default: true },
        mediaLikes: { type: Boolean, default: true },
        mediaShares: { type: Boolean, default: true },
        merchPurchases: { type: Boolean, default: true },
        songDownloads: { type: Boolean, default: true },
        subscriptionUpdates: { type: Boolean, default: true },
        securityAlerts: { type: Boolean, default: true },
    },
    // Security and audit fields
    lastLoginAt: { type: Date },
    lastLoginIp: { type: String },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    passwordChangedAt: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
}, { timestamps: true });
// Indexes for better performance
userSchema.index({ "artistProfile.artistName": "text" });
userSchema.index({ following: 1 });
userSchema.index({ followers: 1 });
userSchema.index({ "artistProfile.hasMerch": 1 });
userSchema.index({ role: 1, "artistProfile.isVerifiedArtist": 1 });
userSchema.index({ subscriptionTier: 1, subscriptionStatus: 1 });
userSchema.index({ "library.mediaId": 1 });
userSchema.index({ "userActivities.timestamp": -1 });
userSchema.index({ lastLoginAt: -1 });
// Export the Mongoose model
exports.User = mongoose_1.default.models.User || mongoose_1.default.model("User", userSchema);
