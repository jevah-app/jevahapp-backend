import { User } from "../models/user.model";

export interface UserProfileData {
  _id: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  section: "kids" | "adult";
  email: string;
  username?: string;
}

export class UserProfileService {
  async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      const user = await User.findById(userId).select(
        "avatar firstName lastName fullName email username role artistProfile"
      );

      if (!user) {
        return null;
      }

      // Determine section based on role or artist profile
      let section: "kids" | "adult" = "adult";

      if (
        user.role === "kids_content_creator" ||
        (user.artistProfile && user.artistProfile.targetAudience === "kids")
      ) {
        section = "kids";
      }

      // Determine name to use
      let displayName: string | undefined;
      if (user.fullName) {
        displayName = user.fullName;
      } else if (user.firstName && user.lastName) {
        displayName = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        displayName = user.firstName;
      } else if (user.username) {
        displayName = user.username;
      }

      return {
        _id: user._id.toString(),
        avatar: user.avatar,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: displayName,
        section,
        email: user.email,
        username: user.username,
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  async getMultipleUserProfiles(userIds: string[]): Promise<UserProfileData[]> {
    try {
      const users = await User.find({
        _id: { $in: userIds },
      }).select(
        "avatar firstName lastName fullName email username role artistProfile"
      );

      return users.map(user => {
        // Determine section based on role or artist profile
        let section: "kids" | "adult" = "adult";

        if (
          user.role === "kids_content_creator" ||
          (user.artistProfile && user.artistProfile.targetAudience === "kids")
        ) {
          section = "kids";
        }

        // Determine name to use
        let displayName: string | undefined;
        if (user.fullName) {
          displayName = user.fullName;
        } else if (user.firstName && user.lastName) {
          displayName = `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
          displayName = user.firstName;
        } else if (user.username) {
          displayName = user.username;
        }

        return {
          _id: user._id.toString(),
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: displayName,
          section,
          email: user.email,
          username: user.username,
        };
      });
    } catch (error) {
      console.error("Error fetching multiple user profiles:", error);
      throw error;
    }
  }

  async searchUserProfiles(
    query: string,
    limit: number = 10
  ): Promise<UserProfileData[]> {
    try {
      const users = await User.find({
        $or: [
          { firstName: { $regex: query, $options: "i" } },
          { lastName: { $regex: query, $options: "i" } },
          { fullName: { $regex: query, $options: "i" } },
          { username: { $regex: query, $options: "i" } },
          { email: { $regex: query, $options: "i" } },
        ],
      })
        .select(
          "avatar firstName lastName fullName email username role artistProfile"
        )
        .limit(limit);

      return users.map(user => {
        // Determine section based on role or artist profile
        let section: "kids" | "adult" = "adult";

        if (
          user.role === "kids_content_creator" ||
          (user.artistProfile && user.artistProfile.targetAudience === "kids")
        ) {
          section = "kids";
        }

        // Determine name to use
        let displayName: string | undefined;
        if (user.fullName) {
          displayName = user.fullName;
        } else if (user.firstName && user.lastName) {
          displayName = `${user.firstName} ${user.lastName}`;
        } else if (user.firstName) {
          displayName = user.firstName;
        } else if (user.username) {
          displayName = user.username;
        }

        return {
          _id: user._id.toString(),
          avatar: user.avatar,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: displayName,
          section,
          email: user.email,
          username: user.username,
        };
      });
    } catch (error) {
      console.error("Error searching user profiles:", error);
      throw error;
    }
  }
}

export const userProfileService = new UserProfileService();

