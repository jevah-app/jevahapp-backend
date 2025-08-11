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
exports.getGamesByCategory = exports.getUserGameStats = exports.getGameLeaderboard = exports.getUserAchievements = exports.getUserGameSessions = exports.completeGameSession = exports.startGameSession = exports.getGameById = exports.getAllGames = void 0;
const games_service_1 = require("../service/games.service");
const mongoose_1 = require("mongoose");
const gamesService = new games_service_1.GamesService();
// Get all games with filtering
const getAllGames = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameType, difficulty, ageGroup, category, isActive, isPremium } = request.query;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        const filters = {};
        if (gameType)
            filters.gameType = gameType;
        if (difficulty)
            filters.difficulty = difficulty;
        if (ageGroup)
            filters.ageGroup = ageGroup;
        if (category)
            filters.category = category;
        if (isActive !== undefined)
            filters.isActive = isActive === "true";
        if (isPremium !== undefined)
            filters.isPremium = isPremium === "true";
        const result = yield gamesService.getAllGames(filters, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get all games error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to get games",
        });
    }
});
exports.getAllGames = getAllGames;
// Get game by ID
const getGameById = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = request.params;
        if (!gameId || !mongoose_1.Types.ObjectId.isValid(gameId)) {
            response.status(400).json({
                success: false,
                message: "Invalid game ID",
            });
            return;
        }
        const game = yield gamesService.getGameById(gameId);
        response.status(200).json({
            success: true,
            data: game,
        });
    }
    catch (error) {
        console.error("Get game by ID error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get game",
        });
    }
});
exports.getGameById = getGameById;
// Start a game session
const startGameSession = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = request.params;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!gameId || !mongoose_1.Types.ObjectId.isValid(gameId)) {
            response.status(400).json({
                success: false,
                message: "Invalid game ID",
            });
            return;
        }
        const session = yield gamesService.startGameSession(userId, gameId);
        response.status(201).json({
            success: true,
            message: "Game session started successfully",
            data: session,
        });
    }
    catch (error) {
        console.error("Start game session error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not active")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("younger users")) {
                response.status(403).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to start game session",
        });
    }
});
exports.startGameSession = startGameSession;
// Complete a game session
const completeGameSession = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = request.params;
        const { score, timeSpent, completed, achievements } = request.body;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!gameId || !mongoose_1.Types.ObjectId.isValid(gameId)) {
            response.status(400).json({
                success: false,
                message: "Invalid game ID",
            });
            return;
        }
        if (typeof score !== "number" || score < 0) {
            response.status(400).json({
                success: false,
                message: "Score must be a non-negative number",
            });
            return;
        }
        if (typeof timeSpent !== "number" || timeSpent < 0) {
            response.status(400).json({
                success: false,
                message: "Time spent must be a non-negative number",
            });
            return;
        }
        const result = yield gamesService.completeGameSession({
            userId,
            gameId,
            score,
            timeSpent,
            completed: completed || false,
            achievements: achievements || [],
        });
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Complete game session error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("No active game session")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("negative")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to complete game session",
        });
    }
});
exports.completeGameSession = completeGameSession;
// Get user's game sessions
const getUserGameSessions = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const result = yield gamesService.getUserGameSessions(userId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get user game sessions error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get game sessions",
        });
    }
});
exports.getUserGameSessions = getUserGameSessions;
// Get user's achievements
const getUserAchievements = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const result = yield gamesService.getUserAchievements(userId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get user achievements error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get achievements",
        });
    }
});
exports.getUserAchievements = getUserAchievements;
// Get game leaderboard
const getGameLeaderboard = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { gameId } = request.params;
        const limit = parseInt(request.query.limit) || 10;
        if (!gameId || !mongoose_1.Types.ObjectId.isValid(gameId)) {
            response.status(400).json({
                success: false,
                message: "Invalid game ID",
            });
            return;
        }
        const leaderboard = yield gamesService.getGameLeaderboard(gameId, limit);
        response.status(200).json({
            success: true,
            data: leaderboard,
        });
    }
    catch (error) {
        console.error("Get game leaderboard error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get leaderboard",
        });
    }
});
exports.getGameLeaderboard = getGameLeaderboard;
// Get user's game statistics
const getUserGameStats = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const stats = yield gamesService.getUserGameStats(userId);
        response.status(200).json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        console.error("Get user game stats error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get game statistics",
        });
    }
});
exports.getUserGameStats = getUserGameStats;
// Get games by category
const getGamesByCategory = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category } = request.params;
        const { ageGroup } = request.query;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!category) {
            response.status(400).json({
                success: false,
                message: "Category is required",
            });
            return;
        }
        const result = yield gamesService.getGamesByCategory(category, ageGroup, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get games by category error:", error);
        if (error instanceof Error) {
            if (error.message.includes("required")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get games by category",
        });
    }
});
exports.getGamesByCategory = getGamesByCategory;
