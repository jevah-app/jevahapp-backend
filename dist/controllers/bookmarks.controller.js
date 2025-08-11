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
exports.removeBookmark = exports.addBookmark = exports.getBookmarkedMedia = void 0;
const bookmark_model_1 = require("../models/bookmark.model");
/**
 * Get all bookmarked media for the current user
 */
const getBookmarkedMedia = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const bookmarks = yield bookmark_model_1.Bookmark.find({ user: userId }).populate("media");
        const bookmarkedMedia = bookmarks.map((bookmark) => bookmark.media);
        response.status(200).json({
            success: true,
            media: bookmarkedMedia,
        });
    }
    catch (error) {
        console.error("Fetch bookmarks error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to fetch bookmarked media",
        });
    }
});
exports.getBookmarkedMedia = getBookmarkedMedia;
/**
 * Add a media item to the user's bookmarks
 */
const addBookmark = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const mediaId = request.params.id;
        const existing = yield bookmark_model_1.Bookmark.findOne({ user: userId, media: mediaId });
        if (existing) {
            response.status(400).json({
                success: false,
                message: "Media already bookmarked",
            });
            return;
        }
        const bookmark = new bookmark_model_1.Bookmark({ user: userId, media: mediaId });
        yield bookmark.save();
        response.status(201).json({
            success: true,
            message: "Media bookmarked successfully",
        });
    }
    catch (error) {
        console.error("Add bookmark error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to bookmark media",
        });
    }
});
exports.addBookmark = addBookmark;
/**
 * Remove a media item from the user's bookmarks
 */
const removeBookmark = (request, response) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = request.userId;
        const mediaId = request.params.id;
        const result = yield bookmark_model_1.Bookmark.findOneAndDelete({
            user: userId,
            media: mediaId,
        });
        if (!result) {
            response.status(404).json({
                success: false,
                message: "Bookmark not found",
            });
            return;
        }
        response.status(200).json({
            success: true,
            message: "Bookmark removed successfully",
        });
    }
    catch (error) {
        console.error("Remove bookmark error:", error);
        response.status(500).json({
            success: false,
            message: "Failed to remove bookmark",
        });
    }
});
exports.removeBookmark = removeBookmark;
