import mongoose, { Schema, Document } from "mongoose";

// TypeScript interface for a Devotional
export interface IDevotional extends Document {
  title: string;
  content: string;
  scriptureReference?: string;
  author?: string;
  submittedBy: mongoose.Types.ObjectId;
  tags?: string[];
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mongoose schema definition
const devotionalSchema = new Schema<IDevotional>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    scriptureReference: {
      type: String,
      trim: true,
    },
    author: {
      type: String,
      trim: true,
    },
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    likeCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Export model
export const Devotional =
  mongoose.models.Devotional ||
  mongoose.model<IDevotional>("Devotional", devotionalSchema);
