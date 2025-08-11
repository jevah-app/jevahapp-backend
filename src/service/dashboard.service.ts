import { Types } from "mongoose";
import {
  User,
  IUserDocument,
  ILibraryItem,
  IOfflineDownload,
  IUserActivity,
} from "../models/user.model";
import { Media, IMedia } from "../models/media.model";
import {
  MediaInteraction,
  IMediaInteraction,
} from "../models/mediaInteraction.model";
import {
  GameSession,
  GameAchievement,
  IGameAchievement,
  IGameSession,
} from "../models/game.model";
import {
  PaymentTransaction,
  IPaymentTransaction,
} from "../models/payment.model";
import { Subscription, ISubscription } from "../models/subscription.model";
import {
  MerchandisePurchase,
  IMerchandisePurchase,
} from "../models/merchPurchase.model";
import { AuditService } from "./audit.service";
import {
  DashboardStatistics,
  ProfileStatistics,
  ContentStatistics,
  EngagementStatistics,
  GamesStatistics,
  PaymentsStatistics,
  SecurityStatistics,
  PerformanceMetrics,
} from "../types/dashboard.types";

export class DashboardService {
  // Retrieve comprehensive user dashboard statistics
  static async getUserDashboardStatistics(
    userId: string
  ): Promise<DashboardStatistics> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const [
      profileStatistics,
      contentStatistics,
      engagementStatistics,
      gamesStatistics,
      paymentsStatistics,
      securityStatistics,
    ] = await Promise.all([
      this.getProfileStatistics(user),
      this.getContentStatistics(userId),
      this.getEngagementStatistics(userId),
      this.getGamesStatistics(userId),
      this.getPaymentsStatistics(userId),
      this.getSecurityStatistics(userId),
    ]);

