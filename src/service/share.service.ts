import { Media } from "../models/media.model";
import { User } from "../models/user.model";
import logger from "../utils/logger";

export interface ShareData {
  mediaId: string;
  userId: string;
  platform?: string;
  message?: string;
}

export interface ShareLink {
  url: string;
  title: string;
  description: string;
  image?: string;
  platform: string;
}

export class ShareService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.API_BASE_URL || "http://localhost:4000";
  }

  /**
   * Generate shareable link for media
   */
  async generateShareLink(mediaId: string, platform?: string): Promise<ShareLink> {
    const media = await Media.findById(mediaId).populate("uploadedBy", "firstName lastName artistProfile");
    
    if (!media) {
      throw new Error("Media not found");
    }

    const shareUrl = `${this.baseUrl}/media/${mediaId}`;
    const title = media.title;
    const description = media.description || `Check out this amazing content by ${(media.uploadedBy as any)?.firstName || 'an artist'} on Jevah!`;
    const image = media.thumbnailUrl || media.coverImageUrl;

    return {
      url: shareUrl,
      title,
      description,
      image,
      platform: platform || "web",
    };
  }

  /**
   * Generate social media share URLs
   */
  async generateSocialShareUrls(mediaId: string, message?: string): Promise<{ [platform: string]: string }> {
    const shareData = await this.generateShareLink(mediaId);
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
  }

  /**
   * Share to specific platform
   */
  async shareToPlatform(data: ShareData): Promise<{ success: boolean; shareUrl?: string; message: string }> {
    try {
      const { mediaId, platform, message } = data;

      if (!platform) {
        throw new Error("Platform is required for sharing");
      }

      const socialUrls = await this.generateSocialShareUrls(mediaId, message);
      
      if (!socialUrls[platform.toLowerCase()]) {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      logger.info("Media shared to platform", {
        mediaId,
        platform,
        userId: data.userId,
      });

      return {
        success: true,
        shareUrl: socialUrls[platform.toLowerCase()],
        message: `Successfully shared to ${platform}`,
      };
    } catch (error) {
      logger.error("Error sharing to platform", {
        error: (error as Error).message,
        data,
      });

      return {
        success: false,
        message: (error as Error).message,
      };
    }
  }

  /**
   * Get share statistics for media
   */
  async getShareStats(mediaId: string): Promise<{ totalShares: number; platformBreakdown: { [platform: string]: number } }> {
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
  }

  /**
   * Generate QR code for sharing
   */
  async generateQRCode(mediaId: string): Promise<string> {
    const shareData = await this.generateShareLink(mediaId);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareData.url)}`;
    
    return qrCodeUrl;
  }

  /**
   * Create embed code for media
   */
  async generateEmbedCode(mediaId: string): Promise<string> {
    const shareData = await this.generateShareLink(mediaId);
    
    return `<iframe src="${shareData.url}/embed" width="560" height="315" frameborder="0" allowfullscreen></iframe>`;
  }
}

export default new ShareService();
