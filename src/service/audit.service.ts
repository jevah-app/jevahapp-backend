import { Types } from "mongoose";
import { User, IUserDocument, IUserActivity } from "../models/user.model";

// Activity types
export type ActivityType =
  | "login"
  | "logout"
  | "register"
  | "profile_update"
  | "password_change"
  | "email_verification"
  | "media_upload"
  | "media_view"
  | "media_like"
  | "media_share"
  | "media_download"
  | "media_save"
  | "artist_follow"
  | "artist_unfollow"
  | "merch_purchase"
  | "subscription_purchase"
  | "subscription_cancel"
  | "game_play"
  | "game_complete"
  | "achievement_earned"
  | "payment_success"
  | "payment_failed"
  | "security_alert"
  | "admin_action"
  | "content_moderation"
  | "report_submitted"
  | "support_request"
  | "data_export"
  | "library_clear"
  | "dashboard_access"
  | "media_remove"
  | "media_update"
  | "media_unfavorite"
  | "media_favorite"
  | "media_play";

// Security event types
export type SecurityEventType =
  | "failed_login"
  | "suspicious_activity"
  | "account_locked"
  | "password_reset"
  | "email_change"
  | "role_change"
  | "bulk_action"
  | "data_export"
  | "api_abuse"
  | "rate_limit_exceeded"
  | "payment_failed";

// Activity interface for logging
export interface IActivityLog {
  userId: string;
  action: ActivityType;
  resourceType: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  timestamp: Date;
}

// Security event interface
export interface ISecurityEvent {
  userId?: string;
  eventType: SecurityEventType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  timestamp: Date;
}

// Extended user interface for type safety
interface ExtendedUser extends IUserDocument {
  _id: Types.ObjectId;
  userActivities: IUserActivity[];
  failedLoginAttempts?: number;
  accountLockedUntil?: Date;
  lastLoginAt?: Date;
  lastLoginIp?: string;
}

