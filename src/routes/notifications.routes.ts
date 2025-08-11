import { Router } from "express";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../controllers/notification.controller";
import { verifyToken } from "../middleware/auth.middleware";

const router = Router();

// GET /api/notifications - Fetch user-specific notifications
router.get("/", verifyToken, getNotifications);

// PATCH /api/notifications/:id - Mark a specific notification as read
router.patch("/:id", verifyToken, markNotificationAsRead);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch("/mark-all-read", verifyToken, markAllNotificationsAsRead);

export default router;
