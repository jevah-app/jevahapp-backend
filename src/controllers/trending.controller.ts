import { Request, Response } from "express";
import { trendingService } from "../service/trending.service";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Get trending users based on overall engagement
 */
export const getTrendingUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getTrendingUsers(limit);

    res.status(200).json({
      success: true,
      message: "Trending users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get users with most viewed content
 */
export const getMostViewedUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getMostViewedUsers(limit);

    res.status(200).json({
      success: true,
      message: "Most viewed users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get users with most read ebooks
 */
export const getMostReadEbookUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getMostReadEbookUsers(limit);

    res.status(200).json({
      success: true,
      message: "Most read ebook users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get users with most listened audio content
 */
export const getMostListenedAudioUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getMostListenedAudioUsers(limit);

    res.status(200).json({
      success: true,
      message: "Most listened audio users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get users with most heard sermons
 */
export const getMostHeardSermonUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getMostHeardSermonUsers(limit);

    res.status(200).json({
      success: true,
      message: "Most heard sermon users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get users with most checked out live streams
 */
export const getMostCheckedOutLiveUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const users = await trendingService.getMostCheckedOutLiveUsers(limit);

    res.status(200).json({
      success: true,
      message: "Most checked out live users retrieved successfully",
      data: users,
    });
  }
);

/**
 * Get live stream timing categories
 */
export const getLiveStreamTiming = asyncHandler(
  async (req: Request, res: Response) => {
    const timing = await trendingService.getLiveStreamTiming();

    res.status(200).json({
      success: true,
      message: "Live stream timing data retrieved successfully",
      data: timing,
    });
  }
);

/**
 * Get comprehensive trending analytics
 */
export const getTrendingAnalytics = asyncHandler(
  async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 20;

    const [
      trendingUsers,
      mostViewedUsers,
      mostReadEbookUsers,
      mostListenedAudioUsers,
      mostHeardSermonUsers,
      mostCheckedOutLiveUsers,
      liveStreamTiming,
    ] = await Promise.all([
      trendingService.getTrendingUsers(limit),
      trendingService.getMostViewedUsers(limit),
      trendingService.getMostReadEbookUsers(limit),
      trendingService.getMostListenedAudioUsers(limit),
      trendingService.getMostHeardSermonUsers(limit),
      trendingService.getMostCheckedOutLiveUsers(limit),
      trendingService.getLiveStreamTiming(),
    ]);

    res.status(200).json({
      success: true,
      message: "Trending analytics retrieved successfully",
      data: {
        trendingUsers,
        mostViewedUsers,
        mostReadEbookUsers,
        mostListenedAudioUsers,
        mostHeardSermonUsers,
        mostCheckedOutLiveUsers,
        liveStreamTiming,
      },
    });
  }
);

