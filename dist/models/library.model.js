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
exports.Library = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const librarySchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    mediaId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
    },
    mediaType: {
        type: String,
        enum: ["media", "merchandise"],
        required: true,
    },
    addedAt: {
        type: Date,
        default: Date.now,
    },
    notes: {
        type: String,
        trim: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    isFavorite: {
        type: Boolean,
        default: false,
    },
    playlists: {
        type: [String],
        default: [],
    },
    lastWatched: {
        type: Date,
    },
    watchProgress: {
        type: Number,
        min: 0,
        default: 0,
    },
    completionPercentage: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
    },
}, {
    timestamps: true,
});
// Compound index to ensure unique user-media combinations
librarySchema.index({ userId: 1, mediaId: 1, mediaType: 1 }, { unique: true });
// Indexes for faster queries
librarySchema.index({ userId: 1, addedAt: -1 });
librarySchema.index({ userId: 1, isFavorite: 1 });
librarySchema.index({ userId: 1, lastWatched: -1 });
librarySchema.index({ userId: 1, rating: -1 });
exports.Library = mongoose_1.default.models.Library || mongoose_1.default.model("Library", librarySchema);
