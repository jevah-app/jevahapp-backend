import { User } from "../models/user.model";
import { Media, IMedia } from "../models/media.model";
import { Types, ClientSession } from "mongoose";
import { EmailService } from "../config/email.config";

interface FollowArtistRequest {
  followerId: string;
  artistId: string;
}

interface MerchandiseItemRequest {
  artistId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stockCount?: number;
}

interface MerchandisePurchaseRequest {
  customerId: string;
  artistId: string;
  merchandiseItemId: string;
  quantity: number;
  totalAmount: number;
}

interface ArtistProfile {
  artistName: string;
  bio: string;
  followerCount: number;
  followingCount: number;
  hasMerchandise: boolean;
  merchandiseEnabled: boolean;
}

interface UserDocument {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerifiedArtist: boolean;
  following: Types.ObjectId[];
  followers: Types.ObjectId[];
  artistProfile: ArtistProfile;
  merchandiseItems: MerchandiseItem[];
  offlineDownloads: OfflineDownload[];
  emailNotifications: EmailNotificationSettings;
  avatar: string;
}

interface MerchandiseItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  isAvailable: boolean;
  stockCount: number;
}

interface OfflineDownload {
  mediaId: Types.ObjectId;
  downloadDate: Date;
  mediaTitle: string;
  mediaType: string;
}

