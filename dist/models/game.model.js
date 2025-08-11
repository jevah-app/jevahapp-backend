"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLeaderboard = exports.GameAchievement = exports.GameSession = exports.Game = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// Game schema
const gameSchema = new mongoose_1.Schema({
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
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Game session schema
const gameSessionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    gameId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
        players: [{ type: mongoose_1.Schema.Types.ObjectId, ref: "User" }],
        winner: { type: mongoose_1.Schema.Types.ObjectId, ref: "User" },
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
}, {
    timestamps: true,
});
// Game achievement schema
const gameAchievementSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    gameId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
// Game leaderboard schema
const gameLeaderboardSchema = new mongoose_1.Schema({
    gameId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Game",
        required: true,
    },
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true,
});
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
exports.Game = mongoose_1.default.models.Game || mongoose_1.default.model("Game", gameSchema);
exports.GameSession = mongoose_1.default.models.GameSession ||
    mongoose_1.default.model("GameSession", gameSessionSchema);
exports.GameAchievement = mongoose_1.default.models.GameAchievement ||
    mongoose_1.default.model("GameAchievement", gameAchievementSchema);
exports.GameLeaderboard = mongoose_1.default.models.GameLeaderboard ||
    mongoose_1.default.model("GameLeaderboard", gameLeaderboardSchema);
