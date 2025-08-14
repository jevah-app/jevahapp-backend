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
exports.userProfileService = exports.UserProfileService = void 0;
const user_model_1 = require("../models/user.model");
class UserProfileService {
    getUserProfile(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const user = yield user_model_1.User.findById(userId).select("avatar firstName lastName fullName email username role artistProfile");
                if (!user) {
                    return null;
                }
                // Determine section based on role or artist profile
                let section = "adult";
                if (user.role === "kids_content_creator" ||
                    (user.artistProfile && user.artistProfile.targetAudience === "kids")) {
                    section = "kids";
                }
                // Determine name to use
                let displayName;
                if (user.fullName) {
                    displayName = user.fullName;
                }
                else if (user.firstName && user.lastName) {
                    displayName = `${user.firstName} ${user.lastName}`;
                }
                else if (user.firstName) {
                    displayName = user.firstName;
                }
                else if (user.username) {
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
            }
            catch (error) {
                console.error("Error fetching user profile:", error);
                throw error;
            }
        });
    }
    getMultipleUserProfiles(userIds) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const users = yield user_model_1.User.find({
                    _id: { $in: userIds },
                }).select("avatar firstName lastName fullName email username role artistProfile");
                return users.map(user => {
                    // Determine section based on role or artist profile
                    let section = "adult";
                    if (user.role === "kids_content_creator" ||
                        (user.artistProfile && user.artistProfile.targetAudience === "kids")) {
                        section = "kids";
                    }
                    // Determine name to use
                    let displayName;
                    if (user.fullName) {
                        displayName = user.fullName;
                    }
                    else if (user.firstName && user.lastName) {
                        displayName = `${user.firstName} ${user.lastName}`;
                    }
                    else if (user.firstName) {
                        displayName = user.firstName;
                    }
                    else if (user.username) {
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
            }
            catch (error) {
                console.error("Error fetching multiple user profiles:", error);
                throw error;
            }
        });
    }
    searchUserProfiles(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 10) {
            try {
                const users = yield user_model_1.User.find({
                    $or: [
                        { firstName: { $regex: query, $options: "i" } },
                        { lastName: { $regex: query, $options: "i" } },
                        { fullName: { $regex: query, $options: "i" } },
                        { username: { $regex: query, $options: "i" } },
                        { email: { $regex: query, $options: "i" } },
                    ],
                })
                    .select("avatar firstName lastName fullName email username role artistProfile")
                    .limit(limit);
                return users.map(user => {
                    // Determine section based on role or artist profile
                    let section = "adult";
                    if (user.role === "kids_content_creator" ||
                        (user.artistProfile && user.artistProfile.targetAudience === "kids")) {
                        section = "kids";
                    }
                    // Determine name to use
                    let displayName;
                    if (user.fullName) {
                        displayName = user.fullName;
                    }
                    else if (user.firstName && user.lastName) {
                        displayName = `${user.firstName} ${user.lastName}`;
                    }
                    else if (user.firstName) {
                        displayName = user.firstName;
                    }
                    else if (user.username) {
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
            }
            catch (error) {
                console.error("Error searching user profiles:", error);
                throw error;
            }
        });
    }
}
exports.UserProfileService = UserProfileService;
exports.userProfileService = new UserProfileService();
