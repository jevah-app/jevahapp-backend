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
exports.trendingService = exports.TrendingService = void 0;
const user_model_1 = require("../models/user.model");
const media_model_1 = require("../models/media.model");
class TrendingService {
    getTrendingUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { role: "content_creator" },
                        { role: "artist" },
                        { "artistProfile.isVerifiedArtist": true },
                    ],
                }).limit(limit);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const media = yield media_model_1.Media.find({ uploadedBy: user._id });
                    const totalViews = media.reduce((sum, m) => sum + (m.viewCount || 0), 0);
                    const totalLikes = media.reduce((sum, m) => sum + (m.likeCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalViews, totalLikes },
                        media,
                    });
                })));
                return results.sort((a, b) => b.stats.totalViews - a.stats.totalViews);
            }
            catch (error) {
                console.error("Error getting trending users:", error);
                throw error;
            }
        });
    }
    getMostViewedUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            return this.getTrendingUsers(limit);
        });
    }
    getMostReadEbookUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { role: "content_creator" },
                        { role: "artist" },
                        { "artistProfile.isVerifiedArtist": true },
                    ],
                }).limit(limit);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const ebooks = yield media_model_1.Media.find({
                        uploadedBy: user._id,
                        contentType: "ebook",
                    });
                    if (ebooks.length === 0)
                        return null;
                    const totalReads = ebooks.reduce((sum, m) => sum + (m.readCount || 0), 0);
                    const totalLikes = ebooks.reduce((sum, m) => sum + (m.likeCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalReads, totalLikes },
                        media: ebooks,
                    });
                })));
                return results
                    .filter((result) => result !== null)
                    .sort((a, b) => b.stats.totalReads - a.stats.totalReads);
            }
            catch (error) {
                console.error("Error getting most read ebook users:", error);
                throw error;
            }
        });
    }
    getMostListenedAudioUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { role: "content_creator" },
                        { role: "artist" },
                        { "artistProfile.isVerifiedArtist": true },
                    ],
                }).limit(limit);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const audioContent = yield media_model_1.Media.find({
                        uploadedBy: user._id,
                        contentType: { $in: ["audio", "music", "podcast"] },
                    });
                    if (audioContent.length === 0)
                        return null;
                    const totalListens = audioContent.reduce((sum, m) => sum + (m.listenCount || 0), 0);
                    const totalLikes = audioContent.reduce((sum, m) => sum + (m.likeCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalListens, totalLikes },
                        media: audioContent,
                    });
                })));
                return results
                    .filter((result) => result !== null)
                    .sort((a, b) => b.stats.totalListens - a.stats.totalListens);
            }
            catch (error) {
                console.error("Error getting most listened audio users:", error);
                throw error;
            }
        });
    }
    getMostHeardSermonUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { role: "content_creator" },
                        { role: "artist" },
                        { "artistProfile.isVerifiedArtist": true },
                    ],
                }).limit(limit);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const sermons = yield media_model_1.Media.find({
                        uploadedBy: user._id,
                        contentType: "sermon",
                    });
                    if (sermons.length === 0)
                        return null;
                    const totalSermonViews = sermons.reduce((sum, m) => sum + (m.viewCount || 0), 0);
                    const totalLikes = sermons.reduce((sum, m) => sum + (m.likeCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalSermonViews, totalLikes },
                        media: sermons,
                    });
                })));
                return results
                    .filter((result) => result !== null)
                    .sort((a, b) => b.stats.totalSermonViews -
                    a.stats.totalSermonViews);
            }
            catch (error) {
                console.error("Error getting most heard sermon users:", error);
                throw error;
            }
        });
    }
    getMostCheckedOutLiveUsers() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { role: "content_creator" },
                        { role: "artist" },
                        { "artistProfile.isVerifiedArtist": true },
                    ],
                }).limit(limit);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const liveStreams = yield media_model_1.Media.find({
                        uploadedBy: user._id,
                        contentType: "live",
                    });
                    if (liveStreams.length === 0)
                        return null;
                    const totalLiveViews = liveStreams.reduce((sum, m) => sum + (m.viewCount || 0), 0);
                    const totalLikes = liveStreams.reduce((sum, m) => sum + (m.likeCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalLiveViews, totalLikes },
                        media: liveStreams,
                    });
                })));
                return results
                    .filter((result) => result !== null)
                    .sort((a, b) => b.stats.totalLiveViews - a.stats.totalLiveViews);
            }
            catch (error) {
                console.error("Error getting most checked out live users:", error);
                throw error;
            }
        });
    }
    getLiveStreamTiming() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const now = new Date();
                const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const currentlyLive = yield this.getCurrentlyLiveUsers();
                const recentlyEnded = yield this.getRecentlyEndedUsers(oneDayAgo);
                const scheduledToday = yield this.getScheduledUsers(now, new Date(now.getTime() + 24 * 60 * 60 * 1000));
                const scheduledThisWeek = yield this.getScheduledUsers(now, new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
                const popularLiveStreamers = yield this.getPopularLiveStreamers();
                return {
                    currentlyLive,
                    recentlyEnded,
                    scheduledToday,
                    scheduledThisWeek,
                    popularLiveStreamers,
                };
            }
            catch (error) {
                console.error("Error getting live stream timing:", error);
                throw error;
            }
        });
    }
    getCurrentlyLiveUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const liveStreams = yield media_model_1.Media.find({
                    contentType: "live",
                    liveStreamStatus: "live",
                    isLive: true,
                });
                const userIds = [...new Set(liveStreams.map(ls => ls.uploadedBy))];
                const users = yield user_model_1.User.find({ _id: { $in: userIds } });
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const userLiveStreams = liveStreams.filter(ls => ls.uploadedBy.equals(user._id));
                    const currentLiveViews = userLiveStreams.reduce((sum, ls) => sum + (ls.concurrentViewers || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { currentLiveViews },
                        media: userLiveStreams,
                    });
                })));
                return results.sort((a, b) => b.stats.currentLiveViews - a.stats.currentLiveViews);
            }
            catch (error) {
                console.error("Error getting currently live users:", error);
                throw error;
            }
        });
    }
    getRecentlyEndedUsers(since) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const recentLiveStreams = yield media_model_1.Media.find({
                    contentType: "live",
                    liveStreamStatus: "ended",
                    actualEnd: { $gte: since },
                });
                const userIds = [...new Set(recentLiveStreams.map(ls => ls.uploadedBy))];
                const users = yield user_model_1.User.find({ _id: { $in: userIds } });
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const userLiveStreams = recentLiveStreams.filter(ls => ls.uploadedBy.equals(user._id));
                    const totalLiveViews = userLiveStreams.reduce((sum, ls) => sum + (ls.viewCount || 0), 0);
                    return this.formatTrendingUser({
                        user,
                        stats: { totalLiveViews },
                        media: userLiveStreams,
                    });
                })));
                return results.sort((a, b) => b.stats.totalLiveViews - a.stats.totalLiveViews);
            }
            catch (error) {
                console.error("Error getting recently ended users:", error);
                throw error;
            }
        });
    }
    getScheduledUsers(from, to) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const scheduledStreams = yield media_model_1.Media.find({
                    contentType: "live",
                    liveStreamStatus: "scheduled",
                    scheduledStart: { $gte: from, $lte: to },
                });
                const userIds = [...new Set(scheduledStreams.map(ls => ls.uploadedBy))];
                const users = yield user_model_1.User.find({ _id: { $in: userIds } });
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const userScheduledStreams = scheduledStreams.filter(ls => ls.uploadedBy.equals(user._id));
                    const scheduledCount = userScheduledStreams.length;
                    return this.formatTrendingUser({
                        user,
                        stats: { scheduledCount },
                        media: userScheduledStreams,
                    });
                })));
                return results.sort((a, b) => b.stats.scheduledCount - a.stats.scheduledCount);
            }
            catch (error) {
                console.error("Error getting scheduled users:", error);
                throw error;
            }
        });
    }
    getPopularLiveStreamers() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const liveStreams = yield media_model_1.Media.find({ contentType: "live" });
                const userIds = [...new Set(liveStreams.map(ls => ls.uploadedBy))];
                const users = yield user_model_1.User.find({ _id: { $in: userIds } }).limit(20);
                const results = yield Promise.all(users.map((user) => __awaiter(this, void 0, void 0, function* () {
                    const userLiveStreams = liveStreams.filter(ls => ls.uploadedBy.equals(user._id));
                    const totalLiveViews = userLiveStreams.reduce((sum, ls) => sum + (ls.viewCount || 0), 0);
                    const liveStreamCount = userLiveStreams.length;
                    return this.formatTrendingUser({
                        user,
                        stats: { totalLiveViews, liveStreamCount },
                        media: userLiveStreams,
                    });
                })));
                return results.sort((a, b) => b.stats.totalLiveViews - a.stats.totalLiveViews);
            }
            catch (error) {
                console.error("Error getting popular live streamers:", error);
                throw error;
            }
        });
    }
    formatTrendingUser(data) {
        var _a, _b, _c, _d;
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
        media.forEach((item) => {
            const contentType = item.contentType;
            if (contentTypeStats[contentType]) {
                const stats = contentTypeStats[contentType];
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
            lastLiveStream: (_a = media
                .filter((item) => item.contentType === "live" && item.actualEnd)
                .sort((a, b) => new Date(b.actualEnd).getTime() - new Date(a.actualEnd).getTime())[0]) === null || _a === void 0 ? void 0 : _a.actualEnd,
            lastUpload: (_b = media.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]) === null || _b === void 0 ? void 0 : _b.createdAt,
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
                followerCount: ((_c = user.followers) === null || _c === void 0 ? void 0 : _c.length) || 0,
                followingCount: ((_d = user.following) === null || _d === void 0 ? void 0 : _d.length) || 0,
                engagementRate: stats.engagementRate || 0,
            },
            contentTypeStats,
            recentActivity,
        };
    }
}
exports.TrendingService = TrendingService;
exports.trendingService = new TrendingService();
