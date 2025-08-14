import { Request, Response } from "express";
import { userProfileService } from "../service/userProfile.service";
import { asyncHandler } from "../utils/asyncHandler";

/**
 * Get user profile by ID
 */
export const getUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const userProfile = await userProfileService.getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User profile retrieved successfully",
      data: userProfile,
    });
  }
);

/**
 * Get multiple user profiles by IDs
 */
export const getMultipleUserProfiles = asyncHandler(
  async (req: Request, res: Response) => {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "User IDs array is required",
      });
    }

    const userProfiles =
      await userProfileService.getMultipleUserProfiles(userIds);

    res.status(200).json({
      success: true,
      message: "User profiles retrieved successfully",
      data: userProfiles,
    });
  }
);

/**
 * Search user profiles
 */
export const searchUserProfiles = asyncHandler(
  async (req: Request, res: Response) => {
    const { query, limit } = req.query;

    if (!query || typeof query !== "string") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const limitNumber = limit ? parseInt(limit as string) : 10;
    const userProfiles = await userProfileService.searchUserProfiles(
      query,
      limitNumber
    );

    res.status(200).json({
      success: true,
      message: "User profiles search completed",
      data: userProfiles,
    });
  }
);

/**
 * Get current user's profile
 */
export const getCurrentUserProfile = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const userProfile = await userProfileService.getUserProfile(userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Current user profile retrieved successfully",
      data: userProfile,
    });
  }
);

