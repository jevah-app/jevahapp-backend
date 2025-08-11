import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for bookmarks
export interface IBookmark extends Document {
  user: mongoose.Types.ObjectId; // user who bookmarked
  media: mongoose.Types.ObjectId; // media item bookmarked
  createdAt: Date;
}

// Mongoose schema
const bookmarkSchema = new Schema<IBookmark>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: Schema.Types.ObjectId,
      ref: "Media",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate bookmarks
bookmarkSchema.index({ user: 1, media: 1 }, { unique: true });

// Export model
export const Bookmark =
  mongoose.models.Bookmark ||
  mongoose.model<IBookmark>("Bookmark", bookmarkSchema);
