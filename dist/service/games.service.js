"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamesService = void 0;
const game_model_1 = require("../models/game.model");
const user_model_1 = require("../models/user.model");
const mongoose_1 = require("mongoose");
const email_config_1 = require("../config/email.config");
class GamesService {
    // Get all available games with filtering
    getAllGames() {
        return __awaiter(this, arguments, void 0, function* (filters = {}, page = 1, limit = 20) {
            const query = {};
            if (filters.gameType)
                query.gameType = filters.gameType;
            if (filters.difficulty)
                query.difficulty = filters.difficulty;
            if (filters.ageGroup)
                query.ageGroup = filters.ageGroup;
            if (filters.category)
                query.category = filters.category;
            if (filters.isActive !== undefined)
                query.isActive = filters.isActive;
            if (filters.isPremium !== undefined)
                query.isPremium = filters.isPremium;
            const skip = (page - 1) * limit;
            const games = yield game_model_1.Game.find(query)
                .select("title description gameType difficulty ageGroup category imageUrl maxScore timeLimit isPremium playCount averageScore")
                .skip(skip)
                .limit(limit)
                .sort({ playCount: -1, averageScore: -1 });
            const totalGames = yield game_model_1.Game.countDocuments(query);
            return {
                games,
                pagination: {
                    page,
                    limit,
                    total: totalGames,
                    pages: Math.ceil(totalGames / limit),
                },
            };
        });
    }
    // Get game by ID
    getGameById(gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!gameId) {
                throw new Error("Game ID is required");
            }
            const game = yield game_model_1.Game.findById(gameId);
            if (!game) {
                throw new Error("Game not found");
            }
            return game;
        });
    }
    // Start a game session
    startGameSession(userId, gameId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId || !gameId) {
                throw new Error("User ID and game ID are required");
            }
            // Check if user exists
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // Check if game exists and is active
            const game = yield game_model_1.Game.findById(gameId);
            if (!game) {
                throw new Error("Game not found");
            }
            if (!game.isActive) {
                throw new Error("Game is not active");
            }
            // Check if user is a kid (for kids games)
            if (game.ageGroup && user.age && user.age > 12 && game.ageGroup !== "13+") {
                throw new Error("This game is designed for younger users");
            }
            // Create new game session
            const session = yield game_model_1.GameSession.create({
                userId: new mongoose_1.Types.ObjectId(userId),
                gameId: new mongoose_1.Types.ObjectId(gameId),
                score: 0,
                timeSpent: 0,
                completed: false,
                achievements: [],
                startedAt: new Date(),
            });
            return session;
        });
    }
    // Complete a game session
    completeGameSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { userId, gameId, score, timeSpent, completed, achievements = [], } = data;
            if (!userId || !gameId) {
                throw new Error("User ID and game ID are required");
            }
            if (score < 0) {
                throw new Error("Score cannot be negative");
            }
            if (timeSpent < 0) {
                throw new Error("Time spent cannot be negative");
            }
            // Check if user and game exist
            const [user, game] = yield Promise.all([
                user_model_1.User.findById(userId),
                game_model_1.Game.findById(gameId),
            ]);
            if (!user) {
                throw new Error("User not found");
            }
            if (!game) {
                throw new Error("Game not found");
            }
            const session = yield game_model_1.GameSession.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    // Find and update the game session
                    const gameSession = yield game_model_1.GameSession.findOneAndUpdate({
                        userId: new mongoose_1.Types.ObjectId(userId),
                        gameId: new mongoose_1.Types.ObjectId(gameId),
                        completed: false,
                    }, {
                        $set: {
                            score,
                            timeSpent,
                            completed,
                            achievements,
                            completedAt: new Date(),
                        },
                    }, { session, new: true });
                    if (!gameSession) {
                        throw new Error("No active game session found");
                    }
                    // Update game statistics
                    const updateData = {
                        $inc: { playCount: 1 },
                    };
                    // Update average score
                    const allSessions = yield game_model_1.GameSession.find({
                        gameId: new mongoose_1.Types.ObjectId(gameId),
                        completed: true,
                    }).session(session);
                    const totalScore = allSessions.reduce((sum, session) => sum + session.score, 0);
                    const averageScore = allSessions.length > 0 ? totalScore / allSessions.length : 0;
                    updateData.$set = { averageScore };
                    yield game_model_1.Game.findByIdAndUpdate(gameId, updateData, { session });
                    // Check for achievements
                    yield this.checkAndAwardAchievements(userId, gameId, score, timeSpent, completed, session);
                    // Send email notification for game completion
                    if (completed && user.email && user.isKid) {
                        try {
                            yield email_config_1.EmailService.sendGameCompletedEmail(user.email, user.firstName || "Player", game.title, score);
                        }
                        catch (emailError) {
                            console.error("Failed to send game completion email:", emailError);
                        }
                    }
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, message: "Game session completed successfully" };
        });
    }
    // Check and award achievements
    checkAndAwardAchievements(userId, gameId, score, timeSpent, completed, session) {
        return __awaiter(this, void 0, void 0, function* () {
            const game = yield game_model_1.Game.findById(gameId).session(session);
            if (!game)
                return;
            const achievements = [];
            // First play achievement
            const existingSessions = yield game_model_1.GameSession.countDocuments({
                userId: new mongoose_1.Types.ObjectId(userId),
                gameId: new mongoose_1.Types.ObjectId(gameId),
            }).session(session);
            if (existingSessions === 1) {
                achievements.push({
                    userId,
                    gameId,
                    achievementType: "first_play",
                    achievementName: "First Steps",
                    description: "Played this game for the first time",
                    points: 10,
                });
            }
            // High score achievement
            const maxScore = game.maxScore;
            if (score >= maxScore * 0.8) {
                achievements.push({
                    userId,
                    gameId,
                    achievementType: "high_score",
                    achievementName: "High Achiever",
                    description: `Scored ${Math.round((score / maxScore) * 100)}% or higher`,
                    points: 25,
                });
            }
            // Perfect score achievement
            if (score >= maxScore) {
                achievements.push({
                    userId,
                    gameId,
                    achievementType: "perfect_score",
                    achievementName: "Perfect Score",
                    description: "Achieved a perfect score",
                    points: 50,
                });
            }
            // Speed run achievement (if time limit exists)
            if (game.timeLimit && timeSpent <= game.timeLimit * 0.7) {
                achievements.push({
                    userId,
                    gameId,
                    achievementType: "speed_run",
                    achievementName: "Speed Demon",
                    description: "Completed the game quickly",
                    points: 30,
                });
            }
            // Completion achievement
            if (completed) {
                achievements.push({
                    userId,
                    gameId,
                    achievementType: "completion",
                    achievementName: "Game Master",
                    description: "Completed the game",
                    points: 20,
                });
            }
            // Streak achievement (check last 3 sessions)
            const recentSessions = yield game_model_1.GameSession.find({
                userId: new mongoose_1.Types.ObjectId(userId),
                gameId: new mongoose_1.Types.ObjectId(gameId),
                completed: true,
            })
                .sort({ completedAt: -1 })
                .limit(3)
                .session(session);
            if (recentSessions.length >= 3) {
                const allHighScores = recentSessions.every((session) => session.score >= maxScore * 0.7);
                if (allHighScores) {
                    achievements.push({
                        userId,
                        gameId,
                        achievementType: "streak",
                        achievementName: "Consistent Player",
                        description: "Achieved high scores in 3 consecutive games",
                        points: 40,
                    });
                }
            }
            // Award achievements
            for (const achievement of achievements) {
                yield this.awardAchievement(achievement, session);
            }
        });
    }
    // Award an achievement
    awardAchievement(achievement, session) {
        return __awaiter(this, void 0, void 0, function* () {
            // Check if achievement already exists
            const existingAchievement = yield game_model_1.GameAchievement.findOne({
                userId: new mongoose_1.Types.ObjectId(achievement.userId),
                gameId: new mongoose_1.Types.ObjectId(achievement.gameId),
                achievementType: achievement.achievementType,
            }).session(session);
            if (!existingAchievement) {
                yield game_model_1.GameAchievement.create([achievement], { session });
            }
        });
    }
    // Get user's game sessions
    getUserGameSessions(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            if (!userId) {
                throw new Error("User ID is required");
            }
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const skip = (page - 1) * limit;
            const sessions = yield game_model_1.GameSession.find({
                userId: new mongoose_1.Types.ObjectId(userId),
            })
                .populate("gameId", "title gameType category imageUrl maxScore")
                .skip(skip)
                .limit(limit)
                .sort({ startedAt: -1 });
            const totalSessions = yield game_model_1.GameSession.countDocuments({
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            return {
                sessions,
                pagination: {
                    page,
                    limit,
                    total: totalSessions,
                    pages: Math.ceil(totalSessions / limit),
                },
            };
        });
    }
    // Get user's achievements
    getUserAchievements(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            var _a;
            if (!userId) {
                throw new Error("User ID is required");
            }
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const skip = (page - 1) * limit;
            const achievements = yield game_model_1.GameAchievement.find({
                userId: new mongoose_1.Types.ObjectId(userId),
            })
                .populate("gameId", "title gameType category imageUrl")
                .skip(skip)
                .limit(limit)
                .sort({ earnedAt: -1 });
            const totalAchievements = yield game_model_1.GameAchievement.countDocuments({
                userId: new mongoose_1.Types.ObjectId(userId),
            });
            // Calculate total points
            const totalPoints = yield game_model_1.GameAchievement.aggregate([
                { $match: { userId: new mongoose_1.Types.ObjectId(userId) } },
                { $group: { _id: null, totalPoints: { $sum: "$points" } } },
            ]);
            return {
                achievements,
                totalPoints: ((_a = totalPoints[0]) === null || _a === void 0 ? void 0 : _a.totalPoints) || 0,
                pagination: {
                    page,
                    limit,
                    total: totalAchievements,
                    pages: Math.ceil(totalAchievements / limit),
                },
            };
        });
    }
    // Get game leaderboard
    getGameLeaderboard(gameId_1) {
        return __awaiter(this, arguments, void 0, function* (gameId, limit = 10) {
            if (!gameId) {
                throw new Error("Game ID is required");
            }
            const game = yield game_model_1.Game.findById(gameId);
            if (!game) {
                throw new Error("Game not found");
            }
            const leaderboard = yield game_model_1.GameSession.aggregate([
                {
                    $match: {
                        gameId: new mongoose_1.Types.ObjectId(gameId),
                        completed: true,
                    },
                },
                {
                    $group: {
                        _id: "$userId",
                        bestScore: { $max: "$score" },
                        totalPlays: { $sum: 1 },
                        averageScore: { $avg: "$score" },
                        lastPlayed: { $max: "$completedAt" },
                    },
                },
                {
                    $sort: { bestScore: -1 },
                },
                {
                    $limit: limit,
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user",
                },
                {
                    $project: {
                        userId: "$_id",
                        firstName: "$user.firstName",
                        lastName: "$user.lastName",
                        avatar: "$user.avatar",
                        bestScore: 1,
                        totalPlays: 1,
                        averageScore: 1,
                        lastPlayed: 1,
                    },
                },
            ]);
            return leaderboard;
        });
    }
    // Get user's game statistics
    getUserGameStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!userId) {
                throw new Error("User ID is required");
            }
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const stats = yield game_model_1.GameSession.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                        completed: true,
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalGamesPlayed: { $sum: 1 },
                        totalScore: { $sum: "$score" },
                        averageScore: { $avg: "$score" },
                        totalTimeSpent: { $sum: "$timeSpent" },
                        gamesCompleted: {
                            $sum: { $cond: ["$completed", 1, 0] },
                        },
                    },
                },
            ]);
            const achievementStats = yield game_model_1.GameAchievement.aggregate([
                {
                    $match: {
                        userId: new mongoose_1.Types.ObjectId(userId),
                    },
                },
                {
                    $group: {
                        _id: null,
                        totalAchievements: { $sum: 1 },
                        totalPoints: { $sum: "$points" },
                    },
                },
            ]);
            return {
                games: stats[0] || {
                    totalGamesPlayed: 0,
                    totalScore: 0,
                    averageScore: 0,
                    totalTimeSpent: 0,
                    gamesCompleted: 0,
                },
                achievements: achievementStats[0] || {
                    totalAchievements: 0,
                    totalPoints: 0,
                },
            };
        });
    }
    // Get games by category for kids
    getGamesByCategory(category_1, ageGroup_1) {
        return __awaiter(this, arguments, void 0, function* (category, ageGroup, page = 1, limit = 20) {
            if (!category) {
                throw new Error("Category is required");
            }
            const query = { category, isActive: true };
            if (ageGroup)
                query.ageGroup = ageGroup;
            const skip = (page - 1) * limit;
            const games = yield game_model_1.Game.find(query)
                .select("title description gameType difficulty ageGroup imageUrl maxScore timeLimit isPremium playCount averageScore")
                .skip(skip)
                .limit(limit)
                .sort({ playCount: -1 });
            const totalGames = yield game_model_1.Game.countDocuments(query);
            return {
                games,
                category,
                ageGroup,
                pagination: {
                    page,
                    limit,
                    total: totalGames,
                    pages: Math.ceil(totalGames / limit),
                },
            };
        });
    }
}
exports.GamesService = GamesService;
