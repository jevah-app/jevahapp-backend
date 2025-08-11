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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = require("../models/user.model");
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * User service for handling user-related operations
 * Provides methods for user management, profile operations, and user queries
 */
class UserService {
    /**
     * Get current user profile by ID
     * @param userId - The user's ID
     * @returns User profile data
     * @throws Error if user not found
     */
    getCurrentUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const user = yield user_model_1.User.findById(userId).select("firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt");
                if (!user) {
                    throw new Error("User not found");
                }
                // Prefer avatar, fallback to avatarUpload if needed
                const avatar = user.avatar || user.avatarUpload || null;
                const userProfile = {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar,
                    avatarUpload: user.avatarUpload,
                    section: user.section,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "users", duration, {
                    userId,
                    operation: "getCurrentUser",
                });
                return userProfile;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting current user", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get all users with pagination and filtering
     * @param page - Page number (default: 1)
     * @param limit - Number of users per page (default: 10, max: 100)
     * @param filters - Optional filters for user search
     * @returns Paginated list of users
     */
    getAllUsers() {
        return __awaiter(this, arguments, void 0, function* (page = 1, limit = 10, filters = {}) {
            const startTime = Date.now();
            try {
                // Validate and sanitize parameters
                const validPage = Math.max(1, page);
                const validLimit = Math.min(100, Math.max(1, limit));
                const skip = (validPage - 1) * validLimit;
                // Build query filters
                const queryFilters = {};
                if (filters.search) {
                    queryFilters.$or = [
                        { firstName: { $regex: filters.search, $options: "i" } },
                        { lastName: { $regex: filters.search, $options: "i" } },
                        { email: { $regex: filters.search, $options: "i" } },
                    ];
                }
                if (filters.role) {
                    queryFilters.role = filters.role;
                }
                if (filters.section) {
                    queryFilters.section = filters.section;
                }
                if (filters.isProfileComplete !== undefined) {
                    queryFilters.isProfileComplete = filters.isProfileComplete;
                }
                if (filters.isEmailVerified !== undefined) {
                    queryFilters.isEmailVerified = filters.isEmailVerified;
                }
                if (filters.createdAt) {
                    queryFilters.createdAt = filters.createdAt;
                }
                // Execute queries
                const [users, total] = yield Promise.all([
                    user_model_1.User.find(queryFilters)
                        .select("firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt")
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(validLimit)
                        .lean(),
                    user_model_1.User.countDocuments(queryFilters),
                ]);
                // Transform users to match UserProfile interface
                const transformedUsers = users.map(user => ({
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar: user.avatar || user.avatarUpload || null,
                    avatarUpload: user.avatarUpload,
                    section: user.section,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                }));
                const totalPages = Math.ceil(total / validLimit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "users", duration, {
                    operation: "getAllUsers",
                    page: validPage,
                    limit: validLimit,
                    total,
                    filters: Object.keys(filters),
                });
                return {
                    users: transformedUsers,
                    total,
                    page: validPage,
                    limit: validLimit,
                    totalPages,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting all users", {
                    error: error.message,
                    duration: `${duration}ms`,
                    page,
                    limit,
                    filters,
                });
                throw error;
            }
        });
    }
    /**
     * Get user by ID
     * @param userId - The user's ID
     * @returns User profile data
     * @throws Error if user not found
     */
    getUserById(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                if (!mongoose_1.Types.ObjectId.isValid(userId)) {
                    throw new Error("Invalid user ID format");
                }
                const user = yield user_model_1.User.findById(userId).select("firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt");
                if (!user) {
                    throw new Error("User not found");
                }
                const avatar = user.avatar || user.avatarUpload || null;
                const userProfile = {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar,
                    avatarUpload: user.avatarUpload,
                    section: user.section,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "users", duration, {
                    userId,
                    operation: "getUserById",
                });
                return userProfile;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting user by ID", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Update user profile
     * @param userId - The user's ID
     * @param updateData - Data to update
     * @returns Updated user profile
     * @throws Error if user not found or update fails
     */
    updateUserProfile(userId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                // Remove fields that shouldn't be updated directly
                const { id, email, createdAt, updatedAt } = updateData, allowedUpdates = __rest(updateData, ["id", "email", "createdAt", "updatedAt"]);
                const user = yield user_model_1.User.findByIdAndUpdate(userId, allowedUpdates, {
                    new: true,
                    runValidators: true,
                }).select("firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt");
                if (!user) {
                    throw new Error("User not found");
                }
                const avatar = user.avatar || user.avatarUpload || null;
                const userProfile = {
                    id: user._id.toString(),
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    avatar,
                    avatarUpload: user.avatarUpload,
                    section: user.section,
                    role: user.role,
                    isProfileComplete: user.isProfileComplete,
                    isEmailVerified: user.isEmailVerified,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                };
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "users", duration, {
                    userId,
                    operation: "updateUserProfile",
                    updatedFields: Object.keys(allowedUpdates),
                });
                return userProfile;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error updating user profile", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                    updateData,
                });
                throw error;
            }
        });
    }
    /**
     * Delete user account
     * @param userId - The user's ID
     * @returns Success message
     * @throws Error if user not found or deletion fails
     */
    deleteUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const user = yield user_model_1.User.findByIdAndDelete(userId);
                if (!user) {
                    throw new Error("User not found");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("delete", "users", duration, {
                    userId,
                    operation: "deleteUser",
                });
                return { message: "User account deleted successfully" };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error deleting user", {
                    error: error.message,
                    userId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get user statistics
     * @returns User statistics
     */
    getUserStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const [totalUsers, verifiedUsers, completeProfiles, usersByRole, usersBySection,] = yield Promise.all([
                    user_model_1.User.countDocuments(),
                    user_model_1.User.countDocuments({ isEmailVerified: true }),
                    user_model_1.User.countDocuments({ isProfileComplete: true }),
                    user_model_1.User.aggregate([
                        { $group: { _id: "$role", count: { $sum: 1 } } },
                        { $project: { role: "$_id", count: 1, _id: 0 } },
                    ]),
                    user_model_1.User.aggregate([
                        { $group: { _id: "$section", count: { $sum: 1 } } },
                        { $project: { section: "$_id", count: 1, _id: 0 } },
                    ]),
                ]);
                const roleStats = usersByRole.reduce((acc, item) => {
                    acc[item.role] = item.count;
                    return acc;
                }, {});
                const sectionStats = usersBySection.reduce((acc, item) => {
                    acc[item.section] = item.count;
                    return acc;
                }, {});
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "users", duration, {
                    operation: "getUserStats",
                });
                return {
                    totalUsers,
                    verifiedUsers,
                    completeProfiles,
                    usersByRole: roleStats,
                    usersBySection: sectionStats,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting user statistics", {
                    error: error.message,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
}
exports.default = new UserService();
