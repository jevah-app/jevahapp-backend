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
exports.DashboardService = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const media_model_1 = require("../models/media.model");
const mediaInteraction_model_1 = require("../models/mediaInteraction.model");
const game_model_1 = require("../models/game.model");
const payment_model_1 = require("../models/payment.model");
const subscription_model_1 = require("../models/subscription.model");
const merchPurchase_model_1 = require("../models/merchPurchase.model");
const audit_service_1 = require("./audit.service");
class DashboardService {
    // Retrieve comprehensive user dashboard statistics
    static getUserDashboardStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const [profileStatistics, contentStatistics, engagementStatistics, gamesStatistics, paymentsStatistics, securityStatistics,] = yield Promise.all([
                this.getProfileStatistics(user),
                this.getContentStatistics(userId),
                this.getEngagementStatistics(userId),
                this.getGamesStatistics(userId),
                this.getPaymentsStatistics(userId),
                this.getSecurityStatistics(userId),
            ]);
            // Log dashboard access activity
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "dashboard_access",
                resourceType: "dashboard",
                timestamp: new Date(),
            });
            return {
                profile: profileStatistics,
                content: contentStatistics,
                engagement: engagementStatistics,
                games: gamesStatistics,
                payments: paymentsStatistics,
                security: securityStatistics,
            };
        });
    }
    // Retrieve profile statistics
    static getProfileStatistics(user) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            return {
                basicInformation: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    age: user.age,
                    location: user.location,
                    isKid: user.isKid,
                    section: user.section,
                    avatar: user.avatar || user.avatarUpload,
                    isProfileComplete: user.isProfileComplete,
                    hasConsentedToPrivacyPolicy: user.hasConsentedToPrivacyPolicy,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    lastUpdated: user.updatedAt,
                },
                subscription: {
                    tier: user.subscriptionTier,
                    status: user.subscriptionStatus,
                    endDate: user.subscriptionEndDate,
                    isActive: user.subscriptionStatus === "active",
                    daysRemaining: user.subscriptionEndDate
                        ? Math.ceil((new Date(user.subscriptionEndDate).getTime() -
                            currentDateTime.getTime()) /
                            (1000 * 60 * 60 * 24))
                        : null,
                },
                verification: {
                    isVerifiedCreator: user.isVerifiedCreator,
                    isVerifiedVendor: user.isVerifiedVendor,
                    isVerifiedChurch: user.isVerifiedChurch,
                    isVerifiedArtist: user.isVerifiedArtist,
                    artistProfile: user.artistProfile,
                },
                activity: {
                    lastLoginAt: user.lastLoginAt,
                    lastLoginIp: user.lastLoginIp,
                    totalActivities: ((_a = user.userActivities) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    recentActivities: ((_b = user.userActivities) === null || _b === void 0 ? void 0 : _b.filter((activity) => new Date(activity.timestamp) >= thirtyDaysAgo).length) || 0,
                },
            };
        });
    }
    // Retrieve content statistics
    static getContentStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const [uploadedMedia, interactions, user] = yield Promise.all([
                media_model_1.Media.find({ uploadedBy: new mongoose_1.Types.ObjectId(userId) }),
                mediaInteraction_model_1.MediaInteraction.find({ user: new mongoose_1.Types.ObjectId(userId) }),
                user_model_1.User.findById(userId).select("library offlineDownloads"),
            ]);
            if (!user) {
                throw new Error("User not found");
            }
            const libraryItems = user.library || [];
            const offlineDownloads = user.offlineDownloads || [];
            return {
                uploadedContent: {
                    total: uploadedMedia.length,
                    byContentType: {
                        videos: uploadedMedia.filter((media) => media.contentType === "videos").length,
                        music: uploadedMedia.filter((media) => media.contentType === "music").length,
                        ebook: uploadedMedia.filter((media) => media.contentType === "ebook").length,
                    },
                    recent: uploadedMedia.filter((media) => new Date(media.createdAt) >= thirtyDaysAgo).length,
                    totalViews: uploadedMedia.reduce((sum, media) => sum + (media.viewCount || 0), 0),
                    totalLikes: uploadedMedia.reduce((sum, media) => sum + (media.favoriteCount || 0), 0),
                    totalShares: uploadedMedia.reduce((sum, media) => sum + (media.shareCount || 0), 0),
                },
                interactions: {
                    total: interactions.length,
                    byInteractionType: {
                        views: interactions.filter((interaction) => interaction.interactionType === "view").length,
                        listens: interactions.filter((interaction) => interaction.interactionType === "listen").length,
                        reads: interactions.filter((interaction) => interaction.interactionType === "read").length,
                        downloads: interactions.filter((interaction) => interaction.interactionType === "download").length,
                    },
                    recent: interactions.filter((interaction) => new Date(interaction.lastInteraction) >= thirtyDaysAgo).length,
                },
                library: {
                    total: libraryItems.length,
                    byContentType: {
                        videos: libraryItems.filter((item) => item.contentType === "videos").length,
                        music: libraryItems.filter((item) => item.contentType === "music").length,
                        ebook: libraryItems.filter((item) => item.contentType === "ebook").length,
                    },
                    favorites: libraryItems.filter((item) => item.isFavorite)
                        .length,
                    totalPlayCount: libraryItems.reduce((sum, item) => sum + (item.playCount || 0), 0),
                    recentlyAdded: libraryItems
                        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                        .slice(0, 5),
                },
                offlineDownloads: {
                    total: offlineDownloads.length,
                    byContentType: {
                        videos: offlineDownloads.filter((download) => download.mediaType === "videos").length,
                        music: offlineDownloads.filter((download) => download.mediaType === "audio").length,
                        ebook: offlineDownloads.filter((download) => download.mediaType === "ebooks").length,
                    },
                    totalSize: offlineDownloads.reduce((sum, download) => sum + (download.fileSize || 0), 0),
                    recent: offlineDownloads.filter((download) => new Date(download.downloadDate) >= thirtyDaysAgo).length,
                },
            };
        });
    }
    // Retrieve engagement statistics
    static getEngagementStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const user = (yield user_model_1.User.findById(userId));
            if (!user) {
                throw new Error("User not found");
            }
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const uploadedMedia = yield media_model_1.Media.find({
                uploadedBy: new mongoose_1.Types.ObjectId(userId),
            });
            const recentActivities = (user.userActivities || []).filter((activity) => new Date(activity.timestamp) >= thirtyDaysAgo);
            return {
                views: {
                    total: uploadedMedia.reduce((sum, media) => sum + (media.viewCount || 0), 0),
                    recent: recentActivities.filter((activity) => activity.action === "media_view").length,
                    averagePerContent: uploadedMedia.length
                        ? Math.round(uploadedMedia.reduce((sum, media) => sum + (media.viewCount || 0), 0) / uploadedMedia.length)
                        : 0,
                },
                likes: {
                    total: uploadedMedia.reduce((sum, media) => sum + (media.favoriteCount || 0), 0),
                    recent: recentActivities.filter((activity) => activity.action === "media_like").length,
                    averagePerContent: uploadedMedia.length
                        ? Math.round(uploadedMedia.reduce((sum, media) => sum + (media.favoriteCount || 0), 0) / uploadedMedia.length)
                        : 0,
                },
                shares: {
                    total: uploadedMedia.reduce((sum, media) => sum + (media.shareCount || 0), 0),
                    recent: recentActivities.filter((activity) => activity.action === "media_share").length,
                    averagePerContent: uploadedMedia.length
                        ? Math.round(uploadedMedia.reduce((sum, media) => sum + (media.shareCount || 0), 0) / uploadedMedia.length)
                        : 0,
                },
                followers: {
                    total: ((_a = user.followers) === null || _a === void 0 ? void 0 : _a.length) || 0,
                    following: ((_b = user.following) === null || _b === void 0 ? void 0 : _b.length) || 0,
                    artistFollowers: ((_c = user.artistProfile) === null || _c === void 0 ? void 0 : _c.followerCount) || 0,
                    artistFollowing: ((_d = user.artistProfile) === null || _d === void 0 ? void 0 : _d.followingCount) || 0,
                },
            };
        });
    }
    // Retrieve games statistics
    static getGamesStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const [gameSessions, achievements] = yield Promise.all([
                game_model_1.GameSession.find({ userId: new mongoose_1.Types.ObjectId(userId) }),
                game_model_1.GameAchievement.find({ userId: new mongoose_1.Types.ObjectId(userId) }),
            ]);
            return {
                played: {
                    total: gameSessions.length,
                    completed: gameSessions.filter((session) => session.completed).length,
                    recent: gameSessions.filter((session) => new Date(session.startedAt) >= thirtyDaysAgo).length,
                    totalTimeSpent: gameSessions.reduce((sum, session) => sum + (session.timeSpent || 0), 0),
                    averageScore: gameSessions.length
                        ? Math.round(gameSessions.reduce((sum, session) => sum + (session.score || 0), 0) / gameSessions.length)
                        : 0,
                    bestScore: gameSessions.length
                        ? Math.max(...gameSessions.map((session) => session.score || 0))
                        : 0,
                },
                achievements: {
                    total: achievements.length,
                    recent: achievements.filter((achievement) => new Date(achievement.earnedAt) >= thirtyDaysAgo).length,
                    totalPoints: achievements.reduce((sum, achievement) => sum + (achievement.points || 0), 0),
                    byAchievementType: {
                        firstPlay: achievements.filter((achievement) => achievement.achievementType === "first_play").length,
                        highScore: achievements.filter((achievement) => achievement.achievementType === "high_score").length,
                        perfectScore: achievements.filter((achievement) => achievement.achievementType === "perfect_score").length,
                        completion: achievements.filter((achievement) => achievement.achievementType === "completion").length,
                        streak: achievements.filter((achievement) => achievement.achievementType === "streak").length,
                    },
                },
                leaderboards: {
                    totalGames: gameSessions.length,
                    topRankings: [], // Placeholder for leaderboard data
                },
            };
        });
    }
    // Retrieve payments statistics
    static getPaymentsStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const [transactions, subscriptions, merchandisePurchases] = yield Promise.all([
                payment_model_1.PaymentTransaction.find({ userId: new mongoose_1.Types.ObjectId(userId) }),
                subscription_model_1.Subscription.find({ userId: new mongoose_1.Types.ObjectId(userId) }),
                merchPurchase_model_1.MerchandisePurchase.find({ userId: new mongoose_1.Types.ObjectId(userId) }),
            ]);
            return {
                transactions: {
                    total: transactions.length,
                    successful: transactions.filter((transaction) => transaction.status === "successful").length,
                    failed: transactions.filter((transaction) => transaction.status === "failed").length,
                    pending: transactions.filter((transaction) => transaction.status === "pending").length,
                    totalAmount: transactions
                        .filter((transaction) => transaction.status === "successful")
                        .reduce((sum, transaction) => sum + (transaction.amount || 0), 0),
                    recent: transactions.filter((transaction) => new Date(transaction.createdAt) >= thirtyDaysAgo).length,
                    byPaymentProcessor: {
                        paystack: transactions.filter((transaction) => transaction.paymentProcessor === "paystack").length,
                        flutterwave: transactions.filter((transaction) => transaction.paymentProcessor === "flutterwave").length,
                        paypal: transactions.filter((transaction) => transaction.paymentProcessor === "paypal").length,
                        stripe: transactions.filter((transaction) => transaction.paymentProcessor === "stripe").length,
                    },
                },
                subscriptions: {
                    total: subscriptions.length,
                    active: subscriptions.filter((subscription) => subscription.status === "active").length,
                    cancelled: subscriptions.filter((subscription) => subscription.status === "cancelled").length,
                    totalSpent: subscriptions
                        .filter((subscription) => subscription.status === "active")
                        .reduce((sum, subscription) => sum + (subscription.amount || 0), 0),
                    bySubscriptionType: {
                        monthly: subscriptions.filter((subscription) => subscription.subscriptionType === "monthly").length,
                        yearly: subscriptions.filter((subscription) => subscription.subscriptionType === "yearly").length,
                        lifetime: subscriptions.filter((subscription) => subscription.subscriptionType === "lifetime").length,
                    },
                },
                merchandise: {
                    total: merchandisePurchases.length,
                    totalSpent: merchandisePurchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
                    recent: merchandisePurchases.filter((purchase) => new Date(purchase.createdAt) >= thirtyDaysAgo).length,
                    byStatus: {
                        paid: merchandisePurchases.filter((purchase) => purchase.status === "paid").length,
                        shipped: merchandisePurchases.filter((purchase) => purchase.status === "shipped").length,
                        delivered: merchandisePurchases.filter((purchase) => purchase.status === "delivered").length,
                    },
                },
            };
        });
    }
    // Retrieve security statistics
    static getSecurityStatistics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = (yield user_model_1.User.findById(userId));
            if (!user) {
                throw new Error("User not found");
            }
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const recentActivities = (user.userActivities || []).filter((activity) => new Date(activity.timestamp) >= thirtyDaysAgo);
            const securityEvents = recentActivities.filter((activity) => activity.action === "security_alert");
            return {
                loginHistory: {
                    lastLoginAt: user.lastLoginAt,
                    lastLoginIp: user.lastLoginIp,
                    failedAttempts: user.failedLoginAttempts || 0,
                    accountLocked: user.accountLockedUntil
                        ? new Date(user.accountLockedUntil) > currentDateTime
                        : false,
                    lockExpiresAt: user.accountLockedUntil,
                    recentLogins: recentActivities.filter((activity) => activity.action === "login").length,
                },
                securityScore: {
                    score: this.calculateSecurityScore(user.userActivities || []),
                    factors: {
                        twoFactorEnabled: user.twoFactorEnabled || false,
                        emailVerified: user.isEmailVerified || false,
                        recentSecurityEvents: securityEvents.length,
                        failedLogins: user.failedLoginAttempts || 0,
                    },
                },
                alerts: {
                    total: securityEvents.length,
                    recent: securityEvents.length,
                    bySeverity: {
                        low: securityEvents.filter((event) => { var _a; return ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.severity) === "low"; }).length,
                        medium: securityEvents.filter((event) => { var _a; return ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.severity) === "medium"; }).length,
                        high: securityEvents.filter((event) => { var _a; return ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.severity) === "high"; }).length,
                        critical: securityEvents.filter((event) => { var _a; return ((_a = event.metadata) === null || _a === void 0 ? void 0 : _a.severity) === "critical"; }).length,
                    },
                    recentAlerts: securityEvents
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 5),
                },
            };
        });
    }
    // Calculate security score (0-100)
    static calculateSecurityScore(activities) {
        let score = 100;
        const securityEvents = activities.filter((activity) => activity.action === "security_alert");
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
    // Retrieve user activity timeline
    static getUserActivityTimeline(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 50) {
            const user = (yield user_model_1.User.findById(userId).select("userActivities"));
            if (!user) {
                throw new Error("User not found");
            }
            const activities = user.userActivities || [];
            const total = activities.length;
            const skip = (page - 1) * limit;
            const paginatedActivities = activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(skip, skip + limit);
            return {
                activities: paginatedActivities,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    // Retrieve user performance metrics
    static getUserPerformanceMetrics(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentDateTime = new Date();
            const thirtyDaysAgo = new Date(currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000);
            const sixtyDaysAgo = new Date(currentDateTime.getTime() - 60 * 24 * 60 * 60 * 1000);
            const user = (yield user_model_1.User.findById(userId));
            if (!user) {
                throw new Error("User not found");
            }
            const activities = user.userActivities || [];
            const recentActivities = activities.filter((activity) => new Date(activity.timestamp) >= thirtyDaysAgo);
            const previousActivities = activities.filter((activity) => new Date(activity.timestamp) >= sixtyDaysAgo &&
                new Date(activity.timestamp) < thirtyDaysAgo);
            return {
                engagement: {
                    current: recentActivities.length,
                    previous: previousActivities.length,
                    change: previousActivities.length
                        ? ((recentActivities.length - previousActivities.length) /
                            previousActivities.length) *
                            100
                        : 0,
                },
                contentCreation: {
                    current: recentActivities.filter((activity) => activity.action === "media_upload").length,
                    previous: previousActivities.filter((activity) => activity.action === "media_upload").length,
                    change: previousActivities.filter((activity) => activity.action === "media_upload").length
                        ? ((recentActivities.filter((activity) => activity.action === "media_upload").length -
                            previousActivities.filter((activity) => activity.action === "media_upload").length) /
                            previousActivities.filter((activity) => activity.action === "media_upload").length) *
                            100
                        : 0,
                },
                socialInteraction: {
                    current: recentActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length,
                    previous: previousActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length,
                    change: previousActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length
                        ? ((recentActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length -
                            previousActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length) /
                            previousActivities.filter((activity) => ["media_like", "media_share", "artist_follow"].includes(activity.action)).length) *
                            100
                        : 0,
                },
            };
        });
    }
}
exports.DashboardService = DashboardService;
