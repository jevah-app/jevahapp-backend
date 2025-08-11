import { Request, Response, NextFunction } from "express";
import authService from "../service/auth.service";
// import { VALID_INTERESTS } from "../constants/interests";
import { User } from "../models/user.model";
import multer from "multer";

class AuthController {
  async clerkLogin(request: Request, response: Response, next: NextFunction) {
    try {
      const { token, userInfo } = request.body;

      // Validate required fields
      if (!token) {
        return response.status(400).json({
          success: false,
          message: "Clerk authentication token is required",
        });
      }

      if (!userInfo || typeof userInfo !== "object") {
        return response.status(400).json({
          success: false,
          message: "User information object is required",
        });
      }

      const result = await authService.clerkLogin(token, userInfo);

      return response.status(200).json({
        success: true,
        message: "Clerk login successful",
        user: result.user,
        needsAgeSelection: result.needsAgeSelection,
        isNewUser: result.isNewUser,
      });
    } catch (error: any) {
      console.error("Clerk login error:", error);

      // Handle specific error types
      if (error.message.includes("Token")) {
        return response.status(401).json({
          success: false,
          message: "Invalid or expired Clerk token",
        });
      }

      if (error.message.includes("email")) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return response.status(500).json({
        success: false,
        message: "Authentication failed. Please try again.",
      });
    }
  }

