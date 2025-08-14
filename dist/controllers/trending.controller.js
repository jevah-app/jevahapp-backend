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
exports.getTrendingAnalytics = exports.getLiveStreamTiming = exports.getMostCheckedOutLiveUsers = exports.getMostHeardSermonUsers = exports.getMostListenedAudioUsers = exports.getMostReadEbookUsers = exports.getMostViewedUsers = exports.getTrendingUsers = void 0;
const trending_service_1 = require("../service/trending.service");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Get trending users based on overall engagement
 */
exports.getTrendingUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getTrendingUsers(limit);
    res.status(200).json({
        success: true,
        message: "Trending users retrieved successfully",
        data: users,
    });
}));
/**
 * Get users with most viewed content
 */
exports.getMostViewedUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getMostViewedUsers(limit);
    res.status(200).json({
        success: true,
        message: "Most viewed users retrieved successfully",
        data: users,
    });
}));
/**
 * Get users with most read ebooks
 */
exports.getMostReadEbookUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getMostReadEbookUsers(limit);
    res.status(200).json({
        success: true,
        message: "Most read ebook users retrieved successfully",
        data: users,
    });
}));
/**
 * Get users with most listened audio content
 */
exports.getMostListenedAudioUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getMostListenedAudioUsers(limit);
    res.status(200).json({
        success: true,
        message: "Most listened audio users retrieved successfully",
        data: users,
    });
}));
/**
 * Get users with most heard sermons
 */
exports.getMostHeardSermonUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getMostHeardSermonUsers(limit);
    res.status(200).json({
        success: true,
        message: "Most heard sermon users retrieved successfully",
        data: users,
    });
}));
/**
 * Get users with most checked out live streams
 */
exports.getMostCheckedOutLiveUsers = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const users = yield trending_service_1.trendingService.getMostCheckedOutLiveUsers(limit);
    res.status(200).json({
        success: true,
        message: "Most checked out live users retrieved successfully",
        data: users,
    });
}));
/**
 * Get live stream timing categories
 */
exports.getLiveStreamTiming = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const timing = yield trending_service_1.trendingService.getLiveStreamTiming();
    res.status(200).json({
        success: true,
        message: "Live stream timing data retrieved successfully",
        data: timing,
    });
}));
/**
 * Get comprehensive trending analytics
 */
exports.getTrendingAnalytics = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const limit = parseInt(req.query.limit) || 20;
    const [trendingUsers, mostViewedUsers, mostReadEbookUsers, mostListenedAudioUsers, mostHeardSermonUsers, mostCheckedOutLiveUsers, liveStreamTiming,] = yield Promise.all([
        trending_service_1.trendingService.getTrendingUsers(limit),
        trending_service_1.trendingService.getMostViewedUsers(limit),
        trending_service_1.trendingService.getMostReadEbookUsers(limit),
        trending_service_1.trendingService.getMostListenedAudioUsers(limit),
        trending_service_1.trendingService.getMostHeardSermonUsers(limit),
        trending_service_1.trendingService.getMostCheckedOutLiveUsers(limit),
        trending_service_1.trendingService.getLiveStreamTiming(),
    ]);
    res.status(200).json({
        success: true,
        message: "Trending analytics retrieved successfully",
        data: {
            trendingUsers,
            mostViewedUsers,
            mostReadEbookUsers,
            mostListenedAudioUsers,
            mostHeardSermonUsers,
            mostCheckedOutLiveUsers,
            liveStreamTiming,
        },
    });
}));
