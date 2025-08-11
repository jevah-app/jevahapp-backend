import mongoose, { Schema, Document } from "mongoose";

export interface IUserViewedMedia extends Document {
  user: mongoose.Types.ObjectId;
  viewedMedia: Array<{
    media: mongoose.Types.ObjectId;
    viewedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const userViewedMediaSchema = new Schema<IUserViewedMedia>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    viewedMedia: [
      {
        media: {
          type: Schema.Types.ObjectId,
          ref: "Media",
          required: true,
        },
        viewedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Ensure the viewedMedia array is capped at 50 items
userViewedMediaSchema.index({ user: 1 }, { unique: true });

export const UserViewedMedia =
  mongoose.models.UserViewedMedia ||
  mongoose.model<IUserViewedMedia>("UserViewedMedia", userViewedMediaSchema);
