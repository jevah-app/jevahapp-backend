import mongoose, { Schema, Document } from "mongoose";

// Define game types with enhanced interactive features
export type GameType =
  | "bible_quiz"
  | "memory_game"
  | "puzzle"
  | "coloring"
  | "word_search"
  | "matching"
  | "story_completion"
  | "music_rhythm"
  | "prayer_journal"
  | "virtue_builder"
  | "mission_adventure"
  | "worship_karaoke"
  | "scripture_memorization"
  | "character_quest"
  | "family_challenge";

// Define difficulty levels
export type GameDifficulty = "easy" | "medium" | "hard";

// Define age groups
export type AgeGroup = "3-5" | "6-8" | "9-12" | "13+";

// Define game categories
export type GameCategory =
  | "bible_stories"
  | "worship"
  | "prayer"
  | "character"
  | "missions"
  | "family"
  | "music"
  | "art"
  | "adventure"
  | "learning";

// Define game features
export type GameFeature =
  | "multiplayer"
  | "leaderboard"
  | "achievements"
  | "rewards"
  | "social_sharing"
  | "parent_progress"
  | "offline_play"
  | "voice_commands"
  | "gesture_control"
  | "ar_experience";

// Game interface
export interface IGame extends Document {
  title: string;
  description: string;
  gameType: GameType;
  difficulty: GameDifficulty;
  ageGroup: AgeGroup;
  category: GameCategory;
  imageUrl: string;
  gameUrl: string;
  instructions: string;
  maxScore: number;
  timeLimit?: number; // in seconds
  isActive: boolean;
  isPremium: boolean;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  playCount: number;
  averageScore: number;

  // Enhanced interactive features
  features: GameFeature[];
  multiplayerEnabled: boolean;
  maxPlayers?: number;
  rewards: {
    points: number;
    badges: string[];
    unlockables: string[];
  };
  educationalContent: {
    bibleVerse?: string;
    lesson?: string;
    characterTrait?: string;
    prayer?: string;
    worshipSong?: string;
  };
  interactiveElements: {
    hasVoice: boolean;
    hasGestures: boolean;
    hasAR: boolean;
    hasMultiplayer: boolean;
    hasParentMode: boolean;
  };
  difficultyProgression: {
    levels: number;
    adaptiveDifficulty: boolean;
    skillBasedScaling: boolean;
  };
  socialFeatures: {
    canShare: boolean;
    canInvite: boolean;
    canCollaborate: boolean;
    hasLeaderboards: boolean;
  };
  accessibility: {
    hasAudioDescription: boolean;
    hasSubtitles: boolean;
    hasHighContrast: boolean;
    hasLargeText: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Game session interface for tracking user progress
export interface IGameSession extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  score: number;
  timeSpent: number; // in seconds
  completed: boolean;
  achievements: string[];
  level: number;
  difficulty: GameDifficulty;
  multiplayerSession?: {
    sessionId: string;
    players: mongoose.Types.ObjectId[];
    winner?: mongoose.Types.ObjectId;
  };
  interactiveData: {
    voiceCommands: string[];
    gestures: string[];
    arInteractions: string[];
  };
  startedAt: Date;
  completedAt?: Date;
}

// Game achievement interface
export interface IGameAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  achievementType: string;
  achievementName: string;
  description: string;
  points: number;
  badgeUrl?: string;
  earnedAt: Date;
}

// Game leaderboard interface
export interface IGameLeaderboard extends Document {
  gameId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number;
  timeSpent: number;
  level: number;
  difficulty: GameDifficulty;
  date: Date;
  rank?: number;
}

