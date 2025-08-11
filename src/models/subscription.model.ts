import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  subscriptionType: "monthly" | "yearly" | "lifetime";
  status: "active" | "cancelled" | "pending";
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

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
    status: {
      type: String,
      enum: ["active", "cancelled", "pending"],
      default: "pending",
    },
    amount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", subscriptionSchema);
