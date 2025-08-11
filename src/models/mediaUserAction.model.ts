import mongoose, { Schema, Document } from "mongoose";

export interface IMediaUserAction extends Document {
  user: mongoose.Types.ObjectId;
  media: mongoose.Types.ObjectId;
  actionType: "favorite" | "share";
  createdAt: Date;
}

const mediaUserActionSchema = new Schema<IMediaUserAction>(
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
    actionType: {
      type: String,
      enum: ["favorite", "share"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Prevent duplicate actions per user per media per action type
mediaUserActionSchema.index(
  { user: 1, media: 1, actionType: 1 },
  { unique: true }
);

export const MediaUserAction =
  mongoose.models.MediaUserAction ||
  mongoose.model<IMediaUserAction>("MediaUserAction", mediaUserActionSchema);
