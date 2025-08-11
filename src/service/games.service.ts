import { Game, GameSession, GameAchievement } from "../models/game.model";
import { User } from "../models/user.model";
import { Types, ClientSession } from "mongoose";
import { EmailService } from "../config/email.config";

interface GameSessionInput {
  userId: string;
  gameId: string;
  score: number;
  timeSpent: number;
  completed: boolean;
  achievements?: string[];
}

interface GameAchievementInput {
  userId: string;
  gameId: string;
  achievementType: string;
  achievementName: string;
  description: string;
  points: number;
}

export class GamesService {
  // Get all available games with filtering
  async getAllGames(
    filters: {
      gameType?: string;
      difficulty?: string;
      ageGroup?: string;
      category?: string;
      isActive?: boolean;
      isPremium?: boolean;
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const query: any = {};

    if (filters.gameType) query.gameType = filters.gameType;
    if (filters.difficulty) query.difficulty = filters.difficulty;
    if (filters.ageGroup) query.ageGroup = filters.ageGroup;
    if (filters.category) query.category = filters.category;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.isPremium !== undefined) query.isPremium = filters.isPremium;

    const skip = (page - 1) * limit;

    const games = await Game.find(query)
      .select(
        "title description gameType difficulty ageGroup category imageUrl maxScore timeLimit isPremium playCount averageScore"
      )
      .skip(skip)
      .limit(limit)
      .sort({ playCount: -1, averageScore: -1 });

    const totalGames = await Game.countDocuments(query);

    return {
      games,
      pagination: {
        page,
        limit,
        total: totalGames,
        pages: Math.ceil(totalGames / limit),
      },
    };
  }

