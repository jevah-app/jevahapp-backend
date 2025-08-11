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
exports.ShareService = void 0;
const media_model_1 = require("../models/media.model");
const logger_1 = __importDefault(require("../utils/logger"));
class ShareService {
    constructor() {
        this.baseUrl = process.env.API_BASE_URL || "http://localhost:4000";
    }
    /**
     * Generate shareable link for media
     */
    generateShareLink(mediaId, platform) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const media = yield media_model_1.Media.findById(mediaId).populate("uploadedBy", "firstName lastName artistProfile");
            if (!media) {
                throw new Error("Media not found");
            }
            const shareUrl = `${this.baseUrl}/media/${mediaId}`;
            const title = media.title;
            const description = media.description || `Check out this amazing content by ${((_a = media.uploadedBy) === null || _a === void 0 ? void 0 : _a.firstName) || 'an artist'} on Jevah!`;
            const image = media.thumbnailUrl || media.coverImageUrl;
            return {
                url: shareUrl,
                title,
                description,
                image,
                platform: platform || "web",
            };
        });
    }
    /**
     * Generate social media share URLs
     */
    generateSocialShareUrls(mediaId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const shareData = yield this.generateShareLink(mediaId);
            const encodedUrl = encodeURIComponent(shareData.url);
            const encodedTitle = encodeURIComponent(shareData.title);
            const encodedDescription = encodeURIComponent(shareData.description);
            const customMessage = message ? encodeURIComponent(message) : "";
            return {
                facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
                twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${customMessage ? `%20${customMessage}` : ""}`,
                whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}${customMessage ? `%20${customMessage}` : ""}`,
                telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}${customMessage ? `%20${customMessage}` : ""}`,
                linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
                email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%20${encodedUrl}${customMessage ? `%20${customMessage}` : ""}`,
                copy: shareData.url, // For copy to clipboard
            };
        });
    }
    /**
     * Share to specific platform
     */
    shareToPlatform(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { mediaId, platform, message } = data;
                if (!platform) {
                    throw new Error("Platform is required for sharing");
                }
                const socialUrls = yield this.generateSocialShareUrls(mediaId, message);
                if (!socialUrls[platform.toLowerCase()]) {
                    throw new Error(`Unsupported platform: ${platform}`);
                }
                logger_1.default.info("Media shared to platform", {
                    mediaId,
                    platform,
                    userId: data.userId,
                });
                return {
                    success: true,
                    shareUrl: socialUrls[platform.toLowerCase()],
                    message: `Successfully shared to ${platform}`,
                };
            }
            catch (error) {
                logger_1.default.error("Error sharing to platform", {
                    error: error.message,
                    data,
                });
                return {
                    success: false,
                    message: error.message,
                };
            }
        });
    }
    /**
     * Get share statistics for media
     */
    getShareStats(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            // This would typically query your analytics database
            // For now, returning mock data
            return {
                totalShares: 0,
                platformBreakdown: {
                    facebook: 0,
                    twitter: 0,
                    whatsapp: 0,
                    telegram: 0,
                    linkedin: 0,
                    email: 0,
                    copy: 0,
                },
            };
        });
    }
    /**
     * Generate QR code for sharing
     */
    generateQRCode(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const shareData = yield this.generateShareLink(mediaId);
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareData.url)}`;
            return qrCodeUrl;
        });
    }
    /**
     * Create embed code for media
     */
    generateEmbedCode(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            const shareData = yield this.generateShareLink(mediaId);
            return `<iframe src="${shareData.url}/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
        });
    }
}
exports.ShareService = ShareService;
exports.default = new ShareService();
