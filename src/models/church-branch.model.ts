// ========== ChurchBranch Model ==========

import mongoose, { Schema, Document } from "mongoose";

export interface IChurchBranch {
  churchId: mongoose.Types.ObjectId; // Reference to Church
  name: string; // e.g. RCCG Jesus House Ogba
  code: string; // e.g. JHOUSE
  state: string;
  lga?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdByUser?: mongoose.Types.ObjectId;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChurchBranchDocument extends IChurchBranch, Document {}

const churchBranchSchema = new Schema<IChurchBranchDocument>(
  {
    churchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Church",
      required: true,
    },
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    state: { type: String, required: true },
    lga: String,
    address: String,
    location: {
      lat: Number,
      lng: Number,
    },
    createdByUser: { type: Schema.Types.ObjectId, ref: "User" },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ChurchBranch =
  mongoose.models.ChurchBranch ||
  mongoose.model<IChurchBranchDocument>("ChurchBranch", churchBranchSchema);
