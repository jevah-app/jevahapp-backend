import mongoose, { Schema, Document } from "mongoose";

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "audio" | "video" | "file";
  mediaUrl?: string;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  replyTo?: mongoose.Types.ObjectId;
  reactions?: {
    [key: string]: mongoose.Types.ObjectId[]; // reaction type -> array of user IDs
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "audio", "video", "file"],
      default: "text",
    },
    mediaUrl: {
      type: String,
      required: function() {
        return this.messageType !== "text";
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    reactions: {
      type: Map,
      of: [Schema.Types.ObjectId],
      default: {},
    },
  },
  { timestamps: true }
);

// Indexes for better performance
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, isRead: 1 });
messageSchema.index({ sender: 1, recipient: 1, isDeleted: 1 });

export const Message =
  mongoose.models.Message ||
  mongoose.model<IMessage>("Message", messageSchema);
