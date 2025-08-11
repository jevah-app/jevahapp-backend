import mongoose, { Schema, Document } from "mongoose";
import {
  PaymentProcessor,
  PaymentStatus,
  SubscriptionType,
} from "../config/payment.config";

// Payment transaction interface
export interface IPaymentTransaction extends Document {
  userId: mongoose.Types.ObjectId;
  reference: string;
  amount: number;
  currency: string;
  paymentProcessor: PaymentProcessor;
  status: PaymentStatus;
  type: "subscription" | "merch_purchase";
  metadata: {
    subscriptionType?: SubscriptionType;
    merchItemId?: string;
    artistId?: string;
    quantity?: number;
    shippingAddress?: {
      address: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
  };
  processorReference?: string;
  processorResponse?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription interface
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionType: SubscriptionType;
  amount: number;
  currency: string;
  status: "active" | "cancelled" | "expired" | "pending";
  startDate: Date;
  endDate: Date;
  paymentTransaction: mongoose.Types.ObjectId;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Merch purchase interface
export interface IMerchPurchase extends Document {
  userId: mongoose.Types.ObjectId;
  artistId: mongoose.Types.ObjectId;
  merchItemId: string;
  quantity: number;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  paymentTransaction: mongoose.Types.ObjectId;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Payment transaction schema
const paymentTransactionSchema = new Schema<IPaymentTransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reference: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    paymentProcessor: {
      type: String,
      enum: ["paystack", "flutterwave", "paypal", "stripe"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "successful", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    type: {
      type: String,
      enum: ["subscription", "merch_purchase"],
      required: true,
    },
    metadata: {
      subscriptionType: {
        type: String,
        enum: ["monthly", "yearly", "lifetime"],
      },
      merchItemId: String,
      artistId: Schema.Types.ObjectId,
      quantity: Number,
      shippingAddress: {
        address: String,
        city: String,
        state: String,
        country: String,
        postalCode: String,
      },
    },
    processorReference: String,
    processorResponse: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Subscription schema
const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionType: {
      type: String,
      enum: ["monthly", "yearly", "lifetime"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["active", "cancelled", "expired", "pending"],
      default: "pending",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    paymentTransaction: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Merch purchase schema
const merchPurchaseSchema = new Schema<IMerchPurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    artistId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    merchItemId: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    paymentTransaction: {
      type: Schema.Types.ObjectId,
      ref: "PaymentTransaction",
      required: true,
    },
    shippingAddress: {
      address: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    trackingNumber: String,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ reference: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ paymentProcessor: 1 });

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

merchPurchaseSchema.index({ userId: 1, createdAt: -1 });
merchPurchaseSchema.index({ artistId: 1, createdAt: -1 });
merchPurchaseSchema.index({ status: 1 });

// Export models
export const PaymentTransaction =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransaction>(
    "PaymentTransaction",
    paymentTransactionSchema
  );

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);

export const MerchPurchase =
  mongoose.models.MerchPurchase ||
  mongoose.model<IMerchPurchase>("MerchPurchase", merchPurchaseSchema);
