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
exports.LibraryService = void 0;
const mongoose_1 = require("mongoose");
const user_model_1 = require("../models/user.model");
const media_model_1 = require("../models/media.model");
const audit_service_1 = require("./audit.service");
class LibraryService {
    // Save media to user's library
    static saveToLibrary(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { userId, mediaId, mediaTitle, mediaType, contentType, thumbnailUrl, artistName, } = data;
            const media = yield media_model_1.Media.findById(mediaId);
            if (!media) {
                throw new Error("Media not found");
            }
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const existingItem = (_a = user.library) === null || _a === void 0 ? void 0 : _a.find((item) => item.mediaId.toString() === mediaId);
            if (existingItem) {
                throw new Error("Media is already in your library");
            }
            yield user_model_1.User.findByIdAndUpdate(userId, {
                $push: {
                    library: {
                        mediaId: new mongoose_1.Types.ObjectId(mediaId),
                        mediaTitle,
                        mediaType,
                        contentType,
                        thumbnailUrl,
                        artistName,
                        savedAt: new Date(),
                        playCount: 0,
                        isFavorite: false,
                    },
                },
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "media_save",
                resourceType: "media",
                resourceId: mediaId,
                metadata: { mediaTitle, mediaType, contentType },
                timestamp: new Date(),
            });
        });
    }
    // Remove media from user's library
    static removeFromLibrary(userId, mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const existingItem = (_a = user.library) === null || _a === void 0 ? void 0 : _a.find((item) => item.mediaId.toString() === mediaId);
            if (!existingItem) {
                throw new Error("Media is not in your library");
            }
            yield user_model_1.User.findByIdAndUpdate(userId, {
                $pull: {
                    library: {
                        mediaId: new mongoose_1.Types.ObjectId(mediaId),
                    },
                },
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "media_remove",
                resourceType: "media",
                resourceId: mediaId,
                metadata: { mediaTitle: existingItem.mediaTitle },
                timestamp: new Date(),
            });
        });
    }
    // Get user's library
    static getUserLibrary(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20, filters = {}) {
            const user = (yield user_model_1.User.findById(userId).select("library"));
            if (!user) {
                throw new Error("User not found");
            }
            let library = user.library || [];
            if (filters.contentType) {
                library = library.filter((item) => item.contentType === filters.contentType);
            }
            if (filters.mediaType) {
                library = library.filter((item) => item.mediaType === filters.mediaType);
            }
            if (filters.isFavorite !== undefined) {
                library = library.filter((item) => item.isFavorite === filters.isFavorite);
            }
            library.sort((a, b) => {
                const aDate = a.lastAccessed || a.savedAt;
                const bDate = b.lastAccessed || b.savedAt;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            const total = library.length;
            const skip = (page - 1) * limit;
            const paginatedLibrary = library.slice(skip, skip + limit);
            return {
                library: paginatedLibrary,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    // Update library item
    static updateLibraryItem(data) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { userId, mediaId, updates } = data;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const existingItem = (_a = user.library) === null || _a === void 0 ? void 0 : _a.find((item) => item.mediaId.toString() === mediaId);
            if (!existingItem) {
                throw new Error("Media is not in your library");
            }
            const updateFields = {};
            if (updates.isFavorite !== undefined) {
                updateFields["library.$.isFavorite"] = updates.isFavorite;
            }
            if (updates.playCount !== undefined) {
                updateFields["library.$.playCount"] = updates.playCount;
            }
            updateFields["library.$.lastAccessed"] = new Date();
            yield user_model_1.User.updateOne({
                _id: userId,
                "library.mediaId": new mongoose_1.Types.ObjectId(mediaId),
            }, {
                $set: updateFields,
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "media_update",
                resourceType: "media",
                resourceId: mediaId,
                metadata: { updates },
                timestamp: new Date(),
            });
        });
    }
    // Toggle favorite status
    static toggleFavorite(userId, mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const existingItem = (_a = user.library) === null || _a === void 0 ? void 0 : _a.find((item) => item.mediaId.toString() === mediaId);
            if (!existingItem) {
                throw new Error("Media is not in your library");
            }
            const newFavoriteStatus = !existingItem.isFavorite;
            yield user_model_1.User.updateOne({
                _id: userId,
                "library.mediaId": new mongoose_1.Types.ObjectId(mediaId),
            }, {
                $set: {
                    "library.$.isFavorite": newFavoriteStatus,
                    "library.$.lastAccessed": new Date(),
                },
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: newFavoriteStatus ? "media_favorite" : "media_unfavorite",
                resourceType: "media",
                resourceId: mediaId,
                metadata: { mediaTitle: existingItem.mediaTitle },
                timestamp: new Date(),
            });
            return { isFavorite: newFavoriteStatus };
        });
    }
    // Increment play count
    static incrementPlayCount(userId, mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const existingItem = (_a = user.library) === null || _a === void 0 ? void 0 : _a.find((item) => item.mediaId.toString() === mediaId);
            if (!existingItem) {
                throw new Error("Media is not in your library");
            }
            yield user_model_1.User.updateOne({
                _id: userId,
                "library.mediaId": new mongoose_1.Types.ObjectId(mediaId),
            }, {
                $inc: { "library.$.playCount": 1 },
                $set: { "library.$.lastAccessed": new Date() },
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "media_play",
                resourceType: "media",
                resourceId: mediaId,
                metadata: {
                    mediaTitle: existingItem.mediaTitle,
                    playCount: existingItem.playCount + 1,
                },
                timestamp: new Date(),
            });
        });
    }
    // Get library statistics
    static getLibraryStats(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = (yield user_model_1.User.findById(userId).select("library"));
            if (!user) {
                throw new Error("User not found");
            }
            const library = user.library || [];
            const stats = {
                totalItems: library.length,
                byContentType: {
                    videos: library.filter((item) => item.contentType === "videos").length,
                    music: library.filter((item) => item.contentType === "music").length,
                    books: library.filter((item) => item.contentType === "books").length,
                },
                byMediaType: {
                    videos: library.filter((item) => item.mediaType === "videos").length,
                    audio: library.filter((item) => item.mediaType === "audio").length,
                    ebooks: library.filter((item) => item.mediaType === "ebooks").length,
                },
                favorites: library.filter((item) => item.isFavorite).length,
                totalPlayCount: library.reduce((sum, item) => sum + (item.playCount || 0), 0),
                mostPlayed: library
                    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
                    .slice(0, 5)
                    .map((item) => ({
                    mediaId: item.mediaId,
                    mediaTitle: item.mediaTitle,
                    playCount: item.playCount,
                })),
                recentlyAdded: library
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                    .slice(0, 5)
                    .map((item) => ({
                    mediaId: item.mediaId,
                    mediaTitle: item.mediaTitle,
                    savedAt: item.savedAt,
                })),
                recentlyAccessed: library
                    .filter((item) => item.lastAccessed)
                    .sort((a, b) => new Date(b.lastAccessed).getTime() -
                    new Date(a.lastAccessed).getTime())
                    .slice(0, 5)
                    .map((item) => ({
                    mediaId: item.mediaId,
                    mediaTitle: item.mediaTitle,
                    lastAccessed: item.lastAccessed,
                })),
            };
            return stats;
        });
    }
    // Search library
    static searchLibrary(userId_1, query_1) {
        return __awaiter(this, arguments, void 0, function* (userId, query, page = 1, limit = 20) {
            const user = (yield user_model_1.User.findById(userId).select("library"));
            if (!user) {
                throw new Error("User not found");
            }
            let library = user.library || [];
            if (query) {
                const searchQuery = query.toLowerCase();
                library = library.filter((item) => item.mediaTitle.toLowerCase().includes(searchQuery) ||
                    (item.artistName &&
                        item.artistName.toLowerCase().includes(searchQuery)));
            }
            library.sort((a, b) => {
                const aTitle = a.mediaTitle.toLowerCase();
                const bTitle = b.mediaTitle.toLowerCase();
                const queryLower = query.toLowerCase();
                const aExactMatch = aTitle === queryLower;
                const bExactMatch = bTitle === queryLower;
                if (aExactMatch && !bExactMatch)
                    return -1;
                if (!aExactMatch && bExactMatch)
                    return 1;
                return aTitle.localeCompare(bTitle);
            });
            const total = library.length;
            const skip = (page - 1) * limit;
            const paginatedLibrary = library.slice(skip, skip + limit);
            return {
                library: paginatedLibrary,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    // Get library by category
    static getLibraryByCategory(userId_1, category_1) {
        return __awaiter(this, arguments, void 0, function* (userId, category, page = 1, limit = 20) {
            const user = (yield user_model_1.User.findById(userId).select("library"));
            if (!user) {
                throw new Error("User not found");
            }
            let library = user.library || [];
            if (category) {
                library = library.filter((item) => item.contentType === category);
            }
            library.sort((a, b) => {
                const aDate = a.lastAccessed || a.savedAt;
                const bDate = b.lastAccessed || b.savedAt;
                return new Date(bDate).getTime() - new Date(aDate).getTime();
            });
            const total = library.length;
            const skip = (page - 1) * limit;
            const paginatedLibrary = library.slice(skip, skip + limit);
            return {
                library: paginatedLibrary,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    // Clear library
    static clearLibrary(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const user = yield user_model_1.User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }
            const libraryCount = ((_a = user.library) === null || _a === void 0 ? void 0 : _a.length) || 0;
            yield user_model_1.User.findByIdAndUpdate(userId, {
                $set: { library: [] },
            });
            yield audit_service_1.AuditService.logActivity({
                userId,
                action: "library_clear",
                resourceType: "library",
                metadata: { itemsCleared: libraryCount },
                timestamp: new Date(),
            });
        });
    }
}
exports.LibraryService = LibraryService;
