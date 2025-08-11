import { ILibraryItem, IUserActivity } from "../models/user.model";

export interface ProfileStatistics {
  basicInformation: {
    firstName?: string;
    lastName?: string;
    email: string;
    role?: string;
    age?: number;
    location?: string;
    isKid?: boolean;
    section?: string;
    avatar?: string;
    isProfileComplete?: boolean;
    hasConsentedToPrivacyPolicy?: boolean;
    isEmailVerified: boolean;
    createdAt?: Date;
    lastUpdated?: Date;
  };
  subscription: {
    tier?: string;
    status?: string;
    endDate?: Date;
    isActive: boolean;
    daysRemaining: number | null;
  };
  verification: {
    isVerifiedCreator?: boolean;
    isVerifiedVendor?: boolean;
    isVerifiedChurch?: boolean;
    isVerifiedArtist?: boolean;
    artistProfile?: {
      artistName: string;
      genre: string[];
      bio?: string;
      socialMedia?: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
        youtube?: string;
        spotify?: string;
      };
      isVerifiedArtist?: boolean;
      verificationDocuments?: string[];
      recordLabel?: string;
      yearsActive?: number;
      followerCount?: number;
      followingCount?: number;
      hasMerch?: boolean;
      merchEnabled?: boolean;
    };
  };
  activity: {
    lastLoginAt?: Date;
    lastLoginIp?: string;
    totalActivities: number;
    recentActivities: number;
  };
}

export interface ContentStatistics {
  uploadedContent: {
    total: number;
    byContentType: {
      videos: number;
      music: number;
      ebook: number;
    };
    recent: number;
    totalViews: number;
    totalLikes: number;
    totalShares: number;
  };
  interactions: {
    total: number;
    byInteractionType: {
      views: number;
      listens: number;
      reads: number;
      downloads: number;
    };
    recent: number;
  };
  library: {
    total: number;
    byContentType: {
      videos: number;
      music: number;
      ebook: number;
    };
    favorites: number;
    totalPlayCount: number;
    recentlyAdded: ILibraryItem[];
  };
  offlineDownloads: {
    total: number;
    byContentType: {
      videos: number;
      music: number;
      ebook: number;
    };
    totalSize: number;
    recent: number;
  };
}

export interface EngagementStatistics {
  views: {
    total: number;
    recent: number;
    averagePerContent: number;
  };
  likes: {
    total: number;
    recent: number;
    averagePerContent: number;
  };
  shares: {
    total: number;
    recent: number;
    averagePerContent: number;
  };
  followers: {
    total: number;
    following: number;
    artistFollowers: number;
    artistFollowing: number;
  };
}

export interface GamesStatistics {
  played: {
    total: number;
    completed: number;
    recent: number;
    totalTimeSpent: number;
    averageScore: number;
    bestScore: number;
  };
  achievements: {
    total: number;
    recent: number;
    totalPoints: number;
    byAchievementType: {
      firstPlay: number;
      highScore: number;
      perfectScore: number;
      completion: number;
      streak: number;
    };
  };
  leaderboards: {
    totalGames: number;
    topRankings: any[];
  };
}

export interface PaymentsStatistics {
  transactions: {
    total: number;
    successful: number;
    failed: number;
    pending: number;
    totalAmount: number;
    recent: number;
    byPaymentProcessor: {
      paystack: number;
      flutterwave: number;
      paypal: number;
      stripe: number;
    };
  };
  subscriptions: {
    total: number;
    active: number;
    cancelled: number;
    totalSpent: number;
    bySubscriptionType: {
      monthly: number;
      yearly: number;
      lifetime: number;
    };
  };
  merchandise: {
    total: number;
    totalSpent: number;
    recent: number;
    byStatus: {
      paid: number;
      shipped: number;
      delivered: number;
    };
  };
}

export interface SecurityStatistics {
  loginHistory: {
    lastLoginAt?: Date;
    lastLoginIp?: string;
    failedAttempts: number;
    accountLocked: boolean;
    lockExpiresAt?: Date;
    recentLogins: number;
  };
  securityScore: {
    score: number;
    factors: {
      twoFactorEnabled: boolean;
      emailVerified: boolean;
      recentSecurityEvents: number;
      failedLogins: number;
    };
  };
  alerts: {
    total: number;
    recent: number;
    bySeverity: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    recentAlerts: IUserActivity[];
  };
}

export interface DashboardStatistics {
  profile: ProfileStatistics;
  content: ContentStatistics;
  engagement: EngagementStatistics;
  games: GamesStatistics;
  payments: PaymentsStatistics;
  security: SecurityStatistics;
}

export interface PerformanceMetrics {
  engagement: {
    current: number;
    previous: number;
    change: number;
  };
  contentCreation: {
    current: number;
    previous: number;
    change: number;
  };
  socialInteraction: {
    current: number;
    previous: number;
    change: number;
  };
}
