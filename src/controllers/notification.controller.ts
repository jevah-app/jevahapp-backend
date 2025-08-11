import { Request, Response } from "express";
import { Notification } from "../models/notification.model";

/**
 * Get all notifications for the current user
 */
export const getNotifications = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;

    const notifications = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    response.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationAsRead = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const notificationId = request.params.id;
    const userId = request.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      response.status(404).json({
        success: false,
        message: "Notification not found",
      });
      return;
    }

    response.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to mark notification",
    });
  }
};

/**
 * Mark all notifications for the current user as read
 */
export const markAllNotificationsAsRead = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;

    await Notification.updateMany(
      { user: userId, isRead: false },
      { $set: { isRead: true } }
    );

    response.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark all notifications error:", error);
    response.status(500).json({
      success: false,
      message: "Failed to mark all notifications",
    });
  }
};
