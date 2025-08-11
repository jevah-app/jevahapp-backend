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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../models/user.model");
const blacklistedToken_model_1 = require("../models/blacklistedToken.model");
const mailer_1 = require("../utils/mailer");
const clerk_1 = require("../utils/clerk");
const fileUpload_service_1 = __importDefault(require("./fileUpload.service"));
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
class AuthService {
    setVerificationFlags(role) {
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
    oauthLogin(provider, token, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input parameters
                if (!provider || !token || !userInfo) {
                    throw new Error("Provider, token, and user information are required");
                }
                // Verify Clerk token and extract user data
                const tokenData = yield (0, clerk_1.extractUserInfoFromToken)(token);
                const validatedUserInfo = (0, clerk_1.validateUserInfo)(userInfo);
                if (!tokenData.email) {
                    throw new Error(`${provider.charAt(0).toUpperCase() + provider.slice(1)} email not found in Clerk token`);
                }
                // Check if user exists
                let user = yield user_model_1.User.findOne({ email: tokenData.email });
                const isNewUser = !user;
                if (!user) {
                    // Create new user
                    user = yield user_model_1.User.create({
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
                        yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
                    }
                }
                else {
                    // Update existing user's Clerk ID if not set
                    if (!user.clerkId) {
                        user.clerkId = tokenData.clerkId;
                        yield user.save();
                    }
                }
                // Generate JWT token for backend authentication
                const jwtToken = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
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
            }
            catch (error) {
                console.error("OAuth login error:", error);
                throw error;
            }
        });
    }
    clerkLogin(token, userInfo) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Validate input parameters
                if (!token || !userInfo) {
                    throw new Error("Token and user information are required");
                }
                // Verify Clerk token and extract user data
                const tokenData = yield (0, clerk_1.extractUserInfoFromToken)(token);
                const validatedUserInfo = (0, clerk_1.validateUserInfo)(userInfo);
                if (!tokenData.email) {
                    throw new Error("Email not found in Clerk token");
                }
                // Check if user exists
                let user = yield user_model_1.User.findOne({ email: tokenData.email });
                const isNewUser = !user;
                if (!user) {
                    // Create new user
                    user = yield user_model_1.User.create({
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
                        yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
                    }
                }
                else {
                    // Update existing user's Clerk ID if not set
                    if (!user.clerkId) {
                        user.clerkId = tokenData.clerkId;
                        yield user.save();
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
            }
            catch (error) {
                console.error("Clerk login error:", error);
                throw error;
            }
        });
    }
    registerUser(email, password, firstName, lastName, desiredRole, avatarBuffer, avatarMimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield user_model_1.User.findOne({ email });
            if (existingUser) {
                throw new Error("Email address is already registered");
            }
            // Check if user wants to register as artist
            if (desiredRole === "artist") {
                throw new Error("Artist registration requires additional information. Please use the artist registration endpoint.");
            }
            const allowedRoles = [
                "learner",
                "parent",
                "educator",
                "content_creator",
                "vendor",
                "church_admin",
            ];
            const role = desiredRole && allowedRoles.includes(desiredRole)
                ? desiredRole
                : "learner";
            const verificationCode = crypto_1.default
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            const verificationFlags = this.setVerificationFlags(role);
            let avatarUrl;
            if (avatarBuffer && avatarMimeType) {
                const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                if (!validImageMimeTypes.includes(avatarMimeType)) {
                    throw new Error(`Invalid image type: ${avatarMimeType}`);
                }
                const uploadResult = yield fileUpload_service_1.default.uploadMedia(avatarBuffer, "user-avatars", avatarMimeType);
                console.log("Avatar Upload Result:", uploadResult);
                avatarUrl = uploadResult.secure_url;
            }
            const newUser = yield user_model_1.User.create(Object.assign({ email, firstName: firstName || email.split("@")[0], // Use email prefix as fallback
                lastName, avatar: avatarUrl, provider: "email", password: hashedPassword, verificationCode,
                verificationCodeExpires, isEmailVerified: false, isProfileComplete: false, age: 0, isKid: false, section: "adults", role, hasConsentedToPrivacyPolicy: false }, verificationFlags));
            yield (0, mailer_1.sendVerificationEmail)(newUser.email, newUser.firstName, verificationCode);
            return {
                id: newUser._id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                avatar: newUser.avatar,
                role: newUser.role,
            };
        });
    }
    registerArtist(email, password, firstName, lastName, artistName, genre, bio, socialMedia, recordLabel, yearsActive, avatarBuffer, avatarMimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            const existingUser = yield user_model_1.User.findOne({ email });
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
            const invalidGenres = genre.filter((g) => !validGenres.includes(g.toLowerCase()));
            if (invalidGenres.length > 0) {
                throw new Error(`Invalid genres: ${invalidGenres.join(", ")}. Valid genres: ${validGenres.join(", ")}`);
            }
            const hashedPassword = yield bcrypt_1.default.hash(password, 10);
            let avatarUrl;
            if (avatarBuffer && avatarMimeType) {
                const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
                if (!validImageMimeTypes.includes(avatarMimeType)) {
                    throw new Error(`Invalid image type: ${avatarMimeType}`);
                }
                const uploadResult = yield fileUpload_service_1.default.uploadMedia(avatarBuffer, "artist-avatars", avatarMimeType);
                avatarUrl = uploadResult.secure_url;
            }
            const newArtist = yield user_model_1.User.create({
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
                    bio: bio === null || bio === void 0 ? void 0 : bio.trim(),
                    socialMedia,
                    recordLabel: recordLabel === null || recordLabel === void 0 ? void 0 : recordLabel.trim(),
                    yearsActive,
                    verificationDocuments: [],
                },
            });
            // Send welcome email for artists
            yield (0, mailer_1.sendWelcomeEmail)(newArtist.email, newArtist.firstName || "Artist");
            return {
                id: newArtist._id,
                email: newArtist.email,
                firstName: newArtist.firstName,
                lastName: newArtist.lastName,
                avatar: newArtist.avatar,
                role: newArtist.role,
                artistProfile: newArtist.artistProfile,
            };
        });
    }
    verifyArtist(userId, verificationDocuments) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
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
            yield user.save();
            return {
                id: user._id,
                email: user.email,
                artistName: user.artistProfile.artistName,
                isVerifiedArtist: user.isVerifiedArtist,
            };
        });
    }
    updateArtistProfile(userId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const user = yield user_model_1.User.findById(userId);
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
            const updatedProfile = Object.assign(Object.assign(Object.assign({}, user.artistProfile), updates), { artistName: ((_a = updates.artistName) === null || _a === void 0 ? void 0 : _a.trim()) || user.artistProfile.artistName, genre: ((_b = updates.genre) === null || _b === void 0 ? void 0 : _b.map((g) => g.toLowerCase())) || user.artistProfile.genre, bio: ((_c = updates.bio) === null || _c === void 0 ? void 0 : _c.trim()) || user.artistProfile.bio, recordLabel: ((_d = updates.recordLabel) === null || _d === void 0 ? void 0 : _d.trim()) || user.artistProfile.recordLabel });
            user.artistProfile = updatedProfile;
            yield user.save();
            return {
                id: user._id,
                email: user.email,
                artistProfile: user.artistProfile,
            };
        });
    }
    loginUser(email, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, provider: "email" });
            if (!user || !(yield bcrypt_1.default.compare(password, user.password || ""))) {
                throw new Error("Invalid email or password");
            }
            if (!user.isEmailVerified) {
                throw new Error("Please verify your email before logging in");
            }
            const token = jsonwebtoken_1.default.sign({ userId: user._id }, JWT_SECRET, {
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
        });
    }
    verifyEmail(email, code) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, verificationCode: code });
            if (!user) {
                throw new Error("Invalid email or code");
            }
            if (user.verificationCodeExpires &&
                user.verificationCodeExpires < new Date()) {
                throw new Error("Verification code expired");
            }
            user.isEmailVerified = true;
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            yield user.save();
            yield (0, mailer_1.sendWelcomeEmail)(user.email, user.firstName || "User");
            return user;
        });
    }
    resetPassword(email, token, newPassword) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({
                email,
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() },
            });
            if (!user) {
                throw new Error("Invalid or expired reset token");
            }
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, 10);
            user.password = hashedPassword;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            yield user.save();
            return user;
        });
    }
    resendVerificationEmail(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email, provider: "email" });
            if (!user) {
                throw new Error("User not found");
            }
            if (user.isEmailVerified) {
                throw new Error("Email already verified");
            }
            const verificationCode = crypto_1.default
                .randomBytes(3)
                .toString("hex")
                .toUpperCase();
            const verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000);
            user.verificationCode = verificationCode;
            user.verificationCodeExpires = verificationCodeExpires;
            yield user.save();
            yield (0, mailer_1.sendVerificationEmail)(user.email, user.firstName || "User", verificationCode);
            return user;
        });
    }
    completeUserProfile(userId, age, location, hasConsentedToPrivacyPolicy, desiredRole, interests, section) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = yield user_model_1.User.findById(userId);
            if (!currentUser) {
                throw new Error("User not found");
            }
            let userSection = section;
            let isKid;
            if (age < 18) {
                userSection = "kids";
                isKid = true;
            }
            else {
                userSection = "adults";
                isKid = false;
            }
            if (section && section !== userSection) {
                throw new Error(`Provided section '${section}' is invalid for age ${age}. Age ${age} requires section '${userSection}'.`);
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
            const verificationFlags = role !== currentUser.role ? this.setVerificationFlags(role) : {};
            const updateData = Object.assign({ age,
                location, section: userSection, isKid,
                role,
                hasConsentedToPrivacyPolicy, isProfileComplete: true }, verificationFlags);
            if (interests && Array.isArray(interests)) {
                updateData.interests = interests;
            }
            const user = yield user_model_1.User.findByIdAndUpdate(userId, updateData, {
                new: true,
            });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        });
    }
    getCurrentUser(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId).select("firstName lastName avatar avatarUpload section");
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
        });
    }
    getUserSession(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId).select("_id email firstName lastName isProfileComplete role");
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
        });
    }
    updateUserAvatar(userId, avatarBuffer, mimetype) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            if (user.avatar) {
                try {
                    const publicId = (_a = user.avatar.split("/").pop()) === null || _a === void 0 ? void 0 : _a.split(".")[0];
                    if (publicId) {
                        yield fileUpload_service_1.default.deleteMedia(`user-avatars/${publicId}`);
                    }
                }
                catch (error) {
                    console.error("Error deleting old avatar:", error);
                }
            }
            const validImageMimeTypes = ["image/jpeg", "image/png", "image/gif"];
            if (!validImageMimeTypes.includes(mimetype)) {
                throw new Error(`Invalid image type: ${mimetype}`);
            }
            const uploadResult = yield fileUpload_service_1.default.uploadMedia(avatarBuffer, "user-avatars", mimetype);
            console.log("Avatar Upload Result:", uploadResult);
            user.avatar = uploadResult.secure_url;
            yield user.save();
            return {
                avatarUrl: user.avatar,
                userId: user._id,
            };
        });
    }
    initiatePasswordReset(email) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findOne({ email });
            if (!user) {
                throw new Error("User not found");
            }
            const resetToken = crypto_1.default.randomBytes(20).toString("hex");
            const resetTokenExpires = new Date(Date.now() + 3600000);
            user.resetPasswordToken = resetToken;
            user.resetPasswordExpires = resetTokenExpires;
            yield user.save();
            return resetToken;
        });
    }
    logout(userId, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            // Decode the JWT to get its expiration time
            const decodedToken = jsonwebtoken_1.default.decode(token);
            if (!decodedToken || !decodedToken.exp) {
                throw new Error("Invalid token");
            }
            // Calculate expiration date from token's exp claim (exp is in seconds)
            const expiresAt = new Date(decodedToken.exp * 1000);
            // Check if token is already blacklisted
            const existingBlacklistedToken = yield blacklistedToken_model_1.BlacklistedToken.findOne({ token });
            if (existingBlacklistedToken) {
                throw new Error("Token already invalidated");
            }
            // Add token to blacklist
            yield blacklistedToken_model_1.BlacklistedToken.create({
                token,
                expiresAt,
            });
            return { message: "User logged out successfully" };
        });
    }
}
exports.default = new AuthService();
