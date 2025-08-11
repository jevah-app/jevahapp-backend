import mongoose, { Schema, Document } from "mongoose";

export interface IMerchandise extends Document {
  title: string;
  description: string;
  price: number;
  currency: string;
  stockQuantity: number;
  isAvailable: boolean;
  category: string;
  tags: string[];
  images: string[]; // Multiple product images
  thumbnailUrl: string;
  seller: mongoose.Types.ObjectId; // User who is selling
  viewCount: number;
  purchaseCount: number;
  rating: number;
  totalRatings: number;
  reviews: Array<{
    userId: mongoose.Types.ObjectId;
    rating: number;
    comment: string;
    createdAt: Date;
  }>;
  specifications: Record<string, any>; // Product specifications
  shippingInfo: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    shippingCost: number;
    estimatedDelivery: number; // Days
  };
  createdAt: Date;
  updatedAt: Date;
}

const merchandiseSchema = new Schema<IMerchandise>(
  {
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
        validator: function (images: string[]) {
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
      type: Schema.Types.ObjectId,
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
          type: Schema.Types.ObjectId,
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
      of: Schema.Types.Mixed,
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
  },
  {
    timestamps: true,
  }
);

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

export const Merchandise =
  mongoose.models.Merchandise ||
  mongoose.model<IMerchandise>("Merchandise", merchandiseSchema);
