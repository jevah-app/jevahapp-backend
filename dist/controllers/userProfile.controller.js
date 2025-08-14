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
exports.getCurrentUserProfile = exports.searchUserProfiles = exports.getMultipleUserProfiles = exports.getUserProfile = void 0;
const userProfile_service_1 = require("../service/userProfile.service");
const asyncHandler_1 = require("../utils/asyncHandler");
/**
 * Get user profile by ID
 */
exports.getUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({
            success: false,
            message: "User ID is required",
        });
    }
    const userProfile = yield userProfile_service_1.userProfileService.getUserProfile(userId);
    if (!userProfile) {
        return res.status(404).json({
            success: false,
            message: "User not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "User profile retrieved successfully",
        data: userProfile,
    });
}));
/**
 * Get multiple user profiles by IDs
 */
exports.getMultipleUserProfiles = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userIds } = req.body;
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
            success: false,
            message: "User IDs array is required",
        });
    }
    const userProfiles = yield userProfile_service_1.userProfileService.getMultipleUserProfiles(userIds);
    res.status(200).json({
        success: true,
        message: "User profiles retrieved successfully",
        data: userProfiles,
    });
}));
/**
 * Search user profiles
 */
exports.searchUserProfiles = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { query, limit } = req.query;
    if (!query || typeof query !== "string") {
        return res.status(400).json({
            success: false,
            message: "Search query is required",
        });
    }
    const limitNumber = limit ? parseInt(limit) : 10;
    const userProfiles = yield userProfile_service_1.userProfileService.searchUserProfiles(query, limitNumber);
    res.status(200).json({
        success: true,
        message: "User profiles search completed",
        data: userProfiles,
    });
}));
/**
 * Get current user's profile
 */
exports.getCurrentUserProfile = (0, asyncHandler_1.asyncHandler)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "User not authenticated",
        });
    }
    const userProfile = yield userProfile_service_1.userProfileService.getUserProfile(userId);
    if (!userProfile) {
        return res.status(404).json({
            success: false,
            message: "User profile not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Current user profile retrieved successfully",
        data: userProfile,
    });
}));
