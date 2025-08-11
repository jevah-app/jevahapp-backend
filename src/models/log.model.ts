import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for logs
export interface ILog extends Document {
  action: string; // e.g., "upload_media", "delete_user", "login"
  description?: string;
  performedBy: mongoose.Types.ObjectId; // reference to User
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Mongoose schema
const logSchema = new Schema<ILog>(
  {
    action: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed, // flexible JSON-like structure
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Export model
export const Log =
  mongoose.models.Log || mongoose.model<ILog>("Log", logSchema);
