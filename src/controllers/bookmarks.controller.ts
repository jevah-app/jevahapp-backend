import { Request, Response } from "express";
import { Bookmark } from "../models/bookmark.model";

/**
 * Get all bookmarked media for the current user
 */
export const getBookmarkedMedia = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;

    const bookmarks = await Bookmark.find({ user: userId }).populate("media");

    const bookmarkedMedia = bookmarks.map((bookmark) => bookmark.media);

    response.status(200).json({
      success: true,
      media: bookmarkedMedia,
    });
  } catch (error) {
    console.error("Fetch bookmarks error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to fetch bookmarked media",
    });
  }
};

/**
 * Add a media item to the user's bookmarks
 */
export const addBookmark = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const mediaId = request.params.id;

    const existing = await Bookmark.findOne({ user: userId, media: mediaId });

    if (existing) {
      response.status(400).json({
        success: false,
        message: "Media already bookmarked",
      });
      return;
    }

    const bookmark = new Bookmark({ user: userId, media: mediaId });
    await bookmark.save();

    response.status(201).json({
      success: true,
      message: "Media bookmarked successfully",
    });
  } catch (error) {
    console.error("Add bookmark error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to bookmark media",
    });
  }
};

/**
 * Remove a media item from the user's bookmarks
 */
export const removeBookmark = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const mediaId = request.params.id;

    const result = await Bookmark.findOneAndDelete({
      user: userId,
      media: mediaId,
    });

    if (!result) {
      response.status(404).json({
        success: false,
        message: "Bookmark not found",
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Bookmark removed successfully",
    });
  } catch (error) {
    console.error("Remove bookmark error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to remove bookmark",
    });
  }
};