    // Log dashboard access activity
    await AuditService.logActivity({
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
  }

  // Retrieve profile statistics
  private static async getProfileStatistics(
    user: IUserDocument
  ): Promise<ProfileStatistics> {
    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

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
          ? Math.ceil(
              (new Date(user.subscriptionEndDate).getTime() -
                currentDateTime.getTime()) /
                (1000 * 60 * 60 * 24)
            )
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
        totalActivities: user.userActivities?.length || 0,
        recentActivities:
          user.userActivities?.filter(
            (activity: IUserActivity) =>
              new Date(activity.timestamp) >= thirtyDaysAgo
          ).length || 0,
      },
    };
  }

  // Retrieve content statistics
  private static async getContentStatistics(
    userId: string
  ): Promise<ContentStatistics> {
    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const [uploadedMedia, interactions, user] = await Promise.all([
      Media.find({ uploadedBy: new Types.ObjectId(userId) }),
      MediaInteraction.find({ user: new Types.ObjectId(userId) }),
      User.findById(userId).select(
        "library offlineDownloads"
      ) as Promise<IUserDocument | null>,
    ]);

    if (!user) {
      throw new Error("User not found");
    }

    const libraryItems: ILibraryItem[] = user.library || [];
    const offlineDownloads: IOfflineDownload[] = user.offlineDownloads || [];

    return {
      uploadedContent: {
        total: uploadedMedia.length,
        byContentType: {
          videos: uploadedMedia.filter(
            (media: IMedia) => media.contentType === "videos"
          ).length,
          music: uploadedMedia.filter(
            (media: IMedia) => media.contentType === "music"
          ).length,
          ebook: uploadedMedia.filter(
            (media: IMedia) => media.contentType === "ebook"
          ).length,
        },
        recent: uploadedMedia.filter(
          (media: IMedia) => new Date(media.createdAt) >= thirtyDaysAgo
        ).length,
        totalViews: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.viewCount || 0),
          0
        ),
        totalLikes: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.favoriteCount || 0),
          0
        ),
        totalShares: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.shareCount || 0),
          0
        ),
      },
      interactions: {
        total: interactions.length,
        byInteractionType: {
          views: interactions.filter(
            (interaction: IMediaInteraction) =>
              interaction.interactionType === "view"
          ).length,
          listens: interactions.filter(
            (interaction: IMediaInteraction) =>
              interaction.interactionType === "listen"
          ).length,
          reads: interactions.filter(
            (interaction: IMediaInteraction) =>
              interaction.interactionType === "read"
          ).length,
          downloads: interactions.filter(
            (interaction: IMediaInteraction) =>
              interaction.interactionType === "download"
          ).length,
        },
        recent: interactions.filter(
          (interaction: IMediaInteraction) =>
            new Date(interaction.lastInteraction) >= thirtyDaysAgo
        ).length,
      },
      library: {
        total: libraryItems.length,
        byContentType: {
          videos: libraryItems.filter(
            (item: ILibraryItem) => item.contentType === "videos"
          ).length,
          music: libraryItems.filter(
            (item: ILibraryItem) => item.contentType === "music"
          ).length,
          ebook: libraryItems.filter(
            (item: ILibraryItem) => item.contentType === "ebook"
          ).length,
        },
        favorites: libraryItems.filter((item: ILibraryItem) => item.isFavorite)
          .length,
        totalPlayCount: libraryItems.reduce(
          (sum: number, item: ILibraryItem) => sum + (item.playCount || 0),
          0
        ),
        recentlyAdded: libraryItems
          .sort(
            (a: ILibraryItem, b: ILibraryItem) =>
              new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
          )
          .slice(0, 5),
      },
      offlineDownloads: {
        total: offlineDownloads.length,
        byContentType: {
          videos: offlineDownloads.filter(
            (download: IOfflineDownload) => download.mediaType === "videos"
          ).length,
          music: offlineDownloads.filter(
            (download: IOfflineDownload) => download.mediaType === "audio"
          ).length,
          ebook: offlineDownloads.filter(
            (download: IOfflineDownload) => download.mediaType === "ebooks"
          ).length,
        },
        totalSize: offlineDownloads.reduce(
          (sum: number, download: IOfflineDownload) =>
            sum + (download.fileSize || 0),
          0
        ),
        recent: offlineDownloads.filter(
          (download: IOfflineDownload) =>
            new Date(download.downloadDate) >= thirtyDaysAgo
        ).length,
      },
    };
  }

  // Retrieve engagement statistics
  private static async getEngagementStatistics(
    userId: string
  ): Promise<EngagementStatistics> {
    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const uploadedMedia = await Media.find({
      uploadedBy: new Types.ObjectId(userId),
    });

    const recentActivities = (user.userActivities || []).filter(
      (activity: IUserActivity) => new Date(activity.timestamp) >= thirtyDaysAgo
    );

    return {
      views: {
        total: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.viewCount || 0),
          0
        ),
        recent: recentActivities.filter(
          (activity: IUserActivity) => activity.action === "media_view"
        ).length,
        averagePerContent: uploadedMedia.length
          ? Math.round(
              uploadedMedia.reduce(
                (sum: number, media: IMedia) => sum + (media.viewCount || 0),
                0
              ) / uploadedMedia.length
            )
          : 0,
      },
      likes: {
        total: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.favoriteCount || 0),
          0
        ),
        recent: recentActivities.filter(
          (activity: IUserActivity) => activity.action === "media_like"
        ).length,
        averagePerContent: uploadedMedia.length
          ? Math.round(
              uploadedMedia.reduce(
                (sum: number, media: IMedia) =>
                  sum + (media.favoriteCount || 0),
                0
              ) / uploadedMedia.length
            )
          : 0,
      },
      shares: {
        total: uploadedMedia.reduce(
          (sum: number, media: IMedia) => sum + (media.shareCount || 0),
          0
        ),
        recent: recentActivities.filter(
          (activity: IUserActivity) => activity.action === "media_share"
        ).length,
        averagePerContent: uploadedMedia.length
          ? Math.round(
              uploadedMedia.reduce(
                (sum: number, media: IMedia) => sum + (media.shareCount || 0),
                0
              ) / uploadedMedia.length
            )
          : 0,
      },
      followers: {
        total: user.followers?.length || 0,
        following: user.following?.length || 0,
        artistFollowers: user.artistProfile?.followerCount || 0,
        artistFollowing: user.artistProfile?.followingCount || 0,
      },
    };
  }

  // Retrieve games statistics
  private static async getGamesStatistics(
    userId: string
  ): Promise<GamesStatistics> {
    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const [gameSessions, achievements] = await Promise.all([
      GameSession.find({ userId: new Types.ObjectId(userId) }),
      GameAchievement.find({ userId: new Types.ObjectId(userId) }),
    ]);

    return {
      played: {
        total: gameSessions.length,
        completed: gameSessions.filter(
          (session: IGameSession) => session.completed
        ).length,
        recent: gameSessions.filter(
          (session: IGameSession) =>
            new Date(session.startedAt) >= thirtyDaysAgo
        ).length,
        totalTimeSpent: gameSessions.reduce(
          (sum: number, session: IGameSession) =>
            sum + (session.timeSpent || 0),
          0
        ),
        averageScore: gameSessions.length
          ? Math.round(
              gameSessions.reduce(
                (sum: number, session: IGameSession) =>
                  sum + (session.score || 0),
                0
              ) / gameSessions.length
            )
          : 0,
        bestScore: gameSessions.length
          ? Math.max(
              ...gameSessions.map((session: IGameSession) => session.score || 0)
            )
          : 0,
      },
      achievements: {
        total: achievements.length,
        recent: achievements.filter(
          (achievement: IGameAchievement) =>
            new Date(achievement.earnedAt) >= thirtyDaysAgo
        ).length,
        totalPoints: achievements.reduce(
          (sum: number, achievement: IGameAchievement) =>
            sum + (achievement.points || 0),
          0
        ),
        byAchievementType: {
          firstPlay: achievements.filter(
            (achievement: IGameAchievement) =>
              achievement.achievementType === "first_play"
          ).length,
          highScore: achievements.filter(
            (achievement: IGameAchievement) =>
              achievement.achievementType === "high_score"
          ).length,
          perfectScore: achievements.filter(
            (achievement: IGameAchievement) =>
              achievement.achievementType === "perfect_score"
          ).length,
          completion: achievements.filter(
            (achievement: IGameAchievement) =>
              achievement.achievementType === "completion"
          ).length,
          streak: achievements.filter(
            (achievement: IGameAchievement) =>
              achievement.achievementType === "streak"
          ).length,
        },
      },
      leaderboards: {
        totalGames: gameSessions.length,
        topRankings: [], // Placeholder for leaderboard data
      },
    };
  }

  // Retrieve payments statistics
  private static async getPaymentsStatistics(
    userId: string
  ): Promise<PaymentsStatistics> {
    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const [transactions, subscriptions, merchandisePurchases] =
      await Promise.all([
        PaymentTransaction.find({ userId: new Types.ObjectId(userId) }),
        Subscription.find({ userId: new Types.ObjectId(userId) }),
        MerchandisePurchase.find({ userId: new Types.ObjectId(userId) }),
      ]);

    return {
      transactions: {
        total: transactions.length,
        successful: transactions.filter(
          (transaction: IPaymentTransaction) =>
            transaction.status === "successful"
        ).length,
        failed: transactions.filter(
          (transaction: IPaymentTransaction) => transaction.status === "failed"
        ).length,
        pending: transactions.filter(
          (transaction: IPaymentTransaction) => transaction.status === "pending"
        ).length,
        totalAmount: transactions
          .filter(
            (transaction: IPaymentTransaction) =>
              transaction.status === "successful"
          )
          .reduce(
            (sum: number, transaction: IPaymentTransaction) =>
              sum + (transaction.amount || 0),
            0
          ),
        recent: transactions.filter(
          (transaction: IPaymentTransaction) =>
            new Date(transaction.createdAt) >= thirtyDaysAgo
        ).length,
        byPaymentProcessor: {
          paystack: transactions.filter(
            (transaction: IPaymentTransaction) =>
              transaction.paymentProcessor === "paystack"
          ).length,
          flutterwave: transactions.filter(
            (transaction: IPaymentTransaction) =>
              transaction.paymentProcessor === "flutterwave"
          ).length,
          paypal: transactions.filter(
            (transaction: IPaymentTransaction) =>
              transaction.paymentProcessor === "paypal"
          ).length,
          stripe: transactions.filter(
            (transaction: IPaymentTransaction) =>
              transaction.paymentProcessor === "stripe"
          ).length,
        },
      },
      subscriptions: {
        total: subscriptions.length,
        active: subscriptions.filter(
          (subscription: ISubscription) => subscription.status === "active"
        ).length,
        cancelled: subscriptions.filter(
          (subscription: ISubscription) => subscription.status === "cancelled"
        ).length,
        totalSpent: subscriptions
          .filter(
            (subscription: ISubscription) => subscription.status === "active"
          )
          .reduce(
            (sum: number, subscription: ISubscription) =>
              sum + (subscription.amount || 0),
            0
          ),
        bySubscriptionType: {
          monthly: subscriptions.filter(
            (subscription: ISubscription) =>
              subscription.subscriptionType === "monthly"
          ).length,
          yearly: subscriptions.filter(
            (subscription: ISubscription) =>
              subscription.subscriptionType === "yearly"
          ).length,
          lifetime: subscriptions.filter(
            (subscription: ISubscription) =>
              subscription.subscriptionType === "lifetime"
          ).length,
        },
      },
      merchandise: {
        total: merchandisePurchases.length,
        totalSpent: merchandisePurchases.reduce(
          (sum: number, purchase: IMerchandisePurchase) =>
            sum + (purchase.amount || 0),
          0
        ),
        recent: merchandisePurchases.filter(
          (purchase: IMerchandisePurchase) =>
            new Date(purchase.createdAt) >= thirtyDaysAgo
        ).length,
        byStatus: {
          paid: merchandisePurchases.filter(
            (purchase: IMerchandisePurchase) => purchase.status === "paid"
          ).length,
          shipped: merchandisePurchases.filter(
            (purchase: IMerchandisePurchase) => purchase.status === "shipped"
          ).length,
          delivered: merchandisePurchases.filter(
            (purchase: IMerchandisePurchase) => purchase.status === "delivered"
          ).length,
        },
      },
    };
  }

  // Retrieve security statistics
  private static async getSecurityStatistics(
    userId: string
  ): Promise<SecurityStatistics> {
    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );

    const recentActivities = (user.userActivities || []).filter(
      (activity: IUserActivity) => new Date(activity.timestamp) >= thirtyDaysAgo
    );

    const securityEvents = recentActivities.filter(
      (activity: IUserActivity) => activity.action === "security_alert"
    );

    return {
      loginHistory: {
        lastLoginAt: user.lastLoginAt,
        lastLoginIp: user.lastLoginIp,
        failedAttempts: user.failedLoginAttempts || 0,
        accountLocked: user.accountLockedUntil
          ? new Date(user.accountLockedUntil) > currentDateTime
          : false,
        lockExpiresAt: user.accountLockedUntil,
        recentLogins: recentActivities.filter(
          (activity: IUserActivity) => activity.action === "login"
        ).length,
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
          low: securityEvents.filter(
            (event: IUserActivity) => event.metadata?.severity === "low"
          ).length,
          medium: securityEvents.filter(
            (event: IUserActivity) => event.metadata?.severity === "medium"
          ).length,
          high: securityEvents.filter(
            (event: IUserActivity) => event.metadata?.severity === "high"
          ).length,
          critical: securityEvents.filter(
            (event: IUserActivity) => event.metadata?.severity === "critical"
          ).length,
        },
        recentAlerts: securityEvents
          .sort(
            (a: IUserActivity, b: IUserActivity) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
          .slice(0, 5),
      },
    };
  }

  // Calculate security score (0-100)
  private static calculateSecurityScore(activities: IUserActivity[]): number {
    let score = 100;
    const securityEvents = activities.filter(
      (activity: IUserActivity) => activity.action === "security_alert"
    );

    securityEvents.forEach((event: IUserActivity) => {
      const severity = (event.metadata?.severity as string) || "low";
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
  static async getUserActivityTimeline(
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    activities: IUserActivity[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const user = (await User.findById(userId).select(
      "userActivities"
    )) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    const activities = user.userActivities || [];
    const total = activities.length;
    const skip = (page - 1) * limit;
    const paginatedActivities = activities
      .sort(
        (a: IUserActivity, b: IUserActivity) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
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
  }

  // Retrieve user performance metrics
  static async getUserPerformanceMetrics(
    userId: string
  ): Promise<PerformanceMetrics> {
    const currentDateTime = new Date();
    const thirtyDaysAgo = new Date(
      currentDateTime.getTime() - 30 * 24 * 60 * 60 * 1000
    );
    const sixtyDaysAgo = new Date(
      currentDateTime.getTime() - 60 * 24 * 60 * 60 * 1000
    );

    const user = (await User.findById(userId)) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    const activities = user.userActivities || [];
    const recentActivities = activities.filter(
      (activity: IUserActivity) => new Date(activity.timestamp) >= thirtyDaysAgo
    );
    const previousActivities = activities.filter(
      (activity: IUserActivity) =>
        new Date(activity.timestamp) >= sixtyDaysAgo &&
        new Date(activity.timestamp) < thirtyDaysAgo
    );

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
        current: recentActivities.filter(
          (activity: IUserActivity) => activity.action === "media_upload"
        ).length,
        previous: previousActivities.filter(
          (activity: IUserActivity) => activity.action === "media_upload"
        ).length,
        change: previousActivities.filter(
          (activity: IUserActivity) => activity.action === "media_upload"
        ).length
          ? ((recentActivities.filter(
              (activity: IUserActivity) => activity.action === "media_upload"
            ).length -
              previousActivities.filter(
                (activity: IUserActivity) => activity.action === "media_upload"
              ).length) /
              previousActivities.filter(
                (activity: IUserActivity) => activity.action === "media_upload"
              ).length) *
            100
          : 0,
      },
      socialInteraction: {
        current: recentActivities.filter((activity: IUserActivity) =>
          ["media_like", "media_share", "artist_follow"].includes(
            activity.action
          )
        ).length,
        previous: previousActivities.filter((activity: IUserActivity) =>
          ["media_like", "media_share", "artist_follow"].includes(
            activity.action
          )
        ).length,
        change: previousActivities.filter((activity: IUserActivity) =>
          ["media_like", "media_share", "artist_follow"].includes(
            activity.action
          )
        ).length
          ? ((recentActivities.filter((activity: IUserActivity) =>
              ["media_like", "media_share", "artist_follow"].includes(
                activity.action
              )
            ).length -
              previousActivities.filter((activity: IUserActivity) =>
                ["media_like", "media_share", "artist_follow"].includes(
                  activity.action
                )
              ).length) /
              previousActivities.filter((activity: IUserActivity) =>
                ["media_like", "media_share", "artist_follow"].includes(
                  activity.action
                )
              ).length) *
            100
          : 0,
      },
    };
  }
}
