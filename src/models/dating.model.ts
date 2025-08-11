import mongoose, { Schema, Document } from "mongoose";

export interface IDatingProfile extends Document {
  userId: mongoose.Types.ObjectId;
  isActive: boolean;
  lookingFor: "men" | "women" | "both";
  ageRange: {
    min: number;
    max: number;
  };
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: [number, number]; // [longitude, latitude]
  };
  bio: string;
  interests: string[];
  photos: string[];
  mainPhoto: string;
  height?: number; // in cm
  education?: string;
  occupation?: string;
  faithLevel:
    | "very_important"
    | "important"
    | "somewhat_important"
    | "not_important";
  denomination?: string;
  lastActive: Date;
  preferences: {
    maxDistance: number; // in km
    ageRange: {
      min: number;
      max: number;
    };
    faithLevel:
      | "very_important"
      | "important"
      | "somewhat_important"
      | "not_important";
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMatch extends Document {
  user1: mongoose.Types.ObjectId;
  user2: mongoose.Types.ObjectId;
  status: "pending" | "accepted" | "rejected" | "blocked";
  matchedAt: Date;
  lastMessageAt?: Date;
  isActive: boolean;
}

export interface IDatingMessage extends Document {
  matchId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  receiver: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "voice" | "gift";
  isRead: boolean;
  readAt?: Date;
  attachments?: string[];
  createdAt: Date;
}

const datingProfileSchema = new Schema<IDatingProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lookingFor: {
      type: String,
      enum: ["men", "women", "both"],
      required: true,
    },
    ageRange: {
      min: {
        type: Number,
        required: true,
        min: 18,
        max: 100,
      },
      max: {
        type: Number,
        required: true,
        min: 18,
        max: 100,
      },
    },
    location: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },
    bio: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    interests: {
      type: [String],
      default: [],
    },
    photos: {
      type: [String],
      validate: {
        validator: function (photos: string[]) {
          return photos.length <= 6;
        },
        message: "Maximum 6 photos allowed",
      },
    },
    mainPhoto: {
      type: String,
      required: true,
    },
    height: {
      type: Number,
      min: 100,
      max: 250,
    },
    education: {
      type: String,
    },
    occupation: {
      type: String,
    },
    faithLevel: {
      type: String,
      enum: [
        "very_important",
        "important",
        "somewhat_important",
        "not_important",
      ],
      required: true,
    },
    denomination: {
      type: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    preferences: {
      maxDistance: {
        type: Number,
        default: 50,
        min: 1,
        max: 500,
      },
      ageRange: {
        min: {
          type: Number,
          required: true,
          min: 18,
          max: 100,
        },
        max: {
          type: Number,
          required: true,
          min: 18,
          max: 100,
        },
      },
      faithLevel: {
        type: String,
        enum: [
          "very_important",
          "important",
          "somewhat_important",
          "not_important",
        ],
        required: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

const matchSchema = new Schema<IMatch>(
  {
    user1: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    user2: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "blocked"],
      default: "pending",
    },
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    lastMessageAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const datingMessageSchema = new Schema<IDatingMessage>(
  {
    matchId: {
      type: Schema.Types.ObjectId,
      ref: "Match",
      required: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "voice", "gift"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
datingProfileSchema.index({ location: "2dsphere" });
datingProfileSchema.index({ isActive: 1, lastActive: -1 });
datingProfileSchema.index({ lookingFor: 1, isActive: 1 });

matchSchema.index({ user1: 1, user2: 1 }, { unique: true });
matchSchema.index({ status: 1, isActive: 1 });
matchSchema.index({ lastMessageAt: -1 });

datingMessageSchema.index({ matchId: 1, createdAt: -1 });
datingMessageSchema.index({ receiver: 1, isRead: 1 });
datingMessageSchema.index({ sender: 1, createdAt: -1 });

export const DatingProfile =
  mongoose.models.DatingProfile ||
  mongoose.model<IDatingProfile>("DatingProfile", datingProfileSchema);

export const Match =
  mongoose.models.Match || mongoose.model<IMatch>("Match", matchSchema);

export const DatingMessage =
  mongoose.models.DatingMessage ||
  mongoose.model<IDatingMessage>("DatingMessage", datingMessageSchema);
