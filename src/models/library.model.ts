import mongoose, { Schema, Document } from "mongoose";

export interface ILibrary extends Document {
  userId: mongoose.Types.ObjectId;
  mediaId: mongoose.Types.ObjectId;
  mediaType: "media" | "merchandise";
  addedAt: Date;
  notes?: string;
  rating?: number;
  isFavorite: boolean;
  playlists: string[]; // Array of playlist names
  lastWatched?: Date;
  watchProgress?: number; // Progress in seconds for videos/audio
  completionPercentage?: number; // 0-100
}

const librarySchema = new Schema<ILibrary>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mediaId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    mediaType: {
      type: String,
      enum: ["media", "merchandise"],
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
    playlists: {
      type: [String],
      default: [],
    },
    lastWatched: {
      type: Date,
    },
    watchProgress: {
      type: Number,
      min: 0,
      default: 0,
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure unique user-media combinations
librarySchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });

// Indexes for faster queries
librarySchema.index({ userId: 1, addedAt: -1 });
librarySchema.index({ userId: 1, isFavorite: 1 });
librarySchema.index({ userId: 1, lastWatched: -1 });
librarySchema.index({ userId: 1, rating: -1 });

export const Library =
  mongoose.models.Library || mongoose.model<ILibrary>("Library", librarySchema);
