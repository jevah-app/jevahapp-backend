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
exports.markAllNotificationsAsRead = exports.markNotificationAsRead = exports.getNotifications = void 0;
const notification_model_1 = require("../models/notification.model");
/**
 * Get all notifications for the current user
 */
const getNotifications = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const notifications = yield notification_model_1.Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(100);
        response.status(200).json({
            success: true,
            notifications,
        });
    }
    catch (error) {
        console.error("Get notifications error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to fetch notifications",
        });
    }
});
exports.getNotifications = getNotifications;
/**
 * Mark a single notification as read
 */
const markNotificationAsRead = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notificationId = request.params.id;
        const userId = request.userId;
        const notification = yield notification_model_1.Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { isRead: true }, { new: true });
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
    }
    catch (error) {
        console.error("Mark notification error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to mark notification",
        });
    }
});
exports.markNotificationAsRead = markNotificationAsRead;
/**
 * Mark all notifications for the current user as read
 */
const markAllNotificationsAsRead = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        yield notification_model_1.Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
        response.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    }
    catch (error) {
        console.error("Mark all notifications error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to mark all notifications",
        });
    }
});
exports.markAllNotificationsAsRead = markAllNotificationsAsRead;