// Game schema
const gameSchema = new Schema<IGame>(
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
    gameType: {
      type: String,
      enum: [
        "bible_quiz",
        "memory_game",
        "puzzle",
        "coloring",
        "word_search",
        "matching",
        "story_completion",
        "music_rhythm",
        "prayer_journal",
        "virtue_builder",
        "mission_adventure",
        "worship_karaoke",
        "scripture_memorization",
        "character_quest",
        "family_challenge",
      ],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      required: true,
    },
    ageGroup: {
      type: String,
      enum: ["3-5", "6-8", "9-12", "13+"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "bible_stories",
        "worship",
        "prayer",
        "character",
        "missions",
        "family",
        "music",
        "art",
        "adventure",
        "learning",
      ],
    },
    imageUrl: {
      type: String,
      required: true,
    },
    gameUrl: {
      type: String,
      required: true,
    },
    instructions: {
      type: String,
      required: true,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
    timeLimit: {
      type: Number,
      min: 30, // minimum 30 seconds
      max: 3600, // maximum 1 hour
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    playCount: {
      type: Number,
      default: 0,
    },
    averageScore: {
      type: Number,
      default: 0,
    },

    // Enhanced interactive features
    features: {
      type: [String],
      enum: [
        "multiplayer",
        "leaderboard",
        "achievements",
        "rewards",
        "social_sharing",
        "parent_progress",
        "offline_play",
        "voice_commands",
        "gesture_control",
        "ar_experience",
      ],
      default: [],
    },
    multiplayerEnabled: {
      type: Boolean,
      default: false,
    },
    maxPlayers: {
      type: Number,
      min: 2,
      max: 10,
    },
    rewards: {
      points: { type: Number, default: 0 },
      badges: { type: [String], default: [] },
      unlockables: { type: [String], default: [] },
    },
    educationalContent: {
      bibleVerse: String,
      lesson: String,
      characterTrait: String,
      prayer: String,
      worshipSong: String,
    },
    interactiveElements: {
      hasVoice: { type: Boolean, default: false },
      hasGestures: { type: Boolean, default: false },
      hasAR: { type: Boolean, default: false },
      hasMultiplayer: { type: Boolean, default: false },
      hasParentMode: { type: Boolean, default: false },
    },
    difficultyProgression: {
      levels: { type: Number, default: 1 },
      adaptiveDifficulty: { type: Boolean, default: false },
      skillBasedScaling: { type: Boolean, default: false },
    },
    socialFeatures: {
      canShare: { type: Boolean, default: true },
      canInvite: { type: Boolean, default: false },
      canCollaborate: { type: Boolean, default: false },
      hasLeaderboards: { type: Boolean, default: true },
    },
    accessibility: {
      hasAudioDescription: { type: Boolean, default: false },
      hasSubtitles: { type: Boolean, default: true },
      hasHighContrast: { type: Boolean, default: false },
      hasLargeText: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

// Game session schema
const gameSessionSchema = new Schema<IGameSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    achievements: {
      type: [String],
      default: [],
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    multiplayerSession: {
      sessionId: String,
      players: [{ type: Schema.Types.ObjectId, ref: "User" }],
      winner: { type: Schema.Types.ObjectId, ref: "User" },
    },
    interactiveData: {
      voiceCommands: { type: [String], default: [] },
      gestures: { type: [String], default: [] },
      arInteractions: { type: [String], default: [] },
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Game achievement schema
const gameAchievementSchema = new Schema<IGameAchievement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    achievementType: {
      type: String,
      required: true,
      enum: [
        "first_play",
        "high_score",
        "perfect_score",
        "speed_run",
        "completion",
        "streak",
        "multiplayer_win",
        "voice_master",
        "gesture_master",
        "ar_explorer",
        "social_butterfly",
        "persistence",
        "improvement",
        "helping_others",
      ],
    },
    achievementName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    badgeUrl: String,
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Game leaderboard schema
const gameLeaderboardSchema = new Schema<IGameLeaderboard>(
  {
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "Game",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    timeSpent: {
      type: Number,
      required: true,
      min: 0,
    },
    level: {
      type: Number,
      default: 1,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    rank: Number,
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
gameSchema.index({ gameType: 1, difficulty: 1, ageGroup: 1 });
gameSchema.index({ category: 1, isActive: 1 });
gameSchema.index({ title: "text", description: "text" });
gameSchema.index({ createdBy: 1 });
gameSchema.index({ isPremium: 1, isActive: 1 });
gameSchema.index({ features: 1 });
gameSchema.index({ multiplayerEnabled: 1 });

gameSessionSchema.index({ userId: 1, gameId: 1 });
gameSessionSchema.index({ userId: 1, completedAt: -1 });
gameSessionSchema.index({ gameId: 1, score: -1 });
gameSessionSchema.index({ "multiplayerSession.sessionId": 1 });

gameAchievementSchema.index({ userId: 1, gameId: 1 });
gameAchievementSchema.index({ userId: 1, earnedAt: -1 });
gameAchievementSchema.index({ achievementType: 1 });

gameLeaderboardSchema.index({ gameId: 1, score: -1 });
gameLeaderboardSchema.index({ gameId: 1, difficulty: 1, score: -1 });
gameLeaderboardSchema.index({ userId: 1, gameId: 1 });

// Export models
export const Game =
  mongoose.models.Game || mongoose.model<IGame>("Game", gameSchema);
export const GameSession =
  mongoose.models.GameSession ||
  mongoose.model<IGameSession>("GameSession", gameSessionSchema);
export const GameAchievement =
  mongoose.models.GameAchievement ||
  mongoose.model<IGameAchievement>("GameAchievement", gameAchievementSchema);
export const GameLeaderboard =
  mongoose.models.GameLeaderboard ||
  mongoose.model<IGameLeaderboard>("GameLeaderboard", gameLeaderboardSchema);
