import { Request, Response } from "express";
import { GamesService } from "../service/games.service";
import { Types } from "mongoose";

const gamesService = new GamesService();

interface GameSessionRequestBody {
  score: number;
  timeSpent: number;
  completed: boolean;
  achievements?: string[];
}

// Get all games with filtering
export const getAllGames = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { gameType, difficulty, ageGroup, category, isActive, isPremium } =
      request.query;

    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    const filters: any = {};
    if (gameType) filters.gameType = gameType;
    if (difficulty) filters.difficulty = difficulty;
    if (ageGroup) filters.ageGroup = ageGroup;
    if (category) filters.category = category;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (isPremium !== undefined) filters.isPremium = isPremium === "true";

    const result = await gamesService.getAllGames(filters, page, limit);

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Get all games error:", error);

    response.status(500).json({
      success: false,
      message: "Failed to get games",
    });
  }
};

// Get game by ID
export const getGameById = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { gameId } = request.params;

    if (!gameId || !Types.ObjectId.isValid(gameId)) {
      response.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
      return;
    }

    const game = await gamesService.getGameById(gameId);

    response.status(200).json({
      success: true,
      data: game,
    });
  } catch (error: unknown) {
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
};

// Start a game session
export const startGameSession = async (
  request: Request,
  response: Response
): Promise<void> => {
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

    if (!gameId || !Types.ObjectId.isValid(gameId)) {
      response.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
      return;
    }

    const session = await gamesService.startGameSession(userId, gameId);

    response.status(201).json({
      success: true,
      message: "Game session started successfully",
      data: session,
    });
  } catch (error: unknown) {
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
};

// Complete a game session
export const completeGameSession = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { gameId } = request.params;
    const { score, timeSpent, completed, achievements } =
      request.body as GameSessionRequestBody;
    const userId = request.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!gameId || !Types.ObjectId.isValid(gameId)) {
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

    const result = await gamesService.completeGameSession({
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
  } catch (error: unknown) {
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
};

// Get user's game sessions
export const getUserGameSessions = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await gamesService.getUserGameSessions(userId, page, limit);

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Get user's achievements
export const getUserAchievements = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await gamesService.getUserAchievements(userId, page, limit);

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Get game leaderboard
export const getGameLeaderboard = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { gameId } = request.params;
    const limit = parseInt(request.query.limit as string) || 10;

    if (!gameId || !Types.ObjectId.isValid(gameId)) {
      response.status(400).json({
        success: false,
        message: "Invalid game ID",
      });
      return;
    }

    const leaderboard = await gamesService.getGameLeaderboard(gameId, limit);

    response.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error: unknown) {
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
};

// Get user's game statistics
export const getUserGameStats = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const stats = await gamesService.getUserGameStats(userId);

    response.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
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
};

// Get games by category
export const getGamesByCategory = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { category } = request.params;
    const { ageGroup } = request.query;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!category) {
      response.status(400).json({
        success: false,
        message: "Category is required",
      });
      return;
    }

    const result = await gamesService.getGamesByCategory(
      category,
      ageGroup as string,
      page,
      limit
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};