  // Get game by ID
  async getGameById(gameId: string) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    return game;
  }

  // Start a game session
  async startGameSession(userId: string, gameId: string) {
    if (!userId || !gameId) {
      throw new Error("User ID and game ID are required");
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if game exists and is active
    const game = await Game.findById(gameId);
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
    const session = await GameSession.create({
      userId: new Types.ObjectId(userId),
      gameId: new Types.ObjectId(gameId),
      score: 0,
      timeSpent: 0,
      completed: false,
      achievements: [],
      startedAt: new Date(),
    });

    return session;
  }

  // Complete a game session
  async completeGameSession(data: GameSessionInput) {
    const {
      userId,
      gameId,
      score,
      timeSpent,
      completed,
      achievements = [],
    } = data;

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
    const [user, game] = await Promise.all([
      User.findById(userId),
      Game.findById(gameId),
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    if (!game) {
      throw new Error("Game not found");
    }

    const session: ClientSession = await GameSession.startSession();
    try {
      await session.withTransaction(async () => {
        // Find and update the game session
        const gameSession = await GameSession.findOneAndUpdate(
          {
            userId: new Types.ObjectId(userId),
            gameId: new Types.ObjectId(gameId),
            completed: false,
          },
          {
            $set: {
              score,
              timeSpent,
              completed,
              achievements,
              completedAt: new Date(),
            },
          },
          { session, new: true }
        );

        if (!gameSession) {
          throw new Error("No active game session found");
        }

        // Update game statistics
        const updateData: any = {
          $inc: { playCount: 1 },
        };

        // Update average score
        const allSessions = await GameSession.find({
          gameId: new Types.ObjectId(gameId),
          completed: true,
        }).session(session);

        const totalScore = allSessions.reduce(
          (sum, session) => sum + session.score,
          0
        );
        const averageScore =
          allSessions.length > 0 ? totalScore / allSessions.length : 0;

        updateData.$set = { averageScore };

        await Game.findByIdAndUpdate(gameId, updateData, { session });

        // Check for achievements
        await this.checkAndAwardAchievements(
          userId,
          gameId,
          score,
          timeSpent,
          completed,
          session
        );

        // Send email notification for game completion
        if (completed && user.email && user.isKid) {
          try {
            await EmailService.sendGameCompletedEmail(
              user.email,
              user.firstName || "Player",
              game.title,
              score
            );
          } catch (emailError) {
            console.error("Failed to send game completion email:", emailError);
          }
        }
      });
    } finally {
      session.endSession();
    }

    return { success: true, message: "Game session completed successfully" };
  }

  // Check and award achievements
  private async checkAndAwardAchievements(
    userId: string,
    gameId: string,
    score: number,
    timeSpent: number,
    completed: boolean,
    session: ClientSession
  ) {
    const game = await Game.findById(gameId).session(session);
    if (!game) return;

    const achievements: GameAchievementInput[] = [];

    // First play achievement
    const existingSessions = await GameSession.countDocuments({
      userId: new Types.ObjectId(userId),
      gameId: new Types.ObjectId(gameId),
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
    const recentSessions = await GameSession.find({
      userId: new Types.ObjectId(userId),
      gameId: new Types.ObjectId(gameId),
      completed: true,
    })
      .sort({ completedAt: -1 })
      .limit(3)
      .session(session);

    if (recentSessions.length >= 3) {
      const allHighScores = recentSessions.every(
        (session) => session.score >= maxScore * 0.7
      );
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
      await this.awardAchievement(achievement, session);
    }
  }

  // Award an achievement
  private async awardAchievement(
    achievement: GameAchievementInput,
    session: ClientSession
  ) {
    // Check if achievement already exists
    const existingAchievement = await GameAchievement.findOne({
      userId: new Types.ObjectId(achievement.userId),
      gameId: new Types.ObjectId(achievement.gameId),
      achievementType: achievement.achievementType,
    }).session(session);

    if (!existingAchievement) {
      await GameAchievement.create([achievement], { session });
    }
  }

  // Get user's game sessions
  async getUserGameSessions(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const skip = (page - 1) * limit;

    const sessions = await GameSession.find({
      userId: new Types.ObjectId(userId),
    })
      .populate("gameId", "title gameType category imageUrl maxScore")
      .skip(skip)
      .limit(limit)
      .sort({ startedAt: -1 });

    const totalSessions = await GameSession.countDocuments({
      userId: new Types.ObjectId(userId),
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
  }

  // Get user's achievements
  async getUserAchievements(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const skip = (page - 1) * limit;

    const achievements = await GameAchievement.find({
      userId: new Types.ObjectId(userId),
    })
      .populate("gameId", "title gameType category imageUrl")
      .skip(skip)
      .limit(limit)
      .sort({ earnedAt: -1 });

    const totalAchievements = await GameAchievement.countDocuments({
      userId: new Types.ObjectId(userId),
    });

    // Calculate total points
    const totalPoints = await GameAchievement.aggregate([
      { $match: { userId: new Types.ObjectId(userId) } },
      { $group: { _id: null, totalPoints: { $sum: "$points" } } },
    ]);

    return {
      achievements,
      totalPoints: totalPoints[0]?.totalPoints || 0,
      pagination: {
        page,
        limit,
        total: totalAchievements,
        pages: Math.ceil(totalAchievements / limit),
      },
    };
  }

  // Get game leaderboard
  async getGameLeaderboard(gameId: string, limit: number = 10) {
    if (!gameId) {
      throw new Error("Game ID is required");
    }

    const game = await Game.findById(gameId);
    if (!game) {
      throw new Error("Game not found");
    }

    const leaderboard = await GameSession.aggregate([
      {
        $match: {
          gameId: new Types.ObjectId(gameId),
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
  }

  // Get user's game statistics
  async getUserGameStats(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const stats = await GameSession.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
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

    const achievementStats = await GameAchievement.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
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
  }

  // Get games by category for kids
  async getGamesByCategory(
    category: string,
    ageGroup?: string,
    page: number = 1,
    limit: number = 20
  ) {
    if (!category) {
      throw new Error("Category is required");
    }

    const query: any = { category, isActive: true };
    if (ageGroup) query.ageGroup = ageGroup;

    const skip = (page - 1) * limit;

    const games = await Game.find(query)
      .select(
        "title description gameType difficulty ageGroup imageUrl maxScore timeLimit isPremium playCount averageScore"
      )
      .skip(skip)
      .limit(limit)
      .sort({ playCount: -1 });

    const totalGames = await Game.countDocuments(query);

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
  }
}
