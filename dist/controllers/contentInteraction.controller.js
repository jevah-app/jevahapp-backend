"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.shareContent = exports.getContentComments = exports.getContentMetadata = exports.addContentComment = exports.toggleContentLike = void 0;
const mongoose_1 = require("mongoose");
const contentInteraction_service_1 = __importDefault(require("../service/contentInteraction.service"));
const logger_1 = __importDefault(require("../utils/logger"));
// Toggle like on any content type
const toggleContentLike = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId, contentType } = req.params;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid content ID",
            });
            return;
        }
        if (!contentType ||
            !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(contentType)) {
            res.status(400).json({
                success: false,
                message: "Invalid content type",
            });
            return;
        }
        const result = yield contentInteraction_service_1.default.toggleLike(userId, contentId, contentType);
        res.status(200).json({
            success: true,
            message: result.liked
                ? "Content liked successfully"
                : "Content unliked successfully",
            data: result,
        });
    }
    catch (error) {
        logger_1.default.error("Toggle content like error", {
            error: error.message,
            userId: req.userId,
            contentId: req.params.contentId,
            contentType: req.params.contentType,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to toggle like",
        });
    }
});
exports.toggleContentLike = toggleContentLike;
// Add comment to content
const addContentComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId, contentType } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid content ID",
            });
            return;
        }
        if (!contentType ||
            !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(contentType)) {
            res.status(400).json({
                success: false,
                message: "Invalid content type",
            });
            return;
        }
        if (!content || content.trim().length === 0) {
            res.status(400).json({
                success: false,
                message: "Comment content is required",
            });
            return;
        }
        const comment = yield contentInteraction_service_1.default.addComment(userId, contentId, contentType, content, parentCommentId);
        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: comment,
        });
    }
    catch (error) {
        logger_1.default.error("Add content comment error", {
            error: error.message,
            userId: req.userId,
            contentId: req.params.contentId,
            contentType: req.params.contentType,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        if (error.message.includes("not supported")) {
            res.status(400).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to add comment",
        });
    }
});
exports.addContentComment = addContentComment;
// Get content metadata for frontend UI
const getContentMetadata = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId, contentType } = req.params;
        const userId = req.userId; // Optional, for user-specific interactions
        if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid content ID",
            });
            return;
        }
        if (!contentType ||
            !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(contentType)) {
            res.status(400).json({
                success: false,
                message: "Invalid content type",
            });
            return;
        }
        const metadata = yield contentInteraction_service_1.default.getContentMetadata(userId || "", contentId, contentType);
        res.status(200).json({
            success: true,
            data: metadata,
        });
    }
    catch (error) {
        logger_1.default.error("Get content metadata error", {
            error: error.message,
            userId: req.userId,
            contentId: req.params.contentId,
            contentType: req.params.contentType,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to get content metadata",
        });
    }
});
exports.getContentMetadata = getContentMetadata;
// Get comments for content
const getContentComments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId, contentType } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid content ID",
            });
            return;
        }
        if (!contentType || !["media", "devotional"].includes(contentType)) {
            res.status(400).json({
                success: false,
                message: "Comments not supported for this content type",
            });
            return;
        }
        // For now, we'll use the existing interaction service for comments
        // TODO: Extend this to support devotionals
        const { getComments } = yield Promise.resolve().then(() => __importStar(require("./interaction.controller")));
        // Mock the request object for the existing service
        const mockReq = {
            params: { mediaId: contentId },
            query: { page, limit },
        };
        const mockRes = {
            status: (code) => ({
                json: (data) => {
                    if (code === 200) {
                        res.status(200).json({
                            success: true,
                            data: data,
                        });
                    }
                    else {
                        res.status(code).json(data);
                    }
                },
            }),
        };
        yield getComments(mockReq, mockRes);
    }
    catch (error) {
        logger_1.default.error("Get content comments error", {
            error: error.message,
            contentId: req.params.contentId,
            contentType: req.params.contentType,
        });
        res.status(500).json({
            success: false,
            message: "Failed to get comments",
        });
    }
});
exports.getContentComments = getContentComments;
// Share content
const shareContent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { contentId, contentType } = req.params;
        const { platform, message } = req.body;
        const userId = req.userId;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: User not authenticated",
            });
            return;
        }
        if (!contentId || !mongoose_1.Types.ObjectId.isValid(contentId)) {
            res.status(400).json({
                success: false,
                message: "Invalid content ID",
            });
            return;
        }
        if (!contentType ||
            !["media", "devotional", "artist", "merch", "ebook", "podcast"].includes(contentType)) {
            res.status(400).json({
                success: false,
                message: "Invalid content type",
            });
            return;
        }
        // For now, we'll use the existing share service
        // TODO: Extend this to support all content types
        const { default: shareService } = yield Promise.resolve().then(() => __importStar(require("../service/share.service")));
        const shareUrls = yield shareService.generateSocialShareUrls(contentId, message);
        res.status(200).json({
            success: true,
            message: "Content shared successfully",
            data: {
                shareUrls,
                platform,
                contentType,
            },
        });
    }
    catch (error) {
        logger_1.default.error("Share content error", {
            error: error.message,
            userId: req.userId,
            contentId: req.params.contentId,
            contentType: req.params.contentType,
        });
        if (error.message.includes("not found")) {
            res.status(404).json({
                success: false,
                message: error.message,
            });
            return;
        }
        res.status(500).json({
            success: false,
            message: "Failed to share content",
        });
    }
});
exports.shareContent = shareContent;
