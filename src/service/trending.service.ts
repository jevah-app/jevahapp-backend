import { User } from "../models/user.model";
import { Media } from "../models/media.model";

export interface TrendingUser {
  user: any;
  stats: {
    totalViews: number;
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    totalDownloads: number;
    followerCount: number;
    followingCount: number;
    engagementRate: number;
  };
  contentTypeStats: {
    music: { count: number; totalViews: number; totalLikes: number };
    videos: { count: number; totalViews: number; totalLikes: number };
    ebook: { count: number; totalReads: number; totalLikes: number };
    podcast: { count: number; totalListens: number; totalLikes: number };
    sermon: { count: number; totalViews: number; totalLikes: number };
    live: { count: number; totalViews: number; totalLikes: number };
  };
  recentActivity: {
    lastLiveStream?: Date;
    lastUpload?: Date;
    lastInteraction?: Date;
  };
}

export interface LiveStreamTiming {
  currentlyLive: TrendingUser[];
  recentlyEnded: TrendingUser[];
  scheduledToday: TrendingUser[];
  scheduledThisWeek: TrendingUser[];
  popularLiveStreamers: TrendingUser[];
}

export class TrendingService {
  async getTrendingUsers(limit: number = 20): Promise<TrendingUser[]> {
    try {
      const users = await User.find({
        $or: [
          { role: "content_creator" },
          { role: "artist" },
          { "artistProfile.isVerifiedArtist": true },
        ],
      }).limit(limit);

      const results = await Promise.all(
        users.map(async user => {
          const media = await Media.find({ uploadedBy: user._id });
          const totalViews = media.reduce(
            (sum, m) => sum + (m.viewCount || 0),
            0
          );
          const totalLikes = media.reduce(
            (sum, m) => sum + (m.likeCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalViews, totalLikes },
            media,
          });
        })
      );

      return results.sort((a, b) => b.stats.totalViews - a.stats.totalViews);
    } catch (error) {
      console.error("Error getting trending users:", error);
      throw error;
    }
  }

  async getMostViewedUsers(limit: number = 20): Promise<TrendingUser[]> {
    return this.getTrendingUsers(limit);
  }

  async getMostReadEbookUsers(limit: number = 20): Promise<TrendingUser[]> {
    try {
      const users = await User.find({
        $or: [
          { role: "content_creator" },
          { role: "artist" },
          { "artistProfile.isVerifiedArtist": true },
        ],
      }).limit(limit);

      const results = await Promise.all(
        users.map(async user => {
          const ebooks = await Media.find({
            uploadedBy: user._id,
            contentType: "ebook",
          });

          if (ebooks.length === 0) return null;

          const totalReads = ebooks.reduce(
            (sum, m) => sum + (m.readCount || 0),
            0
          );
          const totalLikes = ebooks.reduce(
            (sum, m) => sum + (m.likeCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalReads, totalLikes },
            media: ebooks,
          });
        })
      );

      return results
        .filter((result): result is TrendingUser => result !== null)
        .sort(
          (a, b) => (b.stats as any).totalReads - (a.stats as any).totalReads
        );
    } catch (error) {
      console.error("Error getting most read ebook users:", error);
      throw error;
    }
  }

  async getMostListenedAudioUsers(limit: number = 20): Promise<TrendingUser[]> {
    try {
      const users = await User.find({
        $or: [
          { role: "content_creator" },
          { role: "artist" },
          { "artistProfile.isVerifiedArtist": true },
        ],
      }).limit(limit);

      const results = await Promise.all(
        users.map(async user => {
          const audioContent = await Media.find({
            uploadedBy: user._id,
            contentType: { $in: ["audio", "music", "podcast"] },
          });

          if (audioContent.length === 0) return null;

          const totalListens = audioContent.reduce(
            (sum, m) => sum + (m.listenCount || 0),
            0
          );
          const totalLikes = audioContent.reduce(
            (sum, m) => sum + (m.likeCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalListens, totalLikes },
            media: audioContent,
          });
        })
      );

      return results
        .filter((result): result is TrendingUser => result !== null)
        .sort(
          (a, b) =>
            (b.stats as any).totalListens - (a.stats as any).totalListens
        );
    } catch (error) {
      console.error("Error getting most listened audio users:", error);
      throw error;
    }
  }

  async getMostHeardSermonUsers(limit: number = 20): Promise<TrendingUser[]> {
    try {
      const users = await User.find({
        $or: [
          { role: "content_creator" },
          { role: "artist" },
          { "artistProfile.isVerifiedArtist": true },
        ],
      }).limit(limit);

      const results = await Promise.all(
        users.map(async user => {
          const sermons = await Media.find({
            uploadedBy: user._id,
            contentType: "sermon",
          });

          if (sermons.length === 0) return null;

          const totalSermonViews = sermons.reduce(
            (sum, m) => sum + (m.viewCount || 0),
            0
          );
          const totalLikes = sermons.reduce(
            (sum, m) => sum + (m.likeCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalSermonViews, totalLikes },
            media: sermons,
          });
        })
      );

      return results
        .filter((result): result is TrendingUser => result !== null)
        .sort(
          (a, b) =>
            (b.stats as any).totalSermonViews -
            (a.stats as any).totalSermonViews
        );
    } catch (error) {
      console.error("Error getting most heard sermon users:", error);
      throw error;
    }
  }

  async getMostCheckedOutLiveUsers(
    limit: number = 20
  ): Promise<TrendingUser[]> {
    try {
      const users = await User.find({
        $or: [
          { role: "content_creator" },
          { role: "artist" },
          { "artistProfile.isVerifiedArtist": true },
        ],
      }).limit(limit);

      const results = await Promise.all(
        users.map(async user => {
          const liveStreams = await Media.find({
            uploadedBy: user._id,
            contentType: "live",
          });

          if (liveStreams.length === 0) return null;

          const totalLiveViews = liveStreams.reduce(
            (sum, m) => sum + (m.viewCount || 0),
            0
          );
          const totalLikes = liveStreams.reduce(
            (sum, m) => sum + (m.likeCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalLiveViews, totalLikes },
            media: liveStreams,
          });
        })
      );

      return results
        .filter((result): result is TrendingUser => result !== null)
        .sort(
          (a, b) =>
            (b.stats as any).totalLiveViews - (a.stats as any).totalLiveViews
        );
    } catch (error) {
      console.error("Error getting most checked out live users:", error);
      throw error;
    }
  }

  async getLiveStreamTiming(): Promise<LiveStreamTiming> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const currentlyLive = await this.getCurrentlyLiveUsers();
      const recentlyEnded = await this.getRecentlyEndedUsers(oneDayAgo);
      const scheduledToday = await this.getScheduledUsers(
        now,
        new Date(now.getTime() + 24 * 60 * 60 * 1000)
      );
      const scheduledThisWeek = await this.getScheduledUsers(
        now,
        new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
      );
      const popularLiveStreamers = await this.getPopularLiveStreamers();

      return {
        currentlyLive,
        recentlyEnded,
        scheduledToday,
        scheduledThisWeek,
        popularLiveStreamers,
      };
    } catch (error) {
      console.error("Error getting live stream timing:", error);
      throw error;
    }
  }

  private async getCurrentlyLiveUsers(): Promise<TrendingUser[]> {
    try {
      const liveStreams = await Media.find({
        contentType: "live",
        liveStreamStatus: "live",
        isLive: true,
      });

      const userIds = [...new Set(liveStreams.map(ls => ls.uploadedBy))];
      const users = await User.find({ _id: { $in: userIds } });

      const results = await Promise.all(
        users.map(async user => {
          const userLiveStreams = liveStreams.filter(ls =>
            ls.uploadedBy.equals(user._id)
          );
          const currentLiveViews = userLiveStreams.reduce(
            (sum, ls) => sum + (ls.concurrentViewers || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { currentLiveViews },
            media: userLiveStreams,
          });
        })
      );

      return results.sort(
        (a, b) =>
          (b.stats as any).currentLiveViews - (a.stats as any).currentLiveViews
      );
    } catch (error) {
      console.error("Error getting currently live users:", error);
      throw error;
    }
  }

  private async getRecentlyEndedUsers(since: Date): Promise<TrendingUser[]> {
    try {
      const recentLiveStreams = await Media.find({
        contentType: "live",
        liveStreamStatus: "ended",
        actualEnd: { $gte: since },
      });

      const userIds = [...new Set(recentLiveStreams.map(ls => ls.uploadedBy))];
      const users = await User.find({ _id: { $in: userIds } });

      const results = await Promise.all(
        users.map(async user => {
          const userLiveStreams = recentLiveStreams.filter(ls =>
            ls.uploadedBy.equals(user._id)
          );
          const totalLiveViews = userLiveStreams.reduce(
            (sum, ls) => sum + (ls.viewCount || 0),
            0
          );

          return this.formatTrendingUser({
            user,
            stats: { totalLiveViews },
            media: userLiveStreams,
          });
        })
      );

      return results.sort(
        (a, b) =>
          (b.stats as any).totalLiveViews - (a.stats as any).totalLiveViews
      );
    } catch (error) {
      console.error("Error getting recently ended users:", error);
      throw error;
    }
  }

  private async getScheduledUsers(
    from: Date,
    to: Date
  ): Promise<TrendingUser[]> {
    try {
      const scheduledStreams = await Media.find({
        contentType: "live",
        liveStreamStatus: "scheduled",
        scheduledStart: { $gte: from, $lte: to },
      });

      const userIds = [...new Set(scheduledStreams.map(ls => ls.uploadedBy))];
      const users = await User.find({ _id: { $in: userIds } });

      const results = await Promise.all(
        users.map(async user => {
          const userScheduledStreams = scheduledStreams.filter(ls =>
            ls.uploadedBy.equals(user._id)
          );
          const scheduledCount = userScheduledStreams.length;

          return this.formatTrendingUser({
            user,
            stats: { scheduledCount },
            media: userScheduledStreams,
          });
        })
      );

      return results.sort(
        (a, b) =>
          (b.stats as any).scheduledCount - (a.stats as any).scheduledCount
      );
    } catch (error) {
      console.error("Error getting scheduled users:", error);
      throw error;
    }
  }

  private async getPopularLiveStreamers(): Promise<TrendingUser[]> {
    try {
      const liveStreams = await Media.find({ contentType: "live" });
      const userIds = [...new Set(liveStreams.map(ls => ls.uploadedBy))];
      const users = await User.find({ _id: { $in: userIds } }).limit(20);

      const results = await Promise.all(
        users.map(async user => {
          const userLiveStreams = liveStreams.filter(ls =>
            ls.uploadedBy.equals(user._id)
          );
          const totalLiveViews = userLiveStreams.reduce(
            (sum, ls) => sum + (ls.viewCount || 0),
            0
          );
          const liveStreamCount = userLiveStreams.length;

          return this.formatTrendingUser({
            user,
            stats: { totalLiveViews, liveStreamCount },
            media: userLiveStreams,
          });
        })
      );

      return results.sort(
        (a, b) =>
          (b.stats as any).totalLiveViews - (a.stats as any).totalLiveViews
      );
    } catch (error) {
      console.error("Error getting popular live streamers:", error);
      throw error;
    }
  }

  private formatTrendingUser(data: any): TrendingUser {
    const user = data.user;
    const stats = data.stats || {};
    const media = data.media || [];

    const contentTypeStats = {
      music: { count: 0, totalViews: 0, totalLikes: 0 },
      videos: { count: 0, totalViews: 0, totalLikes: 0 },
      ebook: { count: 0, totalReads: 0, totalLikes: 0 },
      podcast: { count: 0, totalListens: 0, totalLikes: 0 },
      sermon: { count: 0, totalViews: 0, totalLikes: 0 },
      live: { count: 0, totalViews: 0, totalLikes: 0 },
    };

    media.forEach((item: any) => {
      const contentType = item.contentType;
      if (contentTypeStats[contentType as keyof typeof contentTypeStats]) {
        const stats =
          contentTypeStats[contentType as keyof typeof contentTypeStats];
        stats.count++;
        if ("totalViews" in stats) {
          stats.totalViews += item.viewCount || 0;
        }
        stats.totalLikes += item.likeCount || 0;

        if (contentType === "ebook") {
          contentTypeStats.ebook.totalReads += item.readCount || 0;
        }
        if (contentType === "podcast") {
          contentTypeStats.podcast.totalListens += item.listenCount || 0;
        }
      }
    });

    const recentActivity = {
      lastLiveStream: media
        .filter((item: any) => item.contentType === "live" && item.actualEnd)
        .sort(
          (a: any, b: any) =>
            new Date(b.actualEnd).getTime() - new Date(a.actualEnd).getTime()
        )[0]?.actualEnd,
      lastUpload: media.sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]?.createdAt,
      lastInteraction: new Date(),
    };

    return {
      user,
      stats: {
        totalViews: stats.totalViews || 0,
        totalLikes: stats.totalLikes || 0,
        totalShares: stats.totalShares || 0,
        totalComments: stats.totalComments || 0,
        totalDownloads: stats.totalDownloads || 0,
        followerCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        engagementRate: stats.engagementRate || 0,
      },
      contentTypeStats,
      recentActivity,
    };
  }
}

export const trendingService = new TrendingService();
