
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";
import { BlacklistedToken } from "../models/blacklistedToken.model";
import { sendVerificationEmail, sendWelcomeEmail } from "../utils/mailer";
import {
  verifyClerkToken,
  extractUserInfoFromToken,
  validateUserInfo,
  ClerkTokenPayload,
} from "../utils/clerk";
import fileUploadService from "./fileUpload.service";

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}

class AuthService {
  private setVerificationFlags(role: string) {
    const verificationFlags = {
      isVerifiedCreator: false,
      isVerifiedVendor: false,
      isVerifiedChurch: false,
    };

    switch (role) {
      case "content_creator":
        verificationFlags.isVerifiedCreator = false;
        break;
      case "vendor":
        verificationFlags.isVerifiedVendor = false;
        break;
      case "church_admin":
        verificationFlags.isVerifiedChurch = false;
        break;
    }

    return verificationFlags;
  }

  async oauthLogin(provider: string, token: string, userInfo: any) {
    try {
      // Validate input parameters
      if (!provider || !token || !userInfo) {
        throw new Error("Provider, token, and user information are required");
      }

      // Verify Clerk token and extract user data
      const tokenData = await extractUserInfoFromToken(token);
      const validatedUserInfo = validateUserInfo(userInfo);

      if (!tokenData.email) {
        throw new Error(
          `${provider.charAt(0).toUpperCase() + provider.slice(1)} email not found in Clerk token`
        );
      }

      // Check if user exists
      let user = await User.findOne({ email: tokenData.email });
      const isNewUser = !user;

      if (!user) {
        // Create new user
        user = await User.create({
          email: tokenData.email,
          firstName: validatedUserInfo.firstName,
          lastName: validatedUserInfo.lastName,
          avatar: validatedUserInfo.avatar,
          provider: provider.toLowerCase(),
          clerkId: tokenData.clerkId,
          isEmailVerified: tokenData.emailVerified,
          isProfileComplete: false,
          age: 0,
          isKid: false,
          section: "adults",
          role: "learner",
          hasConsentedToPrivacyPolicy: false,
        });

        if (tokenData.emailVerified) {
          await sendWelcomeEmail(user.email, user.firstName || "User");
        }
      } else {
        // Update existing user's Clerk ID if not set
        if (!user.clerkId) {
          user.clerkId = tokenData.clerkId;
          await user.save();
        }
      }

      // Generate JWT token for backend authentication
      const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, {
        expiresIn: "7d",
      });

      return {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isProfileComplete: user.isProfileComplete,
          role: user.role,
        },
        isNewUser,
      };
    } catch (error) {
      console.error("OAuth login error:", error);
      throw error;
    }
  }

  async clerkLogin(token: string, userInfo: any) {
    try {
      // Validate input parameters
      if (!token || !userInfo) {
        throw new Error("Token and user information are required");
      }

      // Verify Clerk token and extract user data
      const tokenData = await extractUserInfoFromToken(token);
      const validatedUserInfo = validateUserInfo(userInfo);

      if (!tokenData.email) {
        throw new Error("Email not found in Clerk token");
      }

      // Check if user exists
      let user = await User.findOne({ email: tokenData.email });
      const isNewUser = !user;

      if (!user) {
        // Create new user
        user = await User.create({
          email: tokenData.email,
          firstName: validatedUserInfo.firstName,
          lastName: validatedUserInfo.lastName,
          avatar: validatedUserInfo.avatar,
          provider: "clerk",
          clerkId: tokenData.clerkId,
          isEmailVerified: tokenData.emailVerified,
          isProfileComplete: false,
          age: 0,
          isKid: false,
          section: "adults",
          role: "learner",
          hasConsentedToPrivacyPolicy: false,
        });

        if (tokenData.emailVerified) {
          await sendWelcomeEmail(user.email, user.firstName || "User");
        }
      } else {
        // Update existing user's Clerk ID if not set
        if (!user.clerkId) {
          user.clerkId = tokenData.clerkId;
          await user.save();
        }
      }

      return {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          isProfileComplete: user.isProfileComplete,
          role: user.role,
        },
        needsAgeSelection: !user.age,
        isNewUser,
      };
    } catch (error) {
      console.error("Clerk login error:", error);
      throw error;
    }
  }

  async registerUser(
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    desiredRole?: string,
    avatarBuffer?: Buffer,
    avatarMimeType?: string
  ) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email address is already registered");
    }

    // Check if user wants to register as artist
    if (desiredRole === "artist") {
      throw new Error(
        "Artist registration requires additional information. Please use the artist registration endpoint."
      );
    }

    const allowedRoles = [
      "learner",
      "parent",
      "educator",
      "content_creator",
      "vendor",
      "church_admin",
    ];

    const role =
      desiredRole && allowedRoles.includes(desiredRole)
        ? desiredRole
        : "learner";

    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationFlags = this.setVerificationFlags(role);
    let avatarUrl: string | undefined;
    if (avatarBuffer && avatarMimeType) {
      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarMimeType)) {
        throw new Error(`Invalid image type: ${avatarMimeType}`);
      }
      const uploadResult = await fileUploadService.uploadMedia(
        avatarBuffer,
        "user-avatars",
        avatarMimeType
      );
      console.log("Avatar Upload Result:", uploadResult);
      avatarUrl = uploadResult.secure_url;
    }

    const newUser = await User.create({
      email,
      firstName: firstName || email.split("@")[0], // Use email prefix as fallback
      lastName,
      avatar: avatarUrl,
      provider: "email",
      password: hashedPassword,
      verificationCode,
      verificationCodeExpires,
      isEmailVerified: false,
      isProfileComplete: false,
      age: 0,
      isKid: false,
      section: "adults",
      role,
      hasConsentedToPrivacyPolicy: false,
      ...verificationFlags,
    });

    await sendVerificationEmail(
      newUser.email,
      newUser.firstName,
      verificationCode
    );

    return {
      id: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      avatar: newUser.avatar,
      role: newUser.role,
    };
  }

  async registerArtist(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    artistName: string,
    genre: string[],
    bio?: string,
    socialMedia?: {
      instagram?: string;
      twitter?: string;
      facebook?: string;
      youtube?: string;
      spotify?: string;
    },
    recordLabel?: string,
    yearsActive?: number,
    avatarBuffer?: Buffer,
    avatarMimeType?: string
  ) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error("Email address is already registered");
    }

    // Validate artist-specific fields
    if (!artistName || artistName.trim().length < 2) {
      throw new Error("Artist name must be at least 2 characters long");
    }

    if (!genre || genre.length === 0) {
      throw new Error("At least one genre must be specified");
    }

    // Validate genre values (you can expand this list)
    const validGenres = [
      "gospel",
      "worship",
      "praise",
      "christian rock",
      "christian hip hop",
      "contemporary christian",
      "traditional gospel",
      "southern gospel",
      "urban gospel",
      "christian pop",
      "christian country",
      "christian jazz",
      "christian blues",
      "christian reggae",
      "christian electronic",
    ];

    const invalidGenres = genre.filter(
      (g) => !validGenres.includes(g.toLowerCase())
    );
    if (invalidGenres.length > 0) {
      throw new Error(
        `Invalid genres: ${invalidGenres.join(", ")}. Valid genres: ${validGenres.join(", ")}`
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let avatarUrl: string | undefined;

    if (avatarBuffer && avatarMimeType) {
      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarMimeType)) {
        throw new Error(`Invalid image type: ${avatarMimeType}`);
      }
      const uploadResult = await fileUploadService.uploadMedia(
        avatarBuffer,
        "artist-avatars",
        avatarMimeType
      );
      avatarUrl = uploadResult.secure_url;
    }

    const newArtist = await User.create({
      email,
      firstName,
      lastName,
      avatar: avatarUrl,
      provider: "email",
      password: hashedPassword,
      isEmailVerified: false,
      isProfileComplete: false,
      age: 0,
      isKid: false,
      section: "adults",
      role: "artist",
      hasConsentedToPrivacyPolicy: false,
      isVerifiedArtist: false,
      artistProfile: {
        artistName: artistName.trim(),
        genre: genre.map((g) => g.toLowerCase()),
        bio: bio?.trim(),
        socialMedia,
        recordLabel: recordLabel?.trim(),
        yearsActive,
        verificationDocuments: [],
      },
    });

    // Send welcome email for artists
    await sendWelcomeEmail(newArtist.email, newArtist.firstName || "Artist");

    return {
      id: newArtist._id,
      email: newArtist.email,
      firstName: newArtist.firstName,
      lastName: newArtist.lastName,
      avatar: newArtist.avatar,
      role: newArtist.role,
      artistProfile: newArtist.artistProfile,
    };
  }

  async verifyArtist(userId: string, verificationDocuments: string[]) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "artist") {
      throw new Error("User is not an artist");
    }

    if (!user.artistProfile) {
      throw new Error("Artist profile not found");
    }

    // Update artist profile with verification documents
    user.artistProfile.verificationDocuments = verificationDocuments;
    user.isVerifiedArtist = true;
    await user.save();

    return {
      id: user._id,
      email: user.email,
      artistName: user.artistProfile.artistName,
      isVerifiedArtist: user.isVerifiedArtist,
    };
  }

  async updateArtistProfile(
    userId: string,
    updates: {
      artistName?: string;
      genre?: string[];
      bio?: string;
      socialMedia?: {
        instagram?: string;
        twitter?: string;
        facebook?: string;
        youtube?: string;
        spotify?: string;
      };
      recordLabel?: string;
      yearsActive?: number;
    }
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.role !== "artist") {
      throw new Error("User is not an artist");
    }

    if (!user.artistProfile) {
      throw new Error("Artist profile not found");
    }

    // Validate updates
    if (updates.artistName && updates.artistName.trim().length < 2) {
      throw new Error("Artist name must be at least 2 characters long");
    }

    if (updates.genre && updates.genre.length === 0) {
      throw new Error("At least one genre must be specified");
    }

    // Update artist profile
    const updatedProfile = {
      ...user.artistProfile,
      ...updates,
      artistName: updates.artistName?.trim() || user.artistProfile.artistName,
      genre:
        updates.genre?.map((g) => g.toLowerCase()) || user.artistProfile.genre,
      bio: updates.bio?.trim() || user.artistProfile.bio,
      recordLabel:
        updates.recordLabel?.trim() || user.artistProfile.recordLabel,
    };

    user.artistProfile = updatedProfile;
    await user.save();

    return {
      id: user._id,
      email: user.email,
      artistProfile: user.artistProfile,
    };
  }

  async loginUser(email: string, password: string) {
    const user = await User.findOne({ email, provider: "email" });
    if (!user || !(await bcrypt.compare(password, user.password || ""))) {
      throw new Error("Invalid email or password");
    }

    if (!user.isEmailVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        isProfileComplete: user.isProfileComplete,
      },
    };
  }

  async verifyEmail(email: string, code: string) {
    const user = await User.findOne({ email, verificationCode: code });
    if (!user) {
      throw new Error("Invalid email or code");
    }

    if (
      user.verificationCodeExpires &&
      user.verificationCodeExpires < new Date()
    ) {
      throw new Error("Verification code expired");
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    await sendWelcomeEmail(user.email, user.firstName || "User");

    return user;
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await User.findOne({
      email,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return user;
  }

  async resendVerificationEmail(email: string) {
    const user = await User.findOne({ email, provider: "email" });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isEmailVerified) {
      throw new Error("Email already verified");
    }

    const verificationCode = crypto
      .randomBytes(3)
      .toString("hex")
      .toUpperCase();
    const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    await user.save();

    await sendVerificationEmail(
      user.email,
      user.firstName || "User",
      verificationCode
    );

    return user;
  }

  async completeUserProfile(
    userId: string,
    age: number,
    location: string | undefined,
    hasConsentedToPrivacyPolicy: boolean,
    desiredRole?: string,
    interests?: string[],
    section?: string
  ) {
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    let userSection = section;
    let isKid: boolean;

    if (age < 18) {
      userSection = "kids";
      isKid = true;
    } else {
      userSection = "adults";
      isKid = false;
    }

    if (section && section !== userSection) {
      throw new Error(
        `Provided section '${section}' is invalid for age ${age}. Age ${age} requires section '${userSection}'.`
      );
    }

    let role = currentUser.role;
    if (currentUser.role === "learner" && desiredRole) {
      const allowedRoles = [
        "learner",
        "parent",
        "educator",
        "content_creator",
        "vendor",
        "church_admin",
      ];
      if (allowedRoles.includes(desiredRole)) {
        role = desiredRole;
      }
    }

    const verificationFlags =
      role !== currentUser.role ? this.setVerificationFlags(role) : {};

    const updateData: any = {
      age,
      location,
      section: userSection,
      isKid,
      role,
      hasConsentedToPrivacyPolicy,
      isProfileComplete: true,
      ...verificationFlags,
    };

    if (interests && Array.isArray(interests)) {
      updateData.interests = interests;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getCurrentUser(userId: string) {
    const user = await User.findById(userId).select(
      "firstName lastName avatar avatarUpload section"
    );

    if (!user) {
      throw new Error("User not found");
    }

    const avatar = user.avatar || user.avatarUpload || null;

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      avatar,
      section: user.section || "adults",
    };
  }

  async getUserSession(userId: string) {
    const user = await User.findById(userId).select(
      "_id email firstName lastName isProfileComplete role"
    );

    if (!user) {
      throw new Error("User not found");
    }

    return {
      userId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isProfileComplete: user.isProfileComplete,
      role: user.role,
    };
  }

  async updateUserAvatar(
    userId: string,
    avatarBuffer: Buffer,
    mimetype: string
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.avatar) {
      try {
        const publicId = user.avatar.split("/").pop()?.split(".")[0];
        if (publicId) {
          await fileUploadService.deleteMedia(
            `user-avatars/${publicId}`
          );
        }
      } catch (error) {
        console.error("Error deleting old avatar:", error);
      }
    }

    const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validImageMimeTypes.includes(mimetype)) {
      throw new Error(`Invalid image type: ${mimetype}`);
    }

    const uploadResult = await fileUploadService.uploadMedia(
      avatarBuffer,
      "user-avatars",
      mimetype
    );
    console.log("Avatar Upload Result:", uploadResult);

    user.avatar = uploadResult.secure_url;

    await user.save();

    return {
      avatarUrl: user.avatar,
      userId: user._id,
    };
  }

  async initiatePasswordReset(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found");
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpires = new Date(Date.now() + 3600000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    return resetToken;
  }

  async logout(userId: string, token: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Decode the JWT to get its expiration time
    const decodedToken = jwt.decode(token) as { exp?: number; userId?: string };
    if (!decodedToken || !decodedToken.exp) {
      throw new Error("Invalid token");
    }

    // Calculate expiration date from token's exp claim (exp is in seconds)
    const expiresAt = new Date(decodedToken.exp * 1000);

    // Check if token is already blacklisted
    const existingBlacklistedToken = await BlacklistedToken.findOne({ token });
    if (existingBlacklistedToken) {
      throw new Error("Token already invalidated");
    }

    // Add token to blacklist
    await BlacklistedToken.create({
      token,
      expiresAt,
    });

    return { message: "User logged out successfully" };
  }
}

export default new AuthService();