interface EmailNotificationSettings {
  newFollowers: boolean;
  merchandisePurchases: boolean;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ArtistService {
  async followArtist(
    followRequest: FollowArtistRequest
  ): Promise<{ success: boolean; message: string }> {
    const { followerId, artistId } = followRequest;

    if (!followerId || !artistId) {
      throw new Error("Follower ID and artist ID are required");
    }

    if (followerId === artistId) {
      throw new Error("You cannot follow yourself");
    }

    const [follower, artist] = await Promise.all([
      User.findById(followerId).exec(),
      User.findById(artistId).exec(),
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

    const session: ClientSession = await User.startSession();
    try {
      await session.withTransaction(async () => {
        const isAlreadyFollowing = follower.following?.some(
          (followedArtistId: Types.ObjectId) =>
            followedArtistId.equals(new Types.ObjectId(artistId))
        );

        if (isAlreadyFollowing) {
          throw new Error("You are already following this artist");
        }

        await User.findByIdAndUpdate(
          followerId,
          { $push: { following: new Types.ObjectId(artistId) } },
          { session }
        );

        await User.findByIdAndUpdate(
          artistId,
          {
            $push: { followers: new Types.ObjectId(followerId) },
            $inc: { "artistProfile.followerCount": 1 },
          },
          { session }
        );

        await User.findByIdAndUpdate(
          followerId,
          { $inc: { "artistProfile.followingCount": 1 } },
          { session }
        );

        if (artist.email && artist.emailNotifications?.newFollowers) {
          try {
            const artistName =
              artist.firstName || artist.artistProfile?.artistName || "Artist";
            const followerName = follower.firstName || follower.email;
            await EmailService.sendNewFollowerEmail(
              artist.email,
              artistName,
              followerName
            );
          } catch (emailError) {
            console.error(
              "Failed to send follower notification email:",
              emailError
            );
          }
        }
      });
    } finally {
      session.endSession();
    }

    return { success: true, message: "Successfully followed artist" };
  }

  async unfollowArtist(
    unfollowRequest: FollowArtistRequest
  ): Promise<{ success: boolean; message: string }> {
    const { followerId, artistId } = unfollowRequest;

    if (!followerId || !artistId) {
      throw new Error("Follower ID and artist ID are required");
    }

    if (followerId === artistId) {
      throw new Error("You cannot unfollow yourself");
    }

    const [follower, artist] = await Promise.all([
      User.findById(followerId).exec(),
      User.findById(artistId).exec(),
    ]);

    if (!follower) {
      throw new Error("Follower not found");
    }

    if (!artist) {
      throw new Error("Artist not found");
    }

    const session: ClientSession = await User.startSession();
    try {
      await session.withTransaction(async () => {
        const isFollowing = follower.following?.some(
          (followedArtistId: Types.ObjectId) =>
            followedArtistId.equals(new Types.ObjectId(artistId))
        );

        if (!isFollowing) {
          throw new Error("You are not following this artist");
        }

        await User.findByIdAndUpdate(
          followerId,
          { $pull: { following: new Types.ObjectId(artistId) } },
          { session }
        );

        await User.findByIdAndUpdate(
          artistId,
          {
            $pull: { followers: new Types.ObjectId(followerId) },
            $inc: { "artistProfile.followerCount": -1 },
          },
          { session }
        );

        await User.findByIdAndUpdate(
          followerId,
          { $inc: { "artistProfile.followingCount": -1 } },
          { session }
        );
      });
    } finally {
      session.endSession();
    }

    return { success: true, message: "Successfully unfollowed artist" };
  }

  async getArtistFollowers(
    artistId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Partial<UserDocument>>> {
    if (!artistId) {
      throw new Error("Artist ID is required");
    }

    const artist = await User.findById(artistId).exec();
    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist") {
      throw new Error("User is not an artist");
    }

    const skip = (page - 1) * limit;

    const followers = await User.find({
      _id: { $in: artist.followers || [] },
    })
      .select("firstName lastName email avatar")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const totalFollowers = artist.followers?.length || 0;

    return {
      data: followers,
      pagination: {
        page,
        limit,
        total: totalFollowers,
        pages: Math.ceil(totalFollowers / limit),
      },
    };
  }

  async getUserFollowingArtists(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Partial<UserDocument>>> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error("User not found");
    }

    const skip = (page - 1) * limit;

    const followingArtists = await User.find({
      _id: { $in: user.following || [] },
      role: "artist",
    })
      .select("firstName lastName email avatar artistProfile")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const totalFollowing = user.following?.length || 0;

    return {
      data: followingArtists,
      pagination: {
        page,
        limit,
        total: totalFollowing,
        pages: Math.ceil(totalFollowing / limit),
      },
    };
  }

  async addMerchandiseItem(
    merchandiseRequest: MerchandiseItemRequest
  ): Promise<{ success: boolean; merchandiseItem: MerchandiseItem }> {
    const {
      artistId,
      name,
      description,
      price,
      imageUrl,
      category,
      stockCount,
    } = merchandiseRequest;

    if (
      !artistId ||
      !name ||
      !description ||
      !price ||
      !imageUrl ||
      !category
    ) {
      throw new Error("All required fields must be provided");
    }

    if (price <= 0) {
      throw new Error("Price must be greater than 0");
    }

    const artist = await User.findById(artistId).exec();
    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist" || !artist.isVerifiedArtist) {
      throw new Error("User is not a verified artist");
    }

    const merchandiseItem: MerchandiseItem = {
      id: `merch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      price,
      imageUrl,
      category,
      isAvailable: true,
      stockCount: stockCount || 0,
    };

    await User.findByIdAndUpdate(artistId, {
      $push: { merchandiseItems: merchandiseItem },
      $set: {
        "artistProfile.hasMerchandise": true,
        "artistProfile.merchandiseEnabled": true,
      },
    }).exec();

    return { success: true, merchandiseItem };
  }

  async updateMerchandiseItem(
    artistId: string,
    merchandiseItemId: string,
    updates: Partial<MerchandiseItemRequest>
  ): Promise<{ success: boolean; message: string }> {
    if (!artistId || !merchandiseItemId) {
      throw new Error("Artist ID and merchandise item ID are required");
    }

    const artist = await User.findById(artistId).exec();
    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist") {
      throw new Error("User is not an artist");
    }

    const result = await User.updateOne(
      {
        _id: artistId,
        "merchandiseItems.id": merchandiseItemId,
      },
      {
        $set: {
          "merchandiseItems.$.name": updates.name,
          "merchandiseItems.$.description": updates.description,
          "merchandiseItems.$.price": updates.price,
          "merchandiseItems.$.imageUrl": updates.imageUrl,
          "merchandiseItems.$.category": updates.category,
          "merchandiseItems.$.stockCount": updates.stockCount,
        },
      }
    ).exec();

    if (result.modifiedCount === 0) {
      throw new Error("Merchandise item not found or no changes made");
    }

    return { success: true, message: "Merchandise item updated successfully" };
  }

  async removeMerchandiseItem(
    artistId: string,
    merchandiseItemId: string
  ): Promise<{ success: boolean; message: string }> {
    if (!artistId || !merchandiseItemId) {
      throw new Error("Artist ID and merchandise item ID are required");
    }

    const artist = await User.findById(artistId).exec();
    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist") {
      throw new Error("User is not an artist");
    }

    const result = await User.updateOne(
      { _id: artistId },
      { $pull: { merchandiseItems: { id: merchandiseItemId } } }
    ).exec();

    if (result.modifiedCount === 0) {
      throw new Error("Merchandise item not found");
    }

    const updatedArtist = await User.findById(artistId).exec();
    if (
      updatedArtist &&
      (!updatedArtist.merchandiseItems ||
        updatedArtist.merchandiseItems.length === 0)
    ) {
      await User.findByIdAndUpdate(artistId, {
        $set: {
          "artistProfile.hasMerchandise": false,
          "artistProfile.merchandiseEnabled": false,
        },
      }).exec();
    }

    return { success: true, message: "Merchandise item removed successfully" };
  }

  async getArtistMerchandise(artistId: string): Promise<{
    hasMerchandise: boolean;
    merchandiseEnabled: boolean;
    merchandiseItems: MerchandiseItem[];
  }> {
    if (!artistId) {
      throw new Error("Artist ID is required");
    }

    const artist = await User.findById(artistId)
      .select(
        "merchandiseItems artistProfile.hasMerchandise artistProfile.merchandiseEnabled"
      )
      .exec();

    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist") {
      throw new Error("User is not an artist");
    }

    return {
      hasMerchandise: artist.artistProfile?.hasMerchandise || false,
      merchandiseEnabled: artist.artistProfile?.merchandiseEnabled || false,
      merchandiseItems: artist.merchandiseItems || [],
    };
  }

  async purchaseMerchandise(
    purchaseRequest: MerchandisePurchaseRequest
  ): Promise<{ success: boolean; message: string }> {
    const { customerId, artistId, merchandiseItemId, quantity, totalAmount } =
      purchaseRequest;

    if (
      !customerId ||
      !artistId ||
      !merchandiseItemId ||
      !quantity ||
      !totalAmount
    ) {
      throw new Error("All purchase details are required");
    }

    if (quantity <= 0) {
      throw new Error("Quantity must be greater than 0");
    }

    if (totalAmount <= 0) {
      throw new Error("Total amount must be greater than 0");
    }

    const [customer, artist] = await Promise.all([
      User.findById(customerId).exec(),
      User.findById(artistId).exec(),
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

    const session: ClientSession = await User.startSession();
    try {
      await session.withTransaction(async () => {
        const merchandiseItem = artist.merchandiseItems?.find(
          (item: MerchandiseItem) => item.id === merchandiseItemId
        );

        if (!merchandiseItem) {
          throw new Error("Merchandise item not found");
        }

        if (!merchandiseItem.isAvailable) {
          throw new Error("Merchandise item is not available");
        }

        if (
          merchandiseItem.stockCount !== undefined &&
          merchandiseItem.stockCount < quantity
        ) {
          throw new Error("Insufficient stock");
        }

        if (merchandiseItem.stockCount !== undefined) {
          await User.updateOne(
            {
              _id: artistId,
              "merchandiseItems.id": merchandiseItemId,
            },
            { $inc: { "merchandiseItems.$.stockCount": -quantity } },
            { session }
          ).exec();
        }

        if (artist.email && artist.emailNotifications?.merchandisePurchases) {
          try {
            const artistName =
              artist.firstName || artist.artistProfile?.artistName || "Artist";
            const customerName = customer.firstName || customer.email;
            await EmailService.sendMerchandisePurchaseEmail(
              artist.email,
              artistName,
              customerName,
              merchandiseItem.name,
              totalAmount
            );
          } catch (emailError) {
            console.error(
              "Failed to send merchandise purchase notification email:",
              emailError
            );
          }
        }
      });
    } finally {
      session.endSession();
    }

    return { success: true, message: "Purchase completed successfully" };
  }

  async getArtistDownloadableSongs(
    artistId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<Partial<IMedia>>> {
    if (!artistId) {
      throw new Error("Artist ID is required");
    }

    const artist = await User.findById(artistId).exec();
    if (!artist) {
      throw new Error("Artist not found");
    }

    if (artist.role !== "artist") {
      throw new Error("User is not an artist");
    }

    const skip = (page - 1) * limit;

    const songs = await Media.find({
      uploadedBy: new Types.ObjectId(artistId),
      contentType: "music",
      isDownloadable: true,
    })
      .select("title description thumbnailUrl duration downloadCount createdAt")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();

    const totalSongs = await Media.countDocuments({
      uploadedBy: new Types.ObjectId(artistId),
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
  }

  async getUserOfflineDownloads(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResult<OfflineDownload>> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    const user = await User.findById(userId).exec();
    if (!user) {
      throw new Error("User not found");
    }

    const skip = (page - 1) * limit;
    const downloads = user.offlineDownloads || [];

    const paginatedDownloads = downloads
      .sort(
        (a: OfflineDownload, b: OfflineDownload) =>
          new Date(b.downloadDate).getTime() -
          new Date(a.downloadDate).getTime()
      )
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
  }
}
