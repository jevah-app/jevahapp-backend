import mongoose, { Schema, Document } from "mongoose";

export interface IMerchandisePurchase extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  status: "paid" | "shipped" | "delivered";
  createdAt: Date;
  updatedAt: Date;
}

const merchPurchaseSchema = new Schema<IMerchandisePurchase>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["paid", "shipped", "delivered"],
      required: true,
    },
  },
  { timestamps: true }
);

export const MerchandisePurchase =
  mongoose.models.MerchandisePurchase ||
  mongoose.model<IMerchandisePurchase>("MerchPurchase", merchPurchaseSchema);
