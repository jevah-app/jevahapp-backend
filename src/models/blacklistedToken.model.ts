import mongoose, { Schema, Document } from "mongoose";

export interface IBlacklistedToken extends Document {
  token: string;
  expiresAt: Date;
}

const BlacklistedTokenSchema: Schema = new Schema({
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expires: "0" } }, // TTL index for auto-expiration
});

export const BlacklistedToken = mongoose.model<IBlacklistedToken>(
  "BlacklistedToken",
  BlacklistedTokenSchema
);
