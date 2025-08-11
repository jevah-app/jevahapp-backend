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
exports.AuditService = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
class AuditService {
    // Log user activity
    static logActivity(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, action, resourceType, resourceId, metadata, ipAddress, userAgent, location, } = data;
                // Add activity to user's activity log
                yield user_model_1.User.findByIdAndUpdate(userId, {
                    $push: {
                        userActivities: {
                            action,
                            resourceType,
                            resourceId: resourceId ? new mongoose_1.Types.ObjectId(resourceId) : undefined,
                            metadata,
                            ipAddress,
                            userAgent,
                            timestamp: new Date(),
                        },
                    },
                });
                // Log to console for development
                if (process.env.NODE_ENV === "development") {
                    console.log(`[AUDIT] User ${userId} performed ${action} on ${resourceType}${resourceId ? ` (${resourceId})` : ""}`);
                }
            }
            catch (error) {
                console.error("Failed to log activity:", error);
            }
        });
    }
    // Log security event
    static logSecurityEvent(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId, eventType, severity, description, metadata, ipAddress, userAgent, resolved = false, } = data;
                // Log security event
                console.error(`[SECURITY] ${severity.toUpperCase()}: ${eventType} - ${description}${userId ? ` (User: ${userId})` : ""}`);
                // If user is involved, add to their activity log
                if (userId) {
                    yield user_model_1.User.findByIdAndUpdate(userId, {
                        $push: {
                            userActivities: {
                                action: "security_alert",
                                resourceType: "security",
                                resourceId: new mongoose_1.Types.ObjectId(),
                                metadata: Object.assign({ eventType,
                                    severity,
                                    description }, metadata),
                                ipAddress,
                                userAgent,
                                timestamp: new Date(),
                            },
                        },
                    });
                }
            }
            catch (error) {
                console.error("Failed to log security event:", error);
            }
        });
    }
    // Log login activity
    static logLogin(userId, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logActivity({
                userId,
                action: "login",
                resourceType: "auth",
                ipAddress,
                userAgent,
                timestamp: new Date(),
            });
            // Update user's last login info
            yield user_model_1.User.findByIdAndUpdate(userId, {
                lastLoginAt: new Date(),
                lastLoginIp: ipAddress,
                failedLoginAttempts: 0,
            });
        });
    }
    // Log failed login attempt
    static logFailedLogin(email, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = (yield user_model_1.User.findOne({ email }));
            if (user) {
                const failedAttempts = (user.failedLoginAttempts || 0) + 1;
                yield user_model_1.User.findByIdAndUpdate(user._id, {
                    failedLoginAttempts: failedAttempts,
                    accountLockedUntil: failedAttempts >= 5
                        ? new Date(Date.now() + 15 * 60 * 1000)
                        : undefined,
                });
                yield this.logSecurityEvent({
                    userId: user._id.toString(),
                    eventType: "failed_login",
                    severity: failedAttempts >= 3 ? "medium" : "low",
                    description: `Failed login attempt ${failedAttempts} for user ${email}`,
                    metadata: { email, failedAttempts },
                    ipAddress,
                    userAgent,
                    resolved: false,
                    timestamp: new Date(),
                });
            }
        });
    }
    // Log media interaction
    static logMediaInteraction(userId, action, mediaId, metadata, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logActivity({
                userId,
                action,
                resourceType: "media",
                resourceId: mediaId,
                metadata,
                ipAddress,
                userAgent,
                timestamp: new Date(),
            });
        });
    }
    // Log payment activity
    static logPaymentActivity(userId, action, amount, currency, paymentProcessor, success, metadata, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logActivity({
                userId,
                action,
                resourceType: "payment",
                metadata: Object.assign({ amount,
                    currency,
                    paymentProcessor,
                    success }, metadata),
                ipAddress,
                userAgent,
                timestamp: new Date(),
            });
            if (!success) {
                yield this.logSecurityEvent({
                    userId,
                    eventType: "payment_failed",
                    severity: "medium",
                    description: `Payment failed for user ${userId}`,
                    metadata: { amount, currency, paymentProcessor },
                    ipAddress,
                    userAgent,
                    resolved: false,
                    timestamp: new Date(),
                });
            }
        });
    }
    // Log admin action
    static logAdminAction(adminUserId, action, targetUserId, metadata, ipAddress, userAgent) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.logActivity({
                userId: adminUserId,
                action: "admin_action",
                resourceType: "admin",
                resourceId: targetUserId,
                metadata: Object.assign({ adminAction: action }, metadata),
                ipAddress,
                userAgent,
                timestamp: new Date(),
            });
        });
    }
    // Get user activity history
    static getUserActivityHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 50, actionFilter) {
            const user = (yield user_model_1.User.findById(userId).select("userActivities"));
            if (!user) {
                throw new Error("User not found");
            }
            let activities = user.userActivities || [];
            if (actionFilter) {
                activities = activities.filter((activity) => activity.action === actionFilter);
            }
            activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            const total = activities.length;
            const skip = (page - 1) * limit;
            const paginatedActivities = activities.slice(skip, skip + limit);
            return {
                activities: paginatedActivities,
                total,
                page,
                pages: Math.ceil(total / limit),
            };
        });
    }
    // Get security events for a user
    static getUserSecurityEvents(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            const user = (yield user_model_1.User.findById(userId).select("userActivities"));
            if (!user) {
                throw new Error("User not found");
            }
            const securityEvents = (user.userActivities || []).filter((activity) => activity.action === "security_alert");
            const total = securityEvents.length;
            const skip = (page - 1) * limit;
            const paginatedEvents = securityEvents.slice(skip, skip + limit);
            return {
                events: paginatedEvents,
                total,
                page,
                pages: Math.ceil(total / limit),
            };
        });
    }
    // Get user dashboard statistics
    static getUserDashboardStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = (yield user_model_1.User.findById(userId).select("userActivities"));
            if (!user) {
                throw new Error("User not found");
            }
            const activities = user.userActivities || [];
            const now = new Date();
            const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            const recentActivities = activities.filter((activity) => new Date(activity.timestamp) >= thirtyDaysAgo);
            const stats = {
                totalActivities: activities.length,
                recentActivities: recentActivities.length,
                activityBreakdown: {
                    media_views: activities.filter((a) => a.action === "media_view").length,
                    media_likes: activities.filter((a) => a.action === "media_like").length,
                    media_shares: activities.filter((a) => a.action === "media_share")
                        .length,
                    media_downloads: activities.filter((a) => a.action === "media_download")
                        .length,
                    media_saves: activities.filter((a) => a.action === "media_save").length,
                    game_plays: activities.filter((a) => a.action === "game_play").length,
                    payments: activities.filter((a) => a.action.includes("payment")).length,
                    security_alerts: activities.filter((a) => a.action === "security_alert")
                        .length,
                },
                lastActivity: activities.length > 0 ? activities[0].timestamp : null,
                mostActiveDay: this.getMostActiveDay(activities),
                securityScore: this.calculateSecurityScore(activities),
            };
            return stats;
        });
    }
    // Get most active day
    static getMostActiveDay(activities) {
        if (activities.length === 0)
            return null;
        const dayCounts = {};
        activities.forEach((activity) => {
            const day = new Date(activity.timestamp).toDateString();
            dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const mostActiveDay = Object.entries(dayCounts).reduce((a, b) => (dayCounts[a[0]] > dayCounts[b[0]] ? a : b), [Object.keys(dayCounts)[0], 0]);
        return mostActiveDay[0];
    }
    // Calculate security score (0-100)
    static calculateSecurityScore(activities) {
        let score = 100;
        const securityEvents = activities.filter((a) => a.action === "security_alert");
        securityEvents.forEach((event) => {
            var _a;
            const severity = ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.severity) || "low";
            switch (severity) {
                case "critical":
                    score -= 25;
                    break;
                case "high":
                    score -= 15;
                    break;
                case "medium":
                    score -= 10;
                    break;
                case "low":
                    score -= 5;
                    break;
            }
        });
        return Math.max(0, score);
    }
    // Export user activity data (for GDPR compliance)
    static exportUserData(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = (yield user_model_1.User.findById(userId).select("userActivities"));
            if (!user) {
                throw new Error("User not found");
            }
            yield this.logActivity({
                userId,
                action: "data_export",
                resourceType: "user_data",
                timestamp: new Date(),
            });
            return {
                userId,
                exportDate: new Date(),
                activities: user.userActivities || [],
                totalActivities: ((_a = user.userActivities) === null || _a === void 0 ? void 0 : _a.length) || 0,
            };
        });
    }
    // Clean old activity logs (for data retention)
    static cleanOldActivityLogs() {
        return __awaiter(this, arguments, void 0, function* (daysToKeep = 365) {
            const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
            const result = yield user_model_1.User.updateMany({}, {
                $pull: {
                    userActivities: {
                        timestamp: { $lt: cutoffDate },
                    },
                },
            });
            return result.modifiedCount;
        });
    }
}
exports.AuditService = AuditService;
