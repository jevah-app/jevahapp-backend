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
exports.Merchandise = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const merchandiseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    currency: {
        type: String,
        default: "USD",
    },
    stockQuantity: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    category: {
        type: String,
        required: true,
        enum: [
            "clothing",
            "accessories",
            "books",
            "music",
            "home",
            "gifts",
            "electronics",
            "other",
        ],
    },
    tags: {
        type: [String],
        default: [],
    },
    images: {
        type: [String],
        required: true,
        validate: {
            validator: function (images) {
                return images.length > 0;
            },
            message: "At least one product image is required",
        },
    },
    thumbnailUrl: {
        type: String,
        required: true,
    },
    seller: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    viewCount: {
        type: Number,
        default: 0,
    },
    purchaseCount: {
        type: Number,
        default: 0,
    },
    rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    totalRatings: {
        type: Number,
        default: 0,
    },
    reviews: [
        {
            userId: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            rating: {
                type: Number,
                required: true,
                min: 1,
                max: 5,
            },
            comment: {
                type: String,
                trim: true,
            },
            createdAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
    specifications: {
        type: Map,
        of: mongoose_1.Schema.Types.Mixed,
        default: {},
    },
    shippingInfo: {
        weight: {
            type: Number,
            required: true,
            min: 0,
        },
        dimensions: {
            length: {
                type: Number,
                required: true,
                min: 0,
            },
            width: {
                type: Number,
                required: true,
                min: 0,
            },
            height: {
                type: Number,
                required: true,
                min: 0,
            },
        },
        shippingCost: {
            type: Number,
            required: true,
            min: 0,
        },
        estimatedDelivery: {
            type: Number,
            required: true,
            min: 1,
        },
    },
}, {
    timestamps: true,
});
// Indexes for faster queries
merchandiseSchema.index({ seller: 1, createdAt: -1 });
merchandiseSchema.index({ category: 1, isAvailable: 1 });
merchandiseSchema.index({ price: 1 });
merchandiseSchema.index({ rating: -1, totalRatings: -1 });
merchandiseSchema.index({ viewCount: -1 });
merchandiseSchema.index({ purchaseCount: -1 });
merchandiseSchema.index({ tags: 1 });
merchandiseSchema.index({
    title: "text",
    description: "text",
    tags: "text",
});
exports.Merchandise = mongoose_1.default.models.Merchandise ||
    mongoose_1.default.model("Merchandise", merchandiseSchema);
