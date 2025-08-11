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
exports.getSellerMerchandise = exports.addReview = exports.deleteMerchandise = exports.updateMerchandise = exports.getTrendingMerchandise = exports.searchMerchandise = exports.getMerchandiseById = exports.createMerchandise = void 0;
const merchandise_service_1 = __importDefault(require("../service/merchandise.service"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Create new merchandise listing
 */
const createMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, price, currency = "USD", stockQuantity, category, tags = [], images, thumbnailUrl, specifications = {}, shippingInfo, } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!title ||
            !description ||
            !price ||
            !stockQuantity ||
            !category ||
            !images ||
            !thumbnailUrl ||
            !shippingInfo) {
            response.status(400).json({
                success: false,
                message: "Missing required fields: title, description, price, stockQuantity, category, images, thumbnailUrl, shippingInfo",
            });
            return;
        }
        const merchandise = yield merchandise_service_1.default.createMerchandise({
            title,
            description,
            price: parseFloat(price),
            currency,
            stockQuantity: parseInt(stockQuantity),
            category,
            tags,
            images: Array.isArray(images) ? images : [images],
            thumbnailUrl,
            seller: userIdentifier,
            specifications,
            shippingInfo,
        });
        response.status(201).json({
            success: true,
            message: "Merchandise created successfully",
            data: merchandise,
        });
    }
    catch (error) {
        logger_1.default.error("Error creating merchandise", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to create merchandise",
        });
    }
});
exports.createMerchandise = createMerchandise;
/**
 * Get merchandise by ID
 */
const getMerchandiseById = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchandiseId } = request.params;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        // Increment view count
        yield merchandise_service_1.default.incrementViewCount(merchandiseId);
        const merchandise = yield merchandise_service_1.default.getMerchandiseById(merchandiseId);
        response.status(200).json({
            success: true,
            data: merchandise,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting merchandise by ID", {
            error: error.message,
            userId: request.userId,
            merchandiseId: request.params.merchandiseId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to get merchandise",
        });
    }
});
exports.getMerchandiseById = getMerchandiseById;
/**
 * Search merchandise
 */
const searchMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category, search, priceRange, seller, isAvailable, rating, tags, page = 1, limit = 20, sortBy = "createdAt", } = request.query;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const filters = {};
        if (category)
            filters.category = category;
        if (search)
            filters.search = search;
        if (seller)
            filters.seller = seller;
        if (isAvailable !== undefined)
            filters.isAvailable = isAvailable === "true";
        if (rating)
            filters.rating = parseFloat(rating);
        if (tags)
            filters.tags = Array.isArray(tags) ? tags : [tags];
        if (priceRange) {
            try {
                const priceRangeObj = JSON.parse(priceRange);
                filters.priceRange = {
                    min: parseFloat(priceRangeObj.min),
                    max: parseFloat(priceRangeObj.max),
                };
            }
            catch (error) {
                // Ignore invalid price range
            }
        }
        const result = yield merchandise_service_1.default.searchMerchandise(filters, parseInt(page), parseInt(limit), sortBy);
        response.status(200).json({
            success: true,
            data: result.merchandise,
            pagination: {
                page: result.page,
                limit: parseInt(limit),
                total: result.total,
                totalPages: result.totalPages,
            },
            filters,
        });
    }
    catch (error) {
        logger_1.default.error("Error searching merchandise", {
            error: error.message,
            userId: request.userId,
            query: request.query,
        });
        response.status(500).json({
            success: false,
            message: "Failed to search merchandise",
        });
    }
});
exports.searchMerchandise = searchMerchandise;
/**
 * Get trending merchandise
 */
const getTrendingMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { limit = 20 } = request.query;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const trendingMerchandise = yield merchandise_service_1.default.getTrendingMerchandise(parseInt(limit));
        response.status(200).json({
            success: true,
            data: trendingMerchandise,
            filters: {
                limit: parseInt(limit),
            },
        });
    }
    catch (error) {
        logger_1.default.error("Error getting trending merchandise", {
            error: error.message,
            userId: request.userId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get trending merchandise",
        });
    }
});
exports.getTrendingMerchandise = getTrendingMerchandise;
/**
 * Update merchandise
 */
const updateMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchandiseId } = request.params;
        const updateData = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const merchandise = yield merchandise_service_1.default.updateMerchandise(merchandiseId, userIdentifier, updateData);
        response.status(200).json({
            success: true,
            message: "Merchandise updated successfully",
            data: merchandise,
        });
    }
    catch (error) {
        logger_1.default.error("Error updating merchandise", {
            error: error.message,
            userId: request.userId,
            merchandiseId: request.params.merchandiseId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to update merchandise",
        });
    }
});
exports.updateMerchandise = updateMerchandise;
/**
 * Delete merchandise
 */
const deleteMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchandiseId } = request.params;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        yield merchandise_service_1.default.deleteMerchandise(merchandiseId, userIdentifier);
        response.status(200).json({
            success: true,
            message: "Merchandise deleted successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error deleting merchandise", {
            error: error.message,
            userId: request.userId,
            merchandiseId: request.params.merchandiseId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to delete merchandise",
        });
    }
});
exports.deleteMerchandise = deleteMerchandise;
/**
 * Add review to merchandise
 */
const addReview = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { merchandiseId } = request.params;
        const { rating, comment } = request.body;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!rating || rating < 1 || rating > 5) {
            response.status(400).json({
                success: false,
                message: "Rating must be between 1 and 5",
            });
            return;
        }
        yield merchandise_service_1.default.addReview(merchandiseId, userIdentifier, parseInt(rating), comment);
        response.status(200).json({
            success: true,
            message: "Review added successfully",
        });
    }
    catch (error) {
        logger_1.default.error("Error adding review", {
            error: error.message,
            userId: request.userId,
            merchandiseId: request.params.merchandiseId,
        });
        response.status(500).json({
            success: false,
            message: error.message || "Failed to add review",
        });
    }
});
exports.addReview = addReview;
/**
 * Get seller's merchandise
 */
const getSellerMerchandise = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { sellerId } = request.params;
        const { page = 1, limit = 20 } = request.query;
        const userIdentifier = request.userId;
        if (!userIdentifier) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const result = yield merchandise_service_1.default.getSellerMerchandise(sellerId, parseInt(page), parseInt(limit));
        response.status(200).json({
            success: true,
            data: result.merchandise,
            pagination: {
                page: result.page,
                limit: parseInt(limit),
                total: result.total,
                totalPages: result.totalPages,
            },
            sellerId,
        });
    }
    catch (error) {
        logger_1.default.error("Error getting seller merchandise", {
            error: error.message,
            userId: request.userId,
            sellerId: request.params.sellerId,
        });
        response.status(500).json({
            success: false,
            message: "Failed to get seller merchandise",
        });
    }
});
exports.getSellerMerchandise = getSellerMerchandise;
