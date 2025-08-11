import mongoose, { Schema, Document } from "mongoose";

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  unreadCount: {
    [userId: string]: number;
  };
  isGroupChat: boolean;
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {},
    },
    isGroupChat: {
      type: Boolean,
      default: false,
    },
    groupName: {
      type: String,
      required: function() {
        return this.isGroupChat;
      },
      maxlength: 100,
    },
    groupAvatar: {
      type: String,
    },
    groupAdmin: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: function() {
        return this.isGroupChat;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Indexes for better performance
conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ "unreadCount": 1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>("Conversation", conversationSchema);
