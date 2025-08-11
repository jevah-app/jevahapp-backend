"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// GET /api/notifications - Fetch user-specific notifications
router.get("/", auth_middleware_1.verifyToken, notification_controller_1.getNotifications);
// PATCH /api/notifications/:id - Mark a specific notification as read
router.patch("/:id", auth_middleware_1.verifyToken, notification_controller_1.markNotificationAsRead);
// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch("/mark-all-read", auth_middleware_1.verifyToken, notification_controller_1.markAllNotificationsAsRead);
exports.default = router;
