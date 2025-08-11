import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for a Notification
export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  title: string;
  message: string;
  isRead: boolean;
  type?: string; // e.g., "media", "devotional", "system"
  relatedId?: mongoose.Types.ObjectId; // ID of related media or devotional
  createdAt: Date;
}

// Mongoose schema definition
const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: ["media", "devotional", "system"],
    },
    relatedId: {
      type: Schema.Types.ObjectId,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Export model
export const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", notificationSchema);
