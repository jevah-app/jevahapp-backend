import mongoose, { Schema, Document } from "mongoose";

export interface IStateCity extends Document {
  state: string;
  city: string;
}

const stateCitySchema = new Schema<IStateCity>({
  state: { type: String, required: true },
  city: { type: String, required: true },
});

export const StateCity =
  mongoose.models.StateCity ||
  mongoose.model<IStateCity>("StateCity", stateCitySchema);
