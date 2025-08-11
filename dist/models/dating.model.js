"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatingMessage = exports.Match = exports.DatingProfile = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const datingProfileSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
            validator: function (photos) {
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
}, {
    timestamps: true,
});
const matchSchema = new mongoose_1.Schema({
    user1: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    user2: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
const datingMessageSchema = new mongoose_1.Schema({
    matchId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Match",
        required: true,
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
exports.DatingProfile = mongoose_1.default.models.DatingProfile ||
    mongoose_1.default.model("DatingProfile", datingProfileSchema);
exports.Match = mongoose_1.default.models.Match || mongoose_1.default.model("Match", matchSchema);
exports.DatingMessage = mongoose_1.default.models.DatingMessage ||
    mongoose_1.default.model("DatingMessage", datingMessageSchema);
