import mongoose, { Schema, Document } from "mongoose";
import { VALID_INTERESTS } from "../constants/interests";

// Define authentication providers
export type AuthProvider = "clerk" | "email";

// Define user roles
export type UserRole =
  | "learner"
  | "parent"
  | "educator"
  | "moderator"
  | "admin"
  | "content_creator"
  | "vendor"
  | "church_admin"
  | "artist";

// Define user sections
export type UserSection = "kids" | "adults";

// Define interests based on the predefined constant list
export type InterestType = (typeof VALID_INTERESTS)[number];

// Artist-specific interface
export interface IArtistProfile {
  artistName: string;
  genre: string[];
  bio?: string;
  socialMedia?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    spotify?: string;
  };
  isVerifiedArtist?: boolean;
  verificationDocuments?: string[];
  recordLabel?: string;
  yearsActive?: number;
  // New fields for enhanced artist functionality
  followerCount?: number;
  followingCount?: number;
  hasMerch?: boolean;
  merchEnabled?: boolean;
}

// Merchandise interface
export interface IMerchItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stockCount?: number;
}

// Offline download interface
export interface IOfflineDownload {
  mediaId: mongoose.Types.ObjectId;
  mediaTitle: string;
  mediaType: string;
  downloadDate: Date;
  fileSize: number;
  localPath?: string;
}

// Library item interface for saved content
export interface ILibraryItem {
  mediaId: mongoose.Types.ObjectId;
  mediaTitle: string;
  mediaType: string;
  contentType: string;
  thumbnailUrl?: string;
  artistName?: string;
  savedAt: Date;
  lastAccessed?: Date;
  playCount: number;
  isFavorite: boolean;
}

// User activity log interface
export interface IUserActivity {
  action: string;
  resourceType: string;
  resourceId: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// TypeScript interface representing a User object
export interface IUser {
  firstName?: string;
  lastName?: string;
  email: string;
  provider: AuthProvider;
  clerkId?: string;
  avatar?: string;
  avatarUpload?: string;
  password: string;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  age?: number;
  isKid?: boolean;
  section?: UserSection;
  role?: UserRole;
  location?: string;

  interests?: InterestType[];

  isProfileComplete?: boolean;
  hasConsentedToPrivacyPolicy?: boolean;
  isEmailVerified: boolean;

  subscriptionTier?: "free" | "premium";
  subscriptionStatus?: "active" | "cancelled" | "expired" | "pending";
  subscriptionEndDate?: Date;
  parentalControlEnabled?: boolean;
  parentEmail?: string;

  isVerifiedCreator?: boolean;
  isVerifiedVendor?: boolean;
  isVerifiedChurch?: boolean;
  isVerifiedArtist?: boolean;

  // Artist-specific fields
  artistProfile?: IArtistProfile;

  // New fields for enhanced functionality
  following?: mongoose.Types.ObjectId[]; // Artists this user follows
  followers?: mongoose.Types.ObjectId[]; // Users following this artist
  offlineDownloads?: IOfflineDownload[]; // Downloaded content for offline use
  merchItems?: IMerchItem[]; // Artist's merchandise
  library?: ILibraryItem[]; // User's saved content library
  userActivities?: IUserActivity[]; // User activity audit log
  emailNotifications?: {
    newFollowers?: boolean;
    mediaLikes?: boolean;
    mediaShares?: boolean;
    merchPurchases?: boolean;
    songDownloads?: boolean;
    subscriptionUpdates?: boolean;
    securityAlerts?: boolean;
  };

  // Security and audit fields
  lastLoginAt?: Date;
  lastLoginIp?: string;
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  passwordChangedAt?: Date;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

// Extend Mongoose's Document with the IUser interface
export interface IUserDocument extends IUser, Document {}

// Define the Mongoose schema for the User model
const userSchema = new Schema<IUserDocument>(
  {
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
      enum: VALID_INTERESTS,
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
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    offlineDownloads: [
      {
        mediaId: {
          type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
          required: true,
        },
        metadata: { type: Schema.Types.Mixed },
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
  },
  { timestamps: true }
);

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
export const User =
  mongoose.models.User || mongoose.model<IUserDocument>("User", userSchema);
