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
const merchandise_model_1 = require("../models/merchandise.model");
const mongoose_1 = require("mongoose");
const logger_1 = __importDefault(require("../utils/logger"));
class MerchandiseService {
    /**
     * Create new merchandise listing
     */
    createMerchandise(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const merchandise = yield merchandise_model_1.Merchandise.create(Object.assign(Object.assign({}, data), { seller: new mongoose_1.Types.ObjectId(data.seller), currency: data.currency || "USD", isAvailable: data.stockQuantity > 0 }));
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("create", "merchandise", duration, {
                    seller: data.seller,
                    title: data.title,
                    category: data.category,
                });
                return merchandise;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error creating merchandise", {
                    error: error.message,
                    seller: data.seller,
                    title: data.title,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Get merchandise by ID
     */
    getMerchandiseById(merchandiseId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const merchandise = yield merchandise_model_1.Merchandise.findById(merchandiseId)
                    .populate("seller", "firstName lastName email avatar")
                    .populate("reviews.userId", "firstName lastName avatar");
                if (!merchandise) {
                    throw new Error("Merchandise not found");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "merchandise", duration, {
                    merchandiseId,
                });
                return merchandise;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting merchandise by ID", {
                    error: error.message,
                    merchandiseId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Search merchandise with filters
     */
    searchMerchandise(filters_1) {
        return __awaiter(this, arguments, void 0, function* (filters, page = 1, limit = 20, sortBy = "createdAt") {
            const startTime = Date.now();
            try {
                const skip = (page - 1) * limit;
                const matchStage = {};
                // Apply filters
                if (filters.category)
                    matchStage.category = filters.category;
                if (filters.seller) {
                    matchStage.seller = new mongoose_1.Types.ObjectId(filters.seller);
                }
                if (filters.isAvailable !== undefined) {
                    matchStage.isAvailable = filters.isAvailable;
                }
                if (filters.rating) {
                    matchStage.rating = { $gte: filters.rating };
                }
                if (filters.tags && filters.tags.length > 0) {
                    matchStage.tags = { $in: filters.tags };
                }
                if (filters.priceRange) {
                    matchStage.price = {
                        $gte: filters.priceRange.min,
                        $lte: filters.priceRange.max,
                    };
                }
                // Text search
                if (filters.search) {
                    matchStage.$text = { $search: filters.search };
                }
                // Sort options
                let sortStage = { [sortBy]: -1 };
                if (sortBy === "price") {
                    sortStage = { price: 1 };
                }
                else if (sortBy === "rating") {
                    sortStage = { rating: -1, totalRatings: -1 };
                }
                else if (sortBy === "popularity") {
                    sortStage = { purchaseCount: -1, viewCount: -1 };
                }
                const pipeline = [
                    { $match: matchStage },
                    { $sort: sortStage },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "seller",
                            foreignField: "_id",
                            as: "seller",
                        },
                    },
                    { $unwind: "$seller" },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            description: 1,
                            price: 1,
                            currency: 1,
                            stockQuantity: 1,
                            isAvailable: 1,
                            category: 1,
                            tags: 1,
                            images: 1,
                            thumbnailUrl: 1,
                            viewCount: 1,
                            purchaseCount: 1,
                            rating: 1,
                            totalRatings: 1,
                            createdAt: 1,
                            "seller.firstName": 1,
                            "seller.lastName": 1,
                            "seller.avatar": 1,
                        },
                    },
                ];
                const [merchandise, total] = yield Promise.all([
                    merchandise_model_1.Merchandise.aggregate(pipeline),
                    merchandise_model_1.Merchandise.countDocuments(matchStage),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "merchandise", duration, {
                    operation: "searchMerchandise",
                    filters: Object.keys(filters),
                    page,
                    limit,
                    total,
                });
                return {
                    merchandise,
                    total,
                    page,
                    totalPages,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error searching merchandise", {
                    error: error.message,
                    duration: `${duration}ms`,
                    filters,
                });
                throw error;
            }
        });
    }
    /**
     * Get trending merchandise
     */
    getTrendingMerchandise() {
        return __awaiter(this, arguments, void 0, function* (limit = 20) {
            const startTime = Date.now();
            try {
                const pipeline = [
                    {
                        $match: {
                            isAvailable: true,
                            stockQuantity: { $gt: 0 },
                        },
                    },
                    {
                        $addFields: {
                            trendingScore: {
                                $add: [
                                    { $multiply: ["$viewCount", 0.3] },
                                    { $multiply: ["$purchaseCount", 0.4] },
                                    { $multiply: ["$rating", 0.2] },
                                    { $multiply: ["$totalRatings", 0.1] },
                                ],
                            },
                        },
                    },
                    {
                        $sort: { trendingScore: -1 },
                    },
                    { $limit: limit },
                    {
                        $lookup: {
                            from: "users",
                            localField: "seller",
                            foreignField: "_id",
                            as: "seller",
                        },
                    },
                    { $unwind: "$seller" },
                    {
                        $project: {
                            _id: 1,
                            title: 1,
                            price: 1,
                            currency: 1,
                            category: 1,
                            thumbnailUrl: 1,
                            rating: 1,
                            totalRatings: 1,
                            trendingScore: 1,
                            "seller.firstName": 1,
                            "seller.lastName": 1,
                            "seller.avatar": 1,
                        },
                    },
                ];
                const trendingMerchandise = yield merchandise_model_1.Merchandise.aggregate(pipeline);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("aggregate", "merchandise", duration, {
                    operation: "getTrendingMerchandise",
                    limit,
                });
                return trendingMerchandise;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting trending merchandise", {
                    error: error.message,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Update merchandise
     */
    updateMerchandise(merchandiseId, sellerId, updateData) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const merchandise = yield merchandise_model_1.Merchandise.findOneAndUpdate({
                    _id: merchandiseId,
                    seller: new mongoose_1.Types.ObjectId(sellerId),
                }, Object.assign(Object.assign({}, updateData), { isAvailable: updateData.stockQuantity
                        ? updateData.stockQuantity > 0
                        : undefined }), { new: true, runValidators: true });
                if (!merchandise) {
                    throw new Error("Merchandise not found or unauthorized");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "merchandise", duration, {
                    merchandiseId,
                    sellerId,
                    updatedFields: Object.keys(updateData),
                });
                return merchandise;
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error updating merchandise", {
                    error: error.message,
                    merchandiseId,
                    sellerId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Delete merchandise
     */
    deleteMerchandise(merchandiseId, sellerId) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const merchandise = yield merchandise_model_1.Merchandise.findOneAndDelete({
                    _id: merchandiseId,
                    seller: new mongoose_1.Types.ObjectId(sellerId),
                });
                if (!merchandise) {
                    throw new Error("Merchandise not found or unauthorized");
                }
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("delete", "merchandise", duration, {
                    merchandiseId,
                    sellerId,
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error deleting merchandise", {
                    error: error.message,
                    merchandiseId,
                    sellerId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Add review to merchandise
     */
    addReview(merchandiseId, userId, rating, comment) {
        return __awaiter(this, void 0, void 0, function* () {
            const startTime = Date.now();
            try {
                const merchandise = yield merchandise_model_1.Merchandise.findById(merchandiseId);
                if (!merchandise) {
                    throw new Error("Merchandise not found");
                }
                // Check if user already reviewed
                const existingReview = merchandise.reviews.find((review) => review.userId.toString() === userId);
                if (existingReview) {
                    throw new Error("User already reviewed this merchandise");
                }
                // Add review
                merchandise.reviews.push({
                    userId: new mongoose_1.Types.ObjectId(userId),
                    rating,
                    comment,
                    createdAt: new Date(),
                });
                // Update average rating
                const totalRating = merchandise.reviews.reduce((sum, review) => sum + review.rating, 0);
                merchandise.rating = totalRating / merchandise.reviews.length;
                merchandise.totalRatings = merchandise.reviews.length;
                yield merchandise.save();
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("update", "merchandise", duration, {
                    merchandiseId,
                    userId,
                    rating,
                });
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error adding review", {
                    error: error.message,
                    merchandiseId,
                    userId,
                    rating,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
    /**
     * Increment view count
     */
    incrementViewCount(merchandiseId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield merchandise_model_1.Merchandise.findByIdAndUpdate(merchandiseId, {
                    $inc: { viewCount: 1 },
                });
            }
            catch (error) {
                logger_1.default.error("Error incrementing view count", {
                    error: error.message,
                    merchandiseId,
                });
            }
        });
    }
    /**
     * Get seller's merchandise
     */
    getSellerMerchandise(sellerId_1) {
        return __awaiter(this, arguments, void 0, function* (sellerId, page = 1, limit = 20) {
            const startTime = Date.now();
            try {
                const skip = (page - 1) * limit;
                const [merchandise, total] = yield Promise.all([
                    merchandise_model_1.Merchandise.find({ seller: new mongoose_1.Types.ObjectId(sellerId) })
                        .sort({ createdAt: -1 })
                        .skip(skip)
                        .limit(limit)
                        .populate("seller", "firstName lastName email avatar"),
                    merchandise_model_1.Merchandise.countDocuments({ seller: new mongoose_1.Types.ObjectId(sellerId) }),
                ]);
                const totalPages = Math.ceil(total / limit);
                const duration = Date.now() - startTime;
                logger_1.default.logDatabase("find", "merchandise", duration, {
                    operation: "getSellerMerchandise",
                    sellerId,
                    page,
                    limit,
                    total,
                });
                return {
                    merchandise,
                    total,
                    page,
                    totalPages,
                };
            }
            catch (error) {
                const duration = Date.now() - startTime;
                logger_1.default.error("Error getting seller merchandise", {
                    error: error.message,
                    sellerId,
                    duration: `${duration}ms`,
                });
                throw error;
            }
        });
    }
}
exports.default = new MerchandiseService();
