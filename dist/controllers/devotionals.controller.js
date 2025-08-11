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
exports.likeDevotional = exports.updateDevotional = exports.getDevotionalById = exports.listDevotionals = exports.createDevotional = void 0;
const devotionals_service_1 = require("../service/devotionals.service");
const mongoose_1 = require("mongoose");
/**
 * Create a new devotional
 */
const createDevotional = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const { title, content, scriptureReference, author, tags } = request.body;
        if (!title || !content) {
            response.status(400).json({
                success: false,
                message: "Title and content are required",
            });
            return;
        }
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        const devotional = yield devotionals_service_1.devotionalService.createDevotional({
            title,
            content,
            scriptureReference,
            author,
            tags,
            submittedBy: userId,
        });
        response.status(201).json({
            success: true,
            message: "Devotional submitted successfully",
            devotional,
        });
    }
    catch (error) {
        console.error("Create devotional error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to create devotional",
        });
    }
});
exports.createDevotional = createDevotional;
/**
 * List all devotionals with filters, pagination, and sorting
 */
const listDevotionals = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const { search, tags, submittedBy, sort, page, limit } = request.query;
        // Validate query parameters
        if (page && isNaN(parseInt(page))) {
            response.status(400).json({
                success: false,
                message: "Invalid page number",
            });
            return;
        }
        if (limit && isNaN(parseInt(limit))) {
            response.status(400).json({
                success: false,
                message: "Invalid limit",
            });
            return;
        }
        // Build filters object
        const filters = {};
        if (search)
            filters.search = search;
        if (tags)
            filters.tags = tags;
        if (submittedBy)
            filters.submittedBy = submittedBy;
        if (sort)
            filters.sort = sort;
        if (page)
            filters.page = page;
        if (limit)
            filters.limit = limit;
        const result = yield devotionals_service_1.devotionalService.listDevotionals(filters, userId);
        // Add hasLiked status for each devotional
        const devotionals = yield Promise.all(result.devotionals.map((devotional) => __awaiter(void 0, void 0, void 0, function* () {
            const hasLiked = userId
                ? yield devotionals_service_1.devotionalService.hasUserLikedDevotional(userId, devotional._id.toString())
                : false;
            return Object.assign(Object.assign({}, devotional), { hasLiked });
        })));
        response.status(200).json({
            success: true,
            message: "Devotionals retrieved successfully",
            devotionals,
            pagination: result.pagination,
        });
    }
    catch (error) {
        console.error("List devotionals error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to retrieve devotionals",
        });
    }
});
exports.listDevotionals = listDevotionals;
/**
 * Get a single devotional by ID
 */
const getDevotionalById = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userId = request.userId;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid devotional ID",
            });
            return;
        }
        const devotional = yield devotionals_service_1.devotionalService.getDevotionalById(id);
        const hasLiked = userId
            ? yield devotionals_service_1.devotionalService.hasUserLikedDevotional(userId, id)
            : false;
        response.status(200).json({
            success: true,
            message: "Devotional retrieved successfully",
            devotional: Object.assign(Object.assign({}, devotional), { hasLiked }),
        });
    }
    catch (error) {
        console.error("Get devotional error:", error);
        response.status(error.message === "Devotional not found" ? 404 : 500).json({
            success: false,
            message: error.message || "Failed to retrieve devotional",
        });
    }
});
exports.getDevotionalById = getDevotionalById;
/**
 * Update a devotional
 */
const updateDevotional = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userId = request.userId;
        const userRole = request.userRole;
        const { title, content, scriptureReference, author, tags } = request.body;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid devotional ID",
            });
            return;
        }
        const updateDevotional = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const { id } = request.params;
                const userId = request.userId;
                const userRole = request.userRole;
                const { title, content, scriptureReference, author, tags } = request.body;
                if (!userId) {
                    response.status(401).json({
                        success: false,
                        message: "Unauthorized: User not authenticated",
                    });
                    return;
                }
                if (!mongoose_1.Types.ObjectId.isValid(id)) {
                    response.status(400).json({
                        success: false,
                        message: "Invalid devotional ID",
                    });
                    return;
                }
                const updatedDevotional = yield devotionals_service_1.devotionalService.updateDevotional(id, userId, userRole || "", // Provide default value
                {
                    title,
                    content,
                    scriptureReference,
                    author,
                    tags,
                });
                response.status(200).json({
                    success: true,
                    message: "Devotional updated successfully",
                    devotional: updatedDevotional,
                });
            }
            catch (error) {
                console.error("Update devotional error:", error);
                response
                    .status(error.message === "Devotional not found" ? 404 : 403)
                    .json({
                    success: false,
                    message: error.message || "Failed to update devotional",
                });
            }
        });
        response.status(200).json({
            success: true,
            message: "Devotional updated successfully",
            devotional: updateDevotional,
        });
    }
    catch (error) {
        console.error("Update devotional error:", error);
        response.status(error.message === "Devotional not found" ? 404 : 403).json({
            success: false,
            message: error.message || "Failed to update devotional",
        });
    }
});
exports.updateDevotional = updateDevotional;
/**
 * Like or unlike a devotional
 */
const likeDevotional = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = request.params;
        const userId = request.userId;
        if (!userId) {
            response.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            response.status(400).json({
                success: false,
                message: "Invalid devotional ID",
            });
            return;
        }
        const { liked, likeCount } = yield devotionals_service_1.devotionalService.likeDevotional({
            userId,
            devotionalId: id,
        });
        response.status(200).json({
            success: true,
            message: liked ? "Devotional liked" : "Devotional unliked",
            data: { liked, likeCount },
        });
    }
    catch (error) {
        console.error("Like devotional error:", error);
        response.status(error.message === "Devotional not found" ? 404 : 500).json({
            success: false,
            message: error.message || "Failed to like devotional",
        });
    }
});
exports.likeDevotional = likeDevotional;
