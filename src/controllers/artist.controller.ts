import { Request, Response } from "express";
import { ArtistService } from "../service/artist.service";
import { Types } from "mongoose";

const artistService = new ArtistService();

interface FollowRequestBody {
  artistId: string;
}

interface MerchItemRequestBody {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stockCount?: number;
}

interface MerchPurchaseRequestBody {
  merchandiseItemId: string;
  quantity: number;
  totalAmount: number;
}

// Follow an artist
export const followArtist = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.body as FollowRequestBody;
    const followerId = request.userId;

    if (!followerId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
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

    const result = await artistService.followArtist({
      followerId,
      artistId,
    });

    response.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
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
};

// Unfollow an artist
export const unfollowArtist = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.body as FollowRequestBody;
    const followerId = request.userId;

    if (!followerId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
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

    const result = await artistService.unfollowArtist({
      followerId,
      artistId,
    });

    response.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
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
};

// Get artist's followers
export const getArtistFollowers = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
      response.status(400).json({
        success: false,
        message: "Invalid artist ID",
      });
      return;
    }

    const result = await artistService.getArtistFollowers(
      artistId,
      page,
      limit
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Get user's following list
export const getUserFollowing = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await artistService.getUserFollowingArtists(
      userId,
      page,
      limit
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Add merch item for artist
export const addMerchItem = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const merchData = request.body as MerchItemRequestBody;
    const artistId = request.userId;

    if (!artistId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (
      !merchData.name ||
      !merchData.description ||
      !merchData.price ||
      !merchData.imageUrl ||
      !merchData.category
    ) {
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

    const result = await artistService.addMerchandiseItem({
      artistId,
      ...merchData,
    });

    response.status(201).json({
      success: true,
      message: "Merch item added successfully",
      merchItem: result.merchandiseItem,
    });
  } catch (error: unknown) {
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
};

// Update merch item
export const updateMerchItem = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { merchItemId } = request.params;
    const updates = request.body as Partial<MerchItemRequestBody>;
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

    const result = await artistService.updateMerchandiseItem(
      artistId,
      merchItemId,
      updates
    );

    response.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
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
};

// Remove merch item
export const removeMerchItem = async (
  request: Request,
  response: Response
): Promise<void> => {
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

    const result = await artistService.removeMerchandiseItem(
      artistId,
      merchItemId
    );

    response.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
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
};

// Get artist's merch items
export const getArtistMerch = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.params;

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
      response.status(400).json({
        success: false,
        message: "Invalid artist ID",
      });
      return;
    }

    const result = await artistService.getArtistMerchandise(artistId);

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Purchase merch item
export const purchaseMerch = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.params;
    const { merchandiseItemId, quantity, totalAmount } =
      request.body as MerchPurchaseRequestBody;
    const customerId = request.userId;

    if (!customerId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
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

    const result = await artistService.purchaseMerchandise({
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
  } catch (error: unknown) {
    console.error("Purchase merch error:", error);

    if (error instanceof Error) {
      if (error.message.includes("not found")) {
        response.status(404).json({
          success: false,
          message: error.message,
        });
        return;
      }

      if (
        error.message.includes("not available") ||
        error.message.includes("Insufficient stock")
      ) {
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
};

// Get artist's downloadable songs
export const getArtistDownloadableSongs = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const { artistId } = request.params;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!artistId || !Types.ObjectId.isValid(artistId)) {
      response.status(400).json({
        success: false,
        message: "Invalid artist ID",
      });
      return;
    }

    const result = await artistService.getArtistDownloadableSongs(
      artistId,
      page,
      limit
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};

// Get user's offline downloads
export const getUserOfflineDownloads = async (
  request: Request,
  response: Response
): Promise<void> => {
  try {
    const userId = request.userId;
    const page = parseInt(request.query.page as string) || 1;
    const limit = parseInt(request.query.limit as string) || 20;

    if (!userId) {
      response.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
      });
      return;
    }

    const result = await artistService.getUserOfflineDownloads(
      userId,
      page,
      limit
    );

    response.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
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
};
