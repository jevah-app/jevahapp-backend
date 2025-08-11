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
exports.ArtistService = void 0;
const user_model_1 = require("../models/user.model");
const media_model_1 = require("../models/media.model");
const mongoose_1 = require("mongoose");
const email_config_1 = require("../config/email.config");
class ArtistService {
    followArtist(followRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { followerId, artistId } = followRequest;
            if (!followerId || !artistId) {
                throw new Error("Follower ID and artist ID are required");
            }
            if (followerId === artistId) {
                throw new Error("You cannot follow yourself");
            }
            const [follower, artist] = yield Promise.all([
                user_model_1.User.findById(followerId).exec(),
                user_model_1.User.findById(artistId).exec(),
            ]);
            if (!follower) {
                throw new Error("Follower not found");
            }
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist" || !artist.isVerifiedArtist) {
                throw new Error("Target user is not a verified artist");
            }
            const session = yield user_model_1.User.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    const isAlreadyFollowing = (_a = follower.following) === null || _a === void 0 ? void 0 : _a.some((followedArtistId) => followedArtistId.equals(new mongoose_1.Types.ObjectId(artistId)));
                    if (isAlreadyFollowing) {
                        throw new Error("You are already following this artist");
                    }
                    yield user_model_1.User.findByIdAndUpdate(followerId, { $push: { following: new mongoose_1.Types.ObjectId(artistId) } }, { session });
                    yield user_model_1.User.findByIdAndUpdate(artistId, {
                        $push: { followers: new mongoose_1.Types.ObjectId(followerId) },
                        $inc: { "artistProfile.followerCount": 1 },
                    }, { session });
                    yield user_model_1.User.findByIdAndUpdate(followerId, { $inc: { "artistProfile.followingCount": 1 } }, { session });
                    if (artist.email && ((_b = artist.emailNotifications) === null || _b === void 0 ? void 0 : _b.newFollowers)) {
                        try {
                            const artistName = artist.firstName || ((_c = artist.artistProfile) === null || _c === void 0 ? void 0 : _c.artistName) || "Artist";
                            const followerName = follower.firstName || follower.email;
                            yield email_config_1.EmailService.sendNewFollowerEmail(artist.email, artistName, followerName);
                        }
                        catch (emailError) {
                            console.error("Failed to send follower notification email:", emailError);
                        }
                    }
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, message: "Successfully followed artist" };
        });
    }
    unfollowArtist(unfollowRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { followerId, artistId } = unfollowRequest;
            if (!followerId || !artistId) {
                throw new Error("Follower ID and artist ID are required");
            }
            if (followerId === artistId) {
                throw new Error("You cannot unfollow yourself");
            }
            const [follower, artist] = yield Promise.all([
                user_model_1.User.findById(followerId).exec(),
                user_model_1.User.findById(artistId).exec(),
            ]);
            if (!follower) {
                throw new Error("Follower not found");
            }
            if (!artist) {
                throw new Error("Artist not found");
            }
            const session = yield user_model_1.User.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const isFollowing = (_a = follower.following) === null || _a === void 0 ? void 0 : _a.some((followedArtistId) => followedArtistId.equals(new mongoose_1.Types.ObjectId(artistId)));
                    if (!isFollowing) {
                        throw new Error("You are not following this artist");
                    }
                    yield user_model_1.User.findByIdAndUpdate(followerId, { $pull: { following: new mongoose_1.Types.ObjectId(artistId) } }, { session });
                    yield user_model_1.User.findByIdAndUpdate(artistId, {
                        $pull: { followers: new mongoose_1.Types.ObjectId(followerId) },
                        $inc: { "artistProfile.followerCount": -1 },
                    }, { session });
                    yield user_model_1.User.findByIdAndUpdate(followerId, { $inc: { "artistProfile.followingCount": -1 } }, { session });
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, message: "Successfully unfollowed artist" };
        });
    }
    getArtistFollowers(artistId_1) {
        return __awaiter(this, arguments, void 0, function* (artistId, page = 1, limit = 20) {
            var _a;
            if (!artistId) {
                throw new Error("Artist ID is required");
            }
            const artist = yield user_model_1.User.findById(artistId).exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("User is not an artist");
            }
            const skip = (page - 1) * limit;
            const followers = yield user_model_1.User.find({
                _id: { $in: artist.followers || [] },
            })
                .select("firstName lastName email avatar")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            const totalFollowers = ((_a = artist.followers) === null || _a === void 0 ? void 0 : _a.length) || 0;
            return {
                data: followers,
                pagination: {
                    page,
                    limit,
                    total: totalFollowers,
                    pages: Math.ceil(totalFollowers / limit),
                },
            };
        });
    }
    getUserFollowingArtists(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            var _a;
            if (!userId) {
                throw new Error("User ID is required");
            }
            const user = yield user_model_1.User.findById(userId).exec();
            if (!user) {
                throw new Error("User not found");
            }
            const skip = (page - 1) * limit;
            const followingArtists = yield user_model_1.User.find({
                _id: { $in: user.following || [] },
                role: "artist",
            })
                .select("firstName lastName email avatar artistProfile")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            const totalFollowing = ((_a = user.following) === null || _a === void 0 ? void 0 : _a.length) || 0;
            return {
                data: followingArtists,
                pagination: {
                    page,
                    limit,
                    total: totalFollowing,
                    pages: Math.ceil(totalFollowing / limit),
                },
            };
        });
    }
    addMerchandiseItem(merchandiseRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { artistId, name, description, price, imageUrl, category, stockCount, } = merchandiseRequest;
            if (!artistId ||
                !name ||
                !description ||
                !price ||
                !imageUrl ||
                !category) {
                throw new Error("All required fields must be provided");
            }
            if (price <= 0) {
                throw new Error("Price must be greater than 0");
            }
            const artist = yield user_model_1.User.findById(artistId).exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist" || !artist.isVerifiedArtist) {
                throw new Error("User is not a verified artist");
            }
            const merchandiseItem = {
                id: `merch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name,
                description,
                price,
                imageUrl,
                category,
                isAvailable: true,
                stockCount: stockCount || 0,
            };
            yield user_model_1.User.findByIdAndUpdate(artistId, {
                $push: { merchandiseItems: merchandiseItem },
                $set: {
                    "artistProfile.hasMerchandise": true,
                    "artistProfile.merchandiseEnabled": true,
                },
            }).exec();
            return { success: true, merchandiseItem };
        });
    }
    updateMerchandiseItem(artistId, merchandiseItemId, updates) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!artistId || !merchandiseItemId) {
                throw new Error("Artist ID and merchandise item ID are required");
            }
            const artist = yield user_model_1.User.findById(artistId).exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("User is not an artist");
            }
            const result = yield user_model_1.User.updateOne({
                _id: artistId,
                "merchandiseItems.id": merchandiseItemId,
            }, {
                $set: {
                    "merchandiseItems.$.name": updates.name,
                    "merchandiseItems.$.description": updates.description,
                    "merchandiseItems.$.price": updates.price,
                    "merchandiseItems.$.imageUrl": updates.imageUrl,
                    "merchandiseItems.$.category": updates.category,
                    "merchandiseItems.$.stockCount": updates.stockCount,
                },
            }).exec();
            if (result.modifiedCount === 0) {
                throw new Error("Merchandise item not found or no changes made");
            }
            return { success: true, message: "Merchandise item updated successfully" };
        });
    }
    removeMerchandiseItem(artistId, merchandiseItemId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!artistId || !merchandiseItemId) {
                throw new Error("Artist ID and merchandise item ID are required");
            }
            const artist = yield user_model_1.User.findById(artistId).exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("User is not an artist");
            }
            const result = yield user_model_1.User.updateOne({ _id: artistId }, { $pull: { merchandiseItems: { id: merchandiseItemId } } }).exec();
            if (result.modifiedCount === 0) {
                throw new Error("Merchandise item not found");
            }
            const updatedArtist = yield user_model_1.User.findById(artistId).exec();
            if (updatedArtist &&
                (!updatedArtist.merchandiseItems ||
                    updatedArtist.merchandiseItems.length === 0)) {
                yield user_model_1.User.findByIdAndUpdate(artistId, {
                    $set: {
                        "artistProfile.hasMerchandise": false,
                        "artistProfile.merchandiseEnabled": false,
                    },
                }).exec();
            }
            return { success: true, message: "Merchandise item removed successfully" };
        });
    }
    getArtistMerchandise(artistId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            if (!artistId) {
                throw new Error("Artist ID is required");
            }
            const artist = yield user_model_1.User.findById(artistId)
                .select("merchandiseItems artistProfile.hasMerchandise artistProfile.merchandiseEnabled")
                .exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("User is not an artist");
            }
            return {
                hasMerchandise: ((_a = artist.artistProfile) === null || _a === void 0 ? void 0 : _a.hasMerchandise) || false,
                merchandiseEnabled: ((_b = artist.artistProfile) === null || _b === void 0 ? void 0 : _b.merchandiseEnabled) || false,
                merchandiseItems: artist.merchandiseItems || [],
            };
        });
    }
    purchaseMerchandise(purchaseRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            const { customerId, artistId, merchandiseItemId, quantity, totalAmount } = purchaseRequest;
            if (!customerId ||
                !artistId ||
                !merchandiseItemId ||
                !quantity ||
                !totalAmount) {
                throw new Error("All purchase details are required");
            }
            if (quantity <= 0) {
                throw new Error("Quantity must be greater than 0");
            }
            if (totalAmount <= 0) {
                throw new Error("Total amount must be greater than 0");
            }
            const [customer, artist] = yield Promise.all([
                user_model_1.User.findById(customerId).exec(),
                user_model_1.User.findById(artistId).exec(),
            ]);
            if (!customer) {
                throw new Error("Customer not found");
            }
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("Seller is not an artist");
            }
            const session = yield user_model_1.User.startSession();
            try {
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    var _a, _b, _c;
                    const merchandiseItem = (_a = artist.merchandiseItems) === null || _a === void 0 ? void 0 : _a.find((item) => item.id === merchandiseItemId);
                    if (!merchandiseItem) {
                        throw new Error("Merchandise item not found");
                    }
                    if (!merchandiseItem.isAvailable) {
                        throw new Error("Merchandise item is not available");
                    }
                    if (merchandiseItem.stockCount !== undefined &&
                        merchandiseItem.stockCount < quantity) {
                        throw new Error("Insufficient stock");
                    }
                    if (merchandiseItem.stockCount !== undefined) {
                        yield user_model_1.User.updateOne({
                            _id: artistId,
                            "merchandiseItems.id": merchandiseItemId,
                        }, { $inc: { "merchandiseItems.$.stockCount": -quantity } }, { session }).exec();
                    }
                    if (artist.email && ((_b = artist.emailNotifications) === null || _b === void 0 ? void 0 : _b.merchandisePurchases)) {
                        try {
                            const artistName = artist.firstName || ((_c = artist.artistProfile) === null || _c === void 0 ? void 0 : _c.artistName) || "Artist";
                            const customerName = customer.firstName || customer.email;
                            yield email_config_1.EmailService.sendMerchandisePurchaseEmail(artist.email, artistName, customerName, merchandiseItem.name, totalAmount);
                        }
                        catch (emailError) {
                            console.error("Failed to send merchandise purchase notification email:", emailError);
                        }
                    }
                }));
            }
            finally {
                session.endSession();
            }
            return { success: true, message: "Purchase completed successfully" };
        });
    }
    getArtistDownloadableSongs(artistId_1) {
        return __awaiter(this, arguments, void 0, function* (artistId, page = 1, limit = 20) {
            if (!artistId) {
                throw new Error("Artist ID is required");
            }
            const artist = yield user_model_1.User.findById(artistId).exec();
            if (!artist) {
                throw new Error("Artist not found");
            }
            if (artist.role !== "artist") {
                throw new Error("User is not an artist");
            }
            const skip = (page - 1) * limit;
            const songs = yield media_model_1.Media.find({
                uploadedBy: new mongoose_1.Types.ObjectId(artistId),
                contentType: "music",
                isDownloadable: true,
            })
                .select("title description thumbnailUrl duration downloadCount createdAt")
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 })
                .exec();
            const totalSongs = yield media_model_1.Media.countDocuments({
                uploadedBy: new mongoose_1.Types.ObjectId(artistId),
                contentType: "music",
                isDownloadable: true,
            }).exec();
            return {
                data: songs,
                pagination: {
                    page,
                    limit,
                    total: totalSongs,
                    pages: Math.ceil(totalSongs / limit),
                },
            };
        });
    }
    getUserOfflineDownloads(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 20) {
            if (!userId) {
                throw new Error("User ID is required");
            }
            const user = yield user_model_1.User.findById(userId).exec();
            if (!user) {
                throw new Error("User not found");
            }
            const skip = (page - 1) * limit;
            const downloads = user.offlineDownloads || [];
            const paginatedDownloads = downloads
                .sort((a, b) => new Date(b.downloadDate).getTime() -
                new Date(a.downloadDate).getTime())
                .slice(skip, skip + limit);
            return {
                data: paginatedDownloads,
                pagination: {
                    page,
                    limit,
                    total: downloads.length,
                    pages: Math.ceil(downloads.length / limit),
                },
            };
        });
    }
}
exports.ArtistService = ArtistService;
