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
exports.MediaInteraction = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const mediaInteractionSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    media: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Media",
        required: true,
    },
    interactionType: {
        type: String,
        enum: ["view", "listen", "read", "download", "like", "comment", "share"],
        required: true,
    },
    lastInteraction: {
        type: Date,
        default: Date.now,
    },
    count: {
        type: Number,
        default: 0,
    },
    content: {
        type: String,
        required: function () {
            return this.interactionType === "comment";
        },
        maxlength: 1000,
    },
    parentCommentId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "MediaInteraction",
        required: function () {
            return this.interactionType === "comment" && this.parentCommentId;
        },
    },
    reactions: {
        type: Map,
        of: Number,
        default: {},
    },
    isRemoved: {
        type: Boolean,
        default: false,
    },
    interactions: [
        {
            timestamp: { type: Date, default: Date.now },
            duration: { type: Number },
            isComplete: { type: Boolean },
            fileSize: { type: Number },
        },
    ],
}, { timestamps: true });
// Indexes for better performance
mediaInteractionSchema.index({ user: 1, media: 1, interactionType: 1 });
mediaInteractionSchema.index({ media: 1, interactionType: 1 });
mediaInteractionSchema.index({ parentCommentId: 1 });
mediaInteractionSchema.index({ createdAt: -1 });
exports.MediaInteraction = mongoose_1.default.models.MediaInteraction ||
    mongoose_1.default.model("MediaInteraction", mediaInteractionSchema);