export class AuditService {
  // Log user activity
  static async logActivity(data: IActivityLog): Promise<void> {
    try {
      const {
        userId,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent,
        location,
      } = data;

      // Add activity to user's activity log
      await User.findByIdAndUpdate(userId, {
        $push: {
          userActivities: {
            action,
            resourceType,
            resourceId: resourceId ? new Types.ObjectId(resourceId) : undefined,
            metadata,
            ipAddress,
            userAgent,
            timestamp: new Date(),
          },
        },
      });

      // Log to console for development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[AUDIT] User ${userId} performed ${action} on ${resourceType}${resourceId ? ` (${resourceId})` : ""}`
        );
      }
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  }

  // Log security event
  static async logSecurityEvent(data: ISecurityEvent): Promise<void> {
    try {
      const {
        userId,
        eventType,
        severity,
        description,
        metadata,
        ipAddress,
        userAgent,
        resolved = false,
      } = data;

      // Log security event
      console.error(
        `[SECURITY] ${severity.toUpperCase()}: ${eventType} - ${description}${userId ? ` (User: ${userId})` : ""}`
      );

      // If user is involved, add to their activity log
      if (userId) {
        await User.findByIdAndUpdate(userId, {
          $push: {
            userActivities: {
              action: "security_alert" as ActivityType,
              resourceType: "security",
              resourceId: new Types.ObjectId(),
              metadata: {
                eventType,
                severity,
                description,
                ...metadata,
              },
              ipAddress,
              userAgent,
              timestamp: new Date(),
            },
          },
        });
      }
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  // Log login activity
  static async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: "login",
      resourceType: "auth",
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    // Update user's last login info
    await User.findByIdAndUpdate(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      failedLoginAttempts: 0,
    });
  }

  // Log failed login attempt
  static async logFailedLogin(
    email: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const user = (await User.findOne({ email })) as ExtendedUser | null;

    if (user) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;

      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: failedAttempts,
        accountLockedUntil:
          failedAttempts >= 5
            ? new Date(Date.now() + 15 * 60 * 1000)
            : undefined,
      });

      await this.logSecurityEvent({
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
  }

  // Log media interaction
  static async logMediaInteraction(
    userId: string,
    action: ActivityType,
    mediaId: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resourceType: "media",
      resourceId: mediaId,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  // Log payment activity
  static async logPaymentActivity(
    userId: string,
    action: ActivityType,
    amount: number,
    currency: string,
    paymentProcessor: string,
    success: boolean,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      action,
      resourceType: "payment",
      metadata: {
        amount,
        currency,
        paymentProcessor,
        success,
        ...metadata,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    if (!success) {
      await this.logSecurityEvent({
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
  }

  // Log admin action
  static async logAdminAction(
    adminUserId: string,
    action: string,
    targetUserId?: string,
    metadata?: Record<string, unknown>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId: adminUserId,
      action: "admin_action" as ActivityType,
      resourceType: "admin",
      resourceId: targetUserId,
      metadata: {
        adminAction: action,
        ...metadata,
      },
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  }

  // Get user activity history
  static async getUserActivityHistory(
    userId: string,
    page: number = 1,
    limit: number = 50,
    actionFilter?: ActivityType
  ): Promise<{
    activities: IUserActivity[];
    total: number;
    page: number;
    pages: number;
  }> {
    const user = (await User.findById(userId).select(
      "userActivities"
    )) as ExtendedUser | null;

    if (!user) {
      throw new Error("User not found");
    }

    let activities: IUserActivity[] = user.userActivities || [];

    if (actionFilter) {
      activities = activities.filter(
        (activity) => activity.action === actionFilter
      );
    }

    activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const total = activities.length;
    const skip = (page - 1) * limit;
    const paginatedActivities = activities.slice(skip, skip + limit);

    return {
      activities: paginatedActivities,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Get security events for a user
  static async getUserSecurityEvents(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    events: IUserActivity[];
    total: number;
    page: number;
    pages: number;
  }> {
    const user = (await User.findById(userId).select(
      "userActivities"
    )) as ExtendedUser | null;

    if (!user) {
      throw new Error("User not found");
    }

    const securityEvents = (user.userActivities || []).filter(
      (activity) => activity.action === "security_alert"
    );

    const total = securityEvents.length;
    const skip = (page - 1) * limit;
    const paginatedEvents = securityEvents.slice(skip, skip + limit);

    return {
      events: paginatedEvents,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // Get user dashboard statistics
  static async getUserDashboardStats(userId: string): Promise<{
    totalActivities: number;
    recentActivities: number;
    activityBreakdown: {
      media_views: number;
      media_likes: number;
      media_shares: number;
      media_downloads: number;
      media_saves: number;
      game_plays: number;
      payments: number;
      security_alerts: number;
    };
    lastActivity: Date | null;
    mostActiveDay: string | null;
    securityScore: number;
  }> {
    const user = (await User.findById(userId).select(
      "userActivities"
    )) as ExtendedUser | null;

    if (!user) {
      throw new Error("User not found");
    }

    const activities: IUserActivity[] = user.userActivities || [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivities = activities.filter(
      (activity) => new Date(activity.timestamp) >= thirtyDaysAgo
    );

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
  }

  // Get most active day
  private static getMostActiveDay(activities: IUserActivity[]): string | null {
    if (activities.length === 0) return null;

    const dayCounts: Record<string, number> = {};

    activities.forEach((activity) => {
      const day = new Date(activity.timestamp).toDateString();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    const mostActiveDay = Object.entries(dayCounts).reduce(
      (a, b) => (dayCounts[a[0]] > dayCounts[b[0]] ? a : b),
      [Object.keys(dayCounts)[0], 0]
    );

    return mostActiveDay[0];
  }

  // Calculate security score (0-100)
  private static calculateSecurityScore(activities: IUserActivity[]): number {
    let score = 100;
    const securityEvents = activities.filter(
      (a) => a.action === "security_alert"
    );

    securityEvents.forEach((event) => {
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

  // Export user activity data (for GDPR compliance)
  static async exportUserData(userId: string): Promise<{
    userId: string;
    exportDate: Date;
    activities: IUserActivity[];
    totalActivities: number;
  }> {
    const user = (await User.findById(userId).select(
      "userActivities"
    )) as ExtendedUser | null;

    if (!user) {
      throw new Error("User not found");
    }

    await this.logActivity({
      userId,
      action: "data_export",
      resourceType: "user_data",
      timestamp: new Date(),
    });

    return {
      userId,
      exportDate: new Date(),
      activities: user.userActivities || [],
      totalActivities: user.userActivities?.length || 0,
    };
  }

  // Clean old activity logs (for data retention)
  static async cleanOldActivityLogs(daysToKeep: number = 365): Promise<number> {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await User.updateMany(
      {},
      {
        $pull: {
          userActivities: {
            timestamp: { $lt: cutoffDate },
          },
        },
      }
    );

    return result.modifiedCount;
  }
}
