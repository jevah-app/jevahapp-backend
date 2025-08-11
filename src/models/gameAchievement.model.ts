import mongoose, { Schema, Document } from "mongoose";

export interface IGameAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementType:
    | "first_play"
    | "high_score"
    | "perfect_score"
    | "completion"
    | "streak";
  points: number;
  earnedAt: Date;
}

const gameAchievementSchema = new Schema<IGameAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    achievementType: {
      type: String,
      enum: [
        "first_play",
        "high_score",
        "perfect_score",
        "completion",
        "streak",
      ],
      required: true,
    },
    points: {
      type: Number,
      default: 0,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const GameAchievement =
  mongoose.models.GameAchievement ||
  mongoose.model<IGameAchievement>("GameAchievement", gameAchievementSchema);
