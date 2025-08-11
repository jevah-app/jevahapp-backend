import { User } from "../models/user.model";
import { Types } from "mongoose";
import logger from "../utils/logger";

/**
 * Interface for user profile data
 */
interface UserProfile {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  avatar?: string;
  avatarUpload?: string;
  section?: string;
  role?: string;
  age?: number;
  isKid?: boolean;
  location?: string;
  parentEmail?: string;
  parentalControlEnabled?: boolean;
  hasConsentedToPrivacyPolicy?: boolean;
  isProfileComplete?: boolean;
  isEmailVerified?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for user list response
 */
interface UserListResponse {
  users: UserProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface for user search filters
 */
interface UserFilters {
  search?: string;
  role?: string;
  section?: string;
  isProfileComplete?: boolean;
  isEmailVerified?: boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

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
  async getCurrentUser(userId: string): Promise<UserProfile> {
    const startTime = Date.now();

    try {
      const user = await User.findById(userId).select(
        "firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt"
      );

      if (!user) {
        throw new Error("User not found");
      }

      // Prefer avatar, fallback to avatarUpload if needed
      const avatar = user.avatar || user.avatarUpload || null;

      const userProfile: UserProfile = {
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
      logger.logDatabase("find", "users", duration, {
        userId,
        operation: "getCurrentUser",
      });

      return userProfile;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error getting current user", {
        error: (error as Error).message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   * @param page - Page number (default: 1)
   * @param limit - Number of users per page (default: 10, max: 100)
   * @param filters - Optional filters for user search
   * @returns Paginated list of users
   */
  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    filters: UserFilters = {}
  ): Promise<UserListResponse> {
    const startTime = Date.now();

    try {
      // Validate and sanitize parameters
      const validPage = Math.max(1, page);
      const validLimit = Math.min(100, Math.max(1, limit));
      const skip = (validPage - 1) * validLimit;

      // Build query filters
      const queryFilters: any = {};

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
      const [users, total] = await Promise.all([
        User.find(queryFilters)
          .select(
            "firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(validLimit)
          .lean(),
        User.countDocuments(queryFilters),
      ]);

      // Transform users to match UserProfile interface
      const transformedUsers: UserProfile[] = users.map(user => ({
        id: (user as any)._id.toString(),
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        email: (user as any).email,
        avatar: (user as any).avatar || (user as any).avatarUpload || null,
        avatarUpload: (user as any).avatarUpload,
        section: (user as any).section,
        role: (user as any).role,
        isProfileComplete: (user as any).isProfileComplete,
        isEmailVerified: (user as any).isEmailVerified,
        createdAt: (user as any).createdAt,
        updatedAt: (user as any).updatedAt,
      }));

      const totalPages = Math.ceil(total / validLimit);
      const duration = Date.now() - startTime;

      logger.logDatabase("find", "users", duration, {
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
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error getting all users", {
        error: (error as Error).message,
        duration: `${duration}ms`,
        page,
        limit,
        filters,
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param userId - The user's ID
   * @returns User profile data
   * @throws Error if user not found
   */
  async getUserById(userId: string): Promise<UserProfile> {
    const startTime = Date.now();

    try {
      if (!Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid user ID format");
      }

      const user = await User.findById(userId).select(
        "firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt"
      );

      if (!user) {
        throw new Error("User not found");
      }

      const avatar = user.avatar || user.avatarUpload || null;

      const userProfile: UserProfile = {
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
      logger.logDatabase("find", "users", duration, {
        userId,
        operation: "getUserById",
      });

      return userProfile;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error getting user by ID", {
        error: (error as Error).message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Update user profile
   * @param userId - The user's ID
   * @param updateData - Data to update
   * @returns Updated user profile
   * @throws Error if user not found or update fails
   */
  async updateUserProfile(
    userId: string,
    updateData: Partial<UserProfile>
  ): Promise<UserProfile> {
    const startTime = Date.now();

    try {
      // Remove fields that shouldn't be updated directly
      const { id, email, createdAt, updatedAt, ...allowedUpdates } = updateData;

      const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
        new: true,
        runValidators: true,
      }).select(
        "firstName lastName email avatar avatarUpload section role isProfileComplete isEmailVerified createdAt updatedAt"
      );

      if (!user) {
        throw new Error("User not found");
      }

      const avatar = user.avatar || user.avatarUpload || null;

      const userProfile: UserProfile = {
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
      logger.logDatabase("update", "users", duration, {
        userId,
        operation: "updateUserProfile",
        updatedFields: Object.keys(allowedUpdates),
      });

      return userProfile;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error updating user profile", {
        error: (error as Error).message,
        userId,
        duration: `${duration}ms`,
        updateData,
      });
      throw error;
    }
  }

  /**
   * Delete user account
   * @param userId - The user's ID
   * @returns Success message
   * @throws Error if user not found or deletion fails
   */
  async deleteUser(userId: string): Promise<{ message: string }> {
    const startTime = Date.now();

    try {
      const user = await User.findByIdAndDelete(userId);

      if (!user) {
        throw new Error("User not found");
      }

      const duration = Date.now() - startTime;
      logger.logDatabase("delete", "users", duration, {
        userId,
        operation: "deleteUser",
      });

      return { message: "User account deleted successfully" };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error deleting user", {
        error: (error as Error).message,
        userId,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns User statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    verifiedUsers: number;
    completeProfiles: number;
    usersByRole: Record<string, number>;
    usersBySection: Record<string, number>;
  }> {
    const startTime = Date.now();

    try {
      const [
        totalUsers,
        verifiedUsers,
        completeProfiles,
        usersByRole,
        usersBySection,
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ isProfileComplete: true }),
        User.aggregate([
          { $group: { _id: "$role", count: { $sum: 1 } } },
          { $project: { role: "$_id", count: 1, _id: 0 } },
        ]),
        User.aggregate([
          { $group: { _id: "$section", count: { $sum: 1 } } },
          { $project: { section: "$_id", count: 1, _id: 0 } },
        ]),
      ]);

      const roleStats = usersByRole.reduce(
        (acc, item) => {
          acc[item.role] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      const sectionStats = usersBySection.reduce(
        (acc, item) => {
          acc[item.section] = item.count;
          return acc;
        },
        {} as Record<string, number>
      );

      const duration = Date.now() - startTime;
      logger.logDatabase("aggregate", "users", duration, {
        operation: "getUserStats",
      });

      return {
        totalUsers,
        verifiedUsers,
        completeProfiles,
        usersByRole: roleStats,
        usersBySection: sectionStats,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Error getting user statistics", {
        error: (error as Error).message,
        duration: `${duration}ms`,
      });
      throw error;
    }
  }
}

export default new UserService();
