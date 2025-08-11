import mongoose, { Schema, Document } from "mongoose";

export interface IChurch {
  name: string;
  branchName?: string;
  denomination?: string;
  address?: string;
  state: string;
  lga?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdByUser?: mongoose.Types.ObjectId; // optional
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChurchDocument extends IChurch, Document {}

const churchSchema = new Schema<IChurchDocument>(
  {
    name: { type: String, required: true },
    branchName: { type: String },
    denomination: { type: String },
    address: { type: String },
    state: { type: String, required: true },
    lga: { type: String },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    createdByUser: { type: Schema.Types.ObjectId, ref: "User" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Church =
  mongoose.models.Church ||
  mongoose.model<IChurchDocument>("Church", churchSchema);
