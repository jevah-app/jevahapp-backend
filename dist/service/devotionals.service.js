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
exports.devotionalService = exports.DevotionalService = void 0;
const devotional_model_1 = require("../models/devotional.model");
const devotionalLike_model_1 = require("../models/devotionalLike.model");
const mongoose_1 = require("mongoose");
class DevotionalService {
    /**
     * Create a new devotional
     */
    createDevotional(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const devotional = new devotional_model_1.Devotional({
                title: data.title,
                content: data.content,
                scriptureReference: data.scriptureReference,
                author: data.author,
                submittedBy: typeof data.submittedBy === "string"
                    ? new mongoose_1.Types.ObjectId(data.submittedBy)
                    : data.submittedBy,
                tags: data.tags || [],
                likeCount: 0,
            });
            yield devotional.save();
            return devotional;
        });
    }
    /**
     * List devotionals with filters, pagination, and sorting
     */
    listDevotionals() {
        return __awaiter(this, arguments, void 0, function* (filters = {}, userId) {
            const query = {};
            // Search by title or scripture reference
            if (filters.search) {
                query.$or = [
                    { title: { $regex: filters.search, $options: "i" } },
                    { scriptureReference: { $regex: filters.search, $options: "i" } },
                ];
            }
            // Filter by tags
            if (filters.tags) {
                const tagsArray = Array.isArray(filters.tags)
                    ? filters.tags
                    : filters.tags.split(",");
                query.tags = {
                    $in: tagsArray.map((tag) => new RegExp(tag, "i")),
                };
            }
            // Filter by submittedBy (e.g., user's own devotionals)
            if (filters.submittedBy === "me" && userId) {
                query.submittedBy = new mongoose_1.Types.ObjectId(userId);
            }
            else if (filters.submittedBy &&
                mongoose_1.Types.ObjectId.isValid(filters.submittedBy)) {
                query.submittedBy = new mongoose_1.Types.ObjectId(filters.submittedBy);
            }
            // Sorting
            const sort = filters.sort || "-createdAt"; // Default: newest first
            // Pagination
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const skip = (page - 1) * limit;
            const devotionals = yield devotional_model_1.Devotional.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate("submittedBy", "username")
                .lean();
            const total = yield devotional_model_1.Devotional.countDocuments(query);
            return {
                devotionals,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        });
    }
    /**
     * Get a single devotional by ID
     */
    getDevotionalById(devotionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(devotionalId)) {
                throw new Error("Invalid devotional ID");
            }
            const devotional = yield devotional_model_1.Devotional.findById(devotionalId)
                .populate("submittedBy", "username")
                .lean();
            if (!devotional) {
                throw new Error("Devotional not found");
            }
            return devotional;
        });
    }
    /**
     * Update a devotional
     */
    updateDevotional(devotionalId, userId, userRole, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(devotionalId)) {
                throw new Error("Invalid devotional ID");
            }
            const devotional = yield devotional_model_1.Devotional.findById(devotionalId);
            if (!devotional) {
                throw new Error("Devotional not found");
            }
            if (devotional.submittedBy.toString() !== userId && userRole !== "admin") {
                throw new Error("Unauthorized to edit this devotional");
            }
            const updateData = {};
            if (data.title)
                updateData.title = data.title;
            if (data.content)
                updateData.content = data.content;
            if (data.scriptureReference !== undefined)
                updateData.scriptureReference = data.scriptureReference;
            if (data.author !== undefined)
                updateData.author = data.author;
            if (data.tags)
                updateData.tags = data.tags;
            const updatedDevotional = yield devotional_model_1.Devotional.findByIdAndUpdate(devotionalId, { $set: updateData }, { new: true })
                .populate("submittedBy", "username")
                .lean();
            return updatedDevotional;
        });
    }
    /**
     * Toggle like on a devotional
     */
    likeDevotional(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(data.userId) ||
                !mongoose_1.Types.ObjectId.isValid(data.devotionalId)) {
                throw new Error("Invalid user or devotional ID");
            }
            const devotional = yield devotional_model_1.Devotional.findById(data.devotionalId);
            if (!devotional) {
                throw new Error("Devotional not found");
            }
            const session = yield devotional_model_1.Devotional.startSession();
            try {
                let liked = false;
                yield session.withTransaction(() => __awaiter(this, void 0, void 0, function* () {
                    const existingLike = yield devotionalLike_model_1.DevotionalLike.findOne({
                        user: new mongoose_1.Types.ObjectId(data.userId),
                        devotional: new mongoose_1.Types.ObjectId(data.devotionalId),
                    }).session(session);
                    if (existingLike) {
                        // Unlike: Remove like and decrement likeCount
                        yield devotionalLike_model_1.DevotionalLike.findByIdAndDelete(existingLike._id).session(session);
                        yield devotional_model_1.Devotional.findByIdAndUpdate(data.devotionalId, { $inc: { likeCount: -1 } }, { session });
                    }
                    else {
                        // Like: Add like and increment likeCount
                        yield devotionalLike_model_1.DevotionalLike.create([
                            {
                                user: new mongoose_1.Types.ObjectId(data.userId),
                                devotional: new mongoose_1.Types.ObjectId(data.devotionalId),
                            },
                        ], { session });
                        yield devotional_model_1.Devotional.findByIdAndUpdate(data.devotionalId, { $inc: { likeCount: 1 } }, { session });
                        liked = true;
                    }
                }));
                return { liked, likeCount: devotional.likeCount + (liked ? 1 : -1) };
            }
            finally {
                session.endSession();
            }
        });
    }
    /**
     * Check if user has liked a devotional
     */
    hasUserLikedDevotional(userId, devotionalId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!mongoose_1.Types.ObjectId.isValid(userId) ||
                !mongoose_1.Types.ObjectId.isValid(devotionalId)) {
                return false;
            }
            const like = yield devotionalLike_model_1.DevotionalLike.findOne({
                user: new mongoose_1.Types.ObjectId(userId),
                devotional: new mongoose_1.Types.ObjectId(devotionalId),
            });
            return !!like;
        });
    }
}
exports.DevotionalService = DevotionalService;
exports.devotionalService = new DevotionalService();
