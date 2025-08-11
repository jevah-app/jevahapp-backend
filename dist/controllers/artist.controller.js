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
exports.getUserOfflineDownloads = exports.getArtistDownloadableSongs = exports.purchaseMerch = exports.getArtistMerch = exports.removeMerchItem = exports.updateMerchItem = exports.addMerchItem = exports.getUserFollowing = exports.getArtistFollowers = exports.unfollowArtist = exports.followArtist = void 0;
const artist_service_1 = require("../service/artist.service");
const mongoose_1 = require("mongoose");
const artistService = new artist_service_1.ArtistService();
// Follow an artist
const followArtist = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.body;
        const followerId = request.userId;
        if (!followerId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        if (followerId === artistId) {
            response.status(400).json({
                success: false,
                message: "You cannot follow yourself",
            });
            return;
        }
        const result = yield artistService.followArtist({
            followerId,
            artistId,
        });
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Follow artist error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("already following")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not a verified artist")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to follow artist",
        });
    }
});
exports.followArtist = followArtist;
// Unfollow an artist
const unfollowArtist = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.body;
        const followerId = request.userId;
        if (!followerId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        if (followerId === artistId) {
            response.status(400).json({
                success: false,
                message: "You cannot unfollow yourself",
            });
            return;
        }
        const result = yield artistService.unfollowArtist({
            followerId,
            artistId,
        });
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Unfollow artist error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not following")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to unfollow artist",
        });
    }
});
exports.unfollowArtist = unfollowArtist;
// Get artist's followers
const getArtistFollowers = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        const result = yield artistService.getArtistFollowers(artistId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get artist followers error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not an artist")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get artist followers",
        });
    }
});
exports.getArtistFollowers = getArtistFollowers;
// Get user's following list
const getUserFollowing = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const result = yield artistService.getUserFollowingArtists(userId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get user following error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get following list",
        });
    }
});
exports.getUserFollowing = getUserFollowing;
// Add merch item for artist
const addMerchItem = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const merchData = request.body;
        const artistId = request.userId;
        if (!artistId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!merchData.name ||
            !merchData.description ||
            !merchData.price ||
            !merchData.imageUrl ||
            !merchData.category) {
            response.status(400).json({
                success: false,
                message: "All required fields must be provided",
            });
            return;
        }
        if (merchData.price <= 0) {
            response.status(400).json({
                success: false,
                message: "Price must be greater than 0",
            });
            return;
        }
        const result = yield artistService.addMerchandiseItem(Object.assign({ artistId }, merchData));
        response.status(201).json({
            success: true,
            message: "Merch item added successfully",
            merchItem: result.merchandiseItem,
        });
    }
    catch (error) {
        console.error("Add merch item error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not a verified artist")) {
                response.status(403).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("required")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to add merch item",
        });
    }
});
exports.addMerchItem = addMerchItem;
// Update merch item
const updateMerchItem = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchItemId } = request.params;
        const updates = request.body;
        const artistId = request.userId;
        if (!artistId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!merchItemId) {
            response.status(400).json({
                success: false,
                message: "Merch item ID is required",
            });
            return;
        }
        if (updates.price !== undefined && updates.price <= 0) {
            response.status(400).json({
                success: false,
                message: "Price must be greater than 0",
            });
            return;
        }
        const result = yield artistService.updateMerchandiseItem(artistId, merchItemId, updates);
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Update merch item error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not an artist")) {
                response.status(403).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to update merch item",
        });
    }
});
exports.updateMerchItem = updateMerchItem;
// Remove merch item
const removeMerchItem = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchItemId } = request.params;
        const artistId = request.userId;
        if (!artistId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!merchItemId) {
            response.status(400).json({
                success: false,
                message: "Merch item ID is required",
            });
            return;
        }
        const result = yield artistService.removeMerchandiseItem(artistId, merchItemId);
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Remove merch item error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not an artist")) {
                response.status(403).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to remove merch item",
        });
    }
});
exports.removeMerchItem = removeMerchItem;
// Get artist's merch items
const getArtistMerch = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.params;
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        const result = yield artistService.getArtistMerchandise(artistId);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get artist merch error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not an artist")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get artist merch",
        });
    }
});
exports.getArtistMerch = getArtistMerch;
// Purchase merch item
const purchaseMerch = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.params;
        const { merchandiseItemId, quantity, totalAmount } = request.body;
        const customerId = request.userId;
        if (!customerId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        if (!merchandiseItemId || !quantity || !totalAmount) {
            response.status(400).json({
                success: false,
                message: "All purchase details are required",
            });
            return;
        }
        if (quantity <= 0) {
            response.status(400).json({
                success: false,
                message: "Quantity must be greater than 0",
            });
            return;
        }
        if (totalAmount <= 0) {
            response.status(400).json({
                success: false,
                message: "Total amount must be greater than 0",
            });
            return;
        }
        const result = yield artistService.purchaseMerchandise({
            customerId,
            artistId,
            merchandiseItemId,
            quantity,
            totalAmount,
        });
        response.status(200).json({
            success: true,
            message: result.message,
        });
    }
    catch (error) {
        console.error("Purchase merch error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not available") ||
                error.message.includes("Insufficient stock")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("required")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to process purchase",
        });
    }
});
exports.purchaseMerch = purchaseMerch;
// Get artist's downloadable songs
const getArtistDownloadableSongs = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { artistId } = request.params;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!artistId || !mongoose_1.Types.ObjectId.isValid(artistId)) {
            response.status(400).json({
                success: false,
                message: "Invalid artist ID",
            });
            return;
        }
        const result = yield artistService.getArtistDownloadableSongs(artistId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get artist downloadable songs error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
            if (error.message.includes("not an artist")) {
                response.status(400).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get downloadable songs",
        });
    }
});
exports.getArtistDownloadableSongs = getArtistDownloadableSongs;
// Get user's offline downloads
const getUserOfflineDownloads = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const page = parseInt(request.query.page) || 1;
        const limit = parseInt(request.query.limit) || 20;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const result = yield artistService.getUserOfflineDownloads(userId, page, limit);
        response.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        console.error("Get user offline downloads error:", error);
        if (error instanceof Error) {
            if (error.message.includes("not found")) {
                response.status(404).json({
                    success: false,
                    message: error.message,
                });
                return;
            }
        }
        response.status(500).json({
            success: false,
            message: "Failed to get offline downloads",
        });
    }
});
exports.getUserOfflineDownloads = getUserOfflineDownloads;
