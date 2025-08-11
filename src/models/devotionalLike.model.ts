import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for a DevotionalLike
export interface IDevotionalLike extends Document {
  user: mongoose.Types.ObjectId;
  devotional: mongoose.Types.ObjectId;
  createdAt: Date;
}

// Mongoose schema definition
const devotionalLikeSchema = new Schema<IDevotionalLike>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    devotional: {
      type: Schema.Types.ObjectId,
      ref: "Devotional",
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Unique index to prevent multiple likes by the same user
devotionalLikeSchema.index({ user: 1, devotional: 1 }, { unique: true });

// Export model
export const DevotionalLike =
  mongoose.models.DevotionalLike ||
  mongoose.model<IDevotionalLike>("DevotionalLike", devotionalLikeSchema);