  async oauthLogin(request: Request, response: Response, next: NextFunction) {
    try {
      const { provider, token, userInfo } = request.body;

      // Validate required fields
      if (!provider) {
        return response.status(400).json({
          success: false,
          message: "OAuth provider is required (e.g., 'google', 'facebook')",
        });
      }

      if (!token) {
        return response.status(400).json({
          success: false,
          message: "OAuth authentication token is required",
        });
      }

      if (!userInfo || typeof userInfo !== "object") {
        return response.status(400).json({
          success: false,
          message: "User information object is required",
        });
      }

      const result = await authService.oauthLogin(provider, token, userInfo);

      return response.status(200).json({
        success: true,
        message: `${provider} login successful`,
        token: result.token,
        user: result.user,
        isNewUser: result.isNewUser,
      });
    } catch (error: any) {
      console.error("OAuth login error:", error);

      // Handle specific error types
      if (error.message.includes("Token")) {
        return response.status(401).json({
          success: false,
          message: "Invalid or expired OAuth token",
        });
      }

      if (error.message.includes("email")) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes("Provider")) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return response.status(500).json({
        success: false,
        message: "OAuth authentication failed. Please try again.",
      });
    }
  }

  async registerUser(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, password, firstName, lastName, desiredRole } =
        request.body;

      // Only require email and password for basic registration
      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: "Email and password are required for registration",
        });
      }

      // Make firstName optional, use email prefix as fallback
      const displayName = firstName || email.split("@")[0];

      // Check if user wants to register as artist
      if (desiredRole === "artist") {
        return response.status(400).json({
          success: false,
          message: "Artist registration requires additional information",
          redirectToArtistRegistration: true,
          artistRegistrationEndpoint: "/api/auth/artist/register",
          requiredArtistFields: ["artistName", "genre"],
          optionalArtistFields: [
            "bio",
            "socialMedia",
            "recordLabel",
            "yearsActive",
            "avatar",
          ],
        });
      }

      const user = await authService.registerUser(
        email,
        password,
        displayName,
        lastName,
        desiredRole
      );

      return response.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Email address is already registered"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async registerUserWithAvatar(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email, password, firstName, lastName, desiredRole } =
        request.body;
      const avatarFile = request.file;

      // Only require email and password for basic registration
      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: "Email and password are required for registration",
        });
      }

      if (!avatarFile) {
        return response.status(400).json({
          success: false,
          message: "Avatar image is required",
        });
      }

      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
        return response.status(400).json({
          success: false,
          message: `Invalid image type: ${avatarFile.mimetype}`,
        });
      }

      // Make firstName optional, use email prefix as fallback
      const displayName = firstName || email.split("@")[0];

      const user = await authService.registerUser(
        email,
        password,
        displayName,
        lastName,
        desiredRole,
        avatarFile.buffer,
        avatarFile.mimetype
      );

      return response.status(201).json({
        success: true,
        message: "User registered successfully. Please verify your email.",
        user,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Email address is already registered"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async loginUser(request: Request, response: Response, next: NextFunction) {
    try {
      const {
        email,

        password,
      } = request.body;

      if (!email || !password) {
        return response.status(400).json({
          success: false,
          message: "Email and password are required",
        });
      }

      const result = await authService.loginUser(email, password);

      return response.status(200).json({
        success: true,
        message: "Login successful",
        token: result.token,
        user: result.user,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid email or password") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Please verify your email before logging in") {
          return response.status(403).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async verifyEmail(request: Request, response: Response, next: NextFunction) {
    try {
      const { email, code } = request.body;

      if (!email || !code) {
        return response.status(400).json({
          success: false,
          message: "Email and verification code are required",
        });
      }

      const user = await authService.verifyEmail(email, code);

      return response.status(200).json({
        success: true,
        message: "Email verified successfully",
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          isEmailVerified: user.isEmailVerified,
          role: user.role,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Invalid email or code") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Verification code expired") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async resetPassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email, token, newPassword } = request.body;

      if (!email || !token || !newPassword) {
        return response.status(400).json({
          success: false,
          message: "Email, token, and new password are required",
        });
      }

      await authService.resetPassword(email, token, newPassword);

      return response.status(200).json({
        success: true,
        message: "Password reset successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Invalid or expired reset token"
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async resendVerificationEmail(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email } = request.body;

      if (!email) {
        return response.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      await authService.resendVerificationEmail(email);

      return response.status(200).json({
        success: true,
        message: "Verification email resent successfully",
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "User not found") {
          return response.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message === "Email already verified") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async completeUserProfile(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;

      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const {
        age,
        isKid,
        section,
        role,
        location,
        avatarUpload,
        interests,
        hasConsentedToPrivacyPolicy,
        parentalControlEnabled,
        parentEmail,
      } = request.body;

      const updateFields: any = {};
      if (age !== undefined) updateFields.age = age;
      if (isKid !== undefined) updateFields.isKid = isKid;
      if (section !== undefined) updateFields.section = section;
      if (role !== undefined) updateFields.role = role;
      if (location !== undefined) updateFields.location = location;
      if (avatarUpload !== undefined) updateFields.avatarUpload = avatarUpload;
      if (interests !== undefined) updateFields.interests = interests;
      if (hasConsentedToPrivacyPolicy !== undefined) {
        updateFields.hasConsentedToPrivacyPolicy = hasConsentedToPrivacyPolicy;
      }
      if (parentalControlEnabled !== undefined) {
        updateFields.parentalControlEnabled = parentalControlEnabled;
      }
      if (parentEmail !== undefined) updateFields.parentEmail = parentEmail;

      const userBeforeUpdate = await User.findById(userId);

      if (!userBeforeUpdate) {
        return response.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const isSet = (field: string) =>
        userBeforeUpdate[field] !== undefined ||
        updateFields[field] !== undefined;

      const isProfileComplete = isSet("hasConsentedToPrivacyPolicy"); // Only require privacy policy consent

      // Update user with provided fields and defaults
      const finalUpdateFields = {
        ...updateFields,
        age: updateFields.age || userBeforeUpdate.age || 0,
        isKid:
          updateFields.isKid !== undefined
            ? updateFields.isKid
            : userBeforeUpdate.isKid || false,
        section: updateFields.section || userBeforeUpdate.section || "adults",
        role: updateFields.role || userBeforeUpdate.role || "learner",
        parentalControlEnabled:
          updateFields.parentalControlEnabled !== undefined
            ? updateFields.parentalControlEnabled
            : userBeforeUpdate.parentalControlEnabled || false,
        isProfileComplete,
      };

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        finalUpdateFields,
        {
          new: true,
        }
      );

      return response.status(200).json({
        success: true,
        message: "Profile updated successfully",
        user: updatedUser,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getCurrentUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      const user = await authService.getCurrentUser(userId);

      return response.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async getUserSession(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      const session = await authService.getUserSession(userId);

      return response.status(200).json({
        success: true,
        session,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async updateUserAvatar(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const userId = request.userId;
      const avatarFile = request.file;

      if (!userId) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID missing",
        });
      }

      if (!avatarFile) {
        return response.status(400).json({
          success: false,
          message: "Avatar image is required",
        });
      }

      const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validImageMimeTypes.includes(avatarFile.mimetype)) {
        return response.status(400).json({
          success: false,
          message: `Invalid image type: ${avatarFile.mimetype}`,
        });
      }

      const updateResult = await authService.updateUserAvatar(
        userId,
        avatarFile.buffer,
        avatarFile.mimetype
      );

      return response.status(200).json({
        success: true,
        message: "Avatar updated successfully",
        data: updateResult,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      if (
        error instanceof Error &&
        error.message.startsWith("Invalid image type")
      ) {
        return response.status(400).json({
          success: false,
          message: error.message,
        });
      }
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        return response.status(400).json({
          success: false,
          message: `Unexpected field in file upload. Expected field name: 'avatar'`,
        });
      }
      if (
        error instanceof multer.MulterError &&
        error.code === "LIMIT_FILE_SIZE"
      ) {
        return response.status(400).json({
          success: false,
          message: "File size exceeds the 5MB limit",
        });
      }
      return next(error);
    }
  }

  async initiatePasswordReset(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { email } = request.body;

      if (!email) {
        return response.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const resetToken = await authService.initiatePasswordReset(email);

      return response.status(200).json({
        success: true,
        message: "Password reset initiated",
        resetToken,
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async logout(request: Request, response: Response, next: NextFunction) {
    try {
      const userId = request.userId;
      const token = request.headers.authorization?.split(" ")[1]; // Assuming Bearer token

      if (!userId || !token) {
        return response.status(401).json({
          success: false,
          message: "Unauthorized: User ID or token missing",
        });
      }

      await authService.logout(userId, token);

      return response.status(200).json({
        success: true,
        message: "Logout successful",
      });
    } catch (error) {
      if (error instanceof Error && error.message === "User not found") {
        return response.status(404).json({
          success: false,
          message: error.message,
        });
      }
      return next(error);
    }
  }

  async registerArtist(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        artistName,
        genre,
        bio,
        socialMedia,
        recordLabel,
        yearsActive,
      } = request.body;

      const avatarFile = request.file;

      // Validate required fields
      if (!email || !password || !firstName || !artistName || !genre) {
        return response.status(400).json({
          success: false,
          message:
            "Email, password, first name, artist name, and genre are required fields",
        });
      }

      // Validate genre array
      if (!Array.isArray(genre) || genre.length === 0) {
        return response.status(400).json({
          success: false,
          message: "Genre must be a non-empty array",
        });
      }

      const artist = await authService.registerArtist(
        email,
        password,
        firstName,
        lastName,
        artistName,
        genre,
        bio,
        socialMedia,
        recordLabel,
        yearsActive,
        avatarFile?.buffer,
        avatarFile?.mimetype
      );

      return response.status(201).json({
        success: true,
        message: "Artist registered successfully. Please verify your email.",
        artist,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === "Email address is already registered") {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("Invalid genres")) {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("Artist name")) {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async verifyArtist(request: Request, response: Response, next: NextFunction) {
    try {
      const { userId } = request.params;
      const { verificationDocuments } = request.body;

      if (!verificationDocuments || !Array.isArray(verificationDocuments)) {
        return response.status(400).json({
          success: false,
          message: "Verification documents array is required",
        });
      }

      const artist = await authService.verifyArtist(
        userId,
        verificationDocuments
      );

      return response.status(200).json({
        success: true,
        message: "Artist verified successfully",
        artist,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return response.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("not an artist")) {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }

  async updateArtistProfile(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {
      const { userId } = request.params;
      const updates = request.body;

      // Validate that the authenticated user is updating their own profile
      if (request.userId !== userId) {
        return response.status(403).json({
          success: false,
          message: "You can only update your own artist profile",
        });
      }

      const artist = await authService.updateArtistProfile(userId, updates);

      return response.status(200).json({
        success: true,
        message: "Artist profile updated successfully",
        artist,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return response.status(404).json({
            success: false,
            message: error.message,
          });
        }
        if (error.message.includes("not an artist")) {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
        if (
          error.message.includes("Artist name") ||
          error.message.includes("genre")
        ) {
          return response.status(400).json({
            success: false,
            message: error.message,
          });
        }
      }
      return next(error);
    }
  }
}

export default new AuthController();
