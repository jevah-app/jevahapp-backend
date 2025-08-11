import { Types } from "mongoose";
import { User, IUserDocument, ILibraryItem } from "../models/user.model";
import { Media } from "../models/media.model";
import { AuditService } from "./audit.service";

interface SaveToLibraryInput {
  userId: string;
  mediaId: string;
  mediaTitle: string;
  mediaType: string;
  contentType: string;
  thumbnailUrl?: string;
  artistName?: string;
}

interface UpdateLibraryItemInput {
  userId: string;
  mediaId: string;
  updates: {
    isFavorite?: boolean;
    playCount?: number;
  };
}

export class LibraryService {
  // Save media to user's library
  static async saveToLibrary(data: SaveToLibraryInput): Promise<void> {
    const {
      userId,
      mediaId,
      mediaTitle,
      mediaType,
      contentType,
      thumbnailUrl,
      artistName,
    } = data;

    const media = await Media.findById(mediaId);
    if (!media) {
      throw new Error("Media not found");
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingItem = user.library?.find(
      (item: ILibraryItem) => item.mediaId.toString() === mediaId
    );

    if (existingItem) {
      throw new Error("Media is already in your library");
    }

    await User.findByIdAndUpdate(userId, {
      $push: {
        library: {
          mediaId: new Types.ObjectId(mediaId),
          mediaTitle,
          mediaType,
          contentType,
          thumbnailUrl,
          artistName,
          savedAt: new Date(),
          playCount: 0,
          isFavorite: false,
        },
      },
    });

    await AuditService.logActivity({
      userId,
      action: "media_save",
      resourceType: "media",
      resourceId: mediaId,
      metadata: { mediaTitle, mediaType, contentType },
      timestamp: new Date(),
    });
  }

  // Remove media from user's library
  static async removeFromLibrary(
    userId: string,
    mediaId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingItem = user.library?.find(
      (item: ILibraryItem) => item.mediaId.toString() === mediaId
    );

    if (!existingItem) {
      throw new Error("Media is not in your library");
    }

    await User.findByIdAndUpdate(userId, {
      $pull: {
        library: {
          mediaId: new Types.ObjectId(mediaId),
        },
      },
    });

    await AuditService.logActivity({
      userId,
      action: "media_remove",
      resourceType: "media",
      resourceId: mediaId,
      metadata: { mediaTitle: existingItem.mediaTitle },
      timestamp: new Date(),
    });
  }

  // Get user's library
  static async getUserLibrary(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters: {
      contentType?: string;
      mediaType?: string;
      isFavorite?: boolean;
    } = {}
  ): Promise<{
    library: ILibraryItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const user = (await User.findById(userId).select(
      "library"
    )) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    let library: ILibraryItem[] = user.library || [];

    if (filters.contentType) {
      library = library.filter(
        (item) => item.contentType === filters.contentType
      );
    }

    if (filters.mediaType) {
      library = library.filter((item) => item.mediaType === filters.mediaType);
    }

    if (filters.isFavorite !== undefined) {
      library = library.filter(
        (item) => item.isFavorite === filters.isFavorite
      );
    }

    library.sort((a, b) => {
      const aDate = a.lastAccessed || a.savedAt;
      const bDate = b.lastAccessed || b.savedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const total = library.length;
    const skip = (page - 1) * limit;
    const paginatedLibrary = library.slice(skip, skip + limit);

    return {
      library: paginatedLibrary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Update library item
  static async updateLibraryItem(data: UpdateLibraryItemInput): Promise<void> {
    const { userId, mediaId, updates } = data;

    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingItem = user.library?.find(
      (item: ILibraryItem) => item.mediaId.toString() === mediaId
    );

    if (!existingItem) {
      throw new Error("Media is not in your library");
    }

    const updateFields: Record<string, unknown> = {};

    if (updates.isFavorite !== undefined) {
      updateFields["library.$.isFavorite"] = updates.isFavorite;
    }

    if (updates.playCount !== undefined) {
      updateFields["library.$.playCount"] = updates.playCount;
    }

    updateFields["library.$.lastAccessed"] = new Date();

    await User.updateOne(
      {
        _id: userId,
        "library.mediaId": new Types.ObjectId(mediaId),
      },
      {
        $set: updateFields,
      }
    );

    await AuditService.logActivity({
      userId,
      action: "media_update",
      resourceType: "media",
      resourceId: mediaId,
      metadata: { updates },
      timestamp: new Date(),
    });
  }

  // Toggle favorite status
  static async toggleFavorite(
    userId: string,
    mediaId: string
  ): Promise<{ isFavorite: boolean }> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingItem = user.library?.find(
      (item: ILibraryItem) => item.mediaId.toString() === mediaId
    );

    if (!existingItem) {
      throw new Error("Media is not in your library");
    }

    const newFavoriteStatus = !existingItem.isFavorite;

    await User.updateOne(
      {
        _id: userId,
        "library.mediaId": new Types.ObjectId(mediaId),
      },
      {
        $set: {
          "library.$.isFavorite": newFavoriteStatus,
          "library.$.lastAccessed": new Date(),
        },
      }
    );

    await AuditService.logActivity({
      userId,
      action: newFavoriteStatus ? "media_favorite" : "media_unfavorite",
      resourceType: "media",
      resourceId: mediaId,
      metadata: { mediaTitle: existingItem.mediaTitle },
      timestamp: new Date(),
    });

    return { isFavorite: newFavoriteStatus };
  }

  // Increment play count
  static async incrementPlayCount(
    userId: string,
    mediaId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const existingItem = user.library?.find(
      (item: ILibraryItem) => item.mediaId.toString() === mediaId
    );

    if (!existingItem) {
      throw new Error("Media is not in your library");
    }

    await User.updateOne(
      {
        _id: userId,
        "library.mediaId": new Types.ObjectId(mediaId),
      },
      {
        $inc: { "library.$.playCount": 1 },
        $set: { "library.$.lastAccessed": new Date() },
      }
    );

    await AuditService.logActivity({
      userId,
      action: "media_play",
      resourceType: "media",
      resourceId: mediaId,
      metadata: {
        mediaTitle: existingItem.mediaTitle,
        playCount: existingItem.playCount + 1,
      },
      timestamp: new Date(),
    });
  }

  // Get library statistics
  static async getLibraryStats(userId: string): Promise<{
    totalItems: number;
    byContentType: {
      videos: number;
      music: number;
      books: number;
    };
    byMediaType: {
      videos: number;
      audio: number;
      ebooks: number;
    };
    favorites: number;
    totalPlayCount: number;
    mostPlayed: Array<{
      mediaId: Types.ObjectId;
      mediaTitle: string;
      playCount: number;
    }>;
    recentlyAdded: Array<{
      mediaId: Types.ObjectId;
      mediaTitle: string;
      savedAt: Date;
    }>;
    recentlyAccessed: Array<{
      mediaId: Types.ObjectId;
      mediaTitle: string;
      lastAccessed: Date;
    }>;
  }> {
    const user = (await User.findById(userId).select(
      "library"
    )) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    const library: ILibraryItem[] = user.library || [];

    const stats = {
      totalItems: library.length,
      byContentType: {
        videos: library.filter((item) => item.contentType === "videos").length,
        music: library.filter((item) => item.contentType === "music").length,
        books: library.filter((item) => item.contentType === "books").length,
      },
      byMediaType: {
        videos: library.filter((item) => item.mediaType === "videos").length,
        audio: library.filter((item) => item.mediaType === "audio").length,
        ebooks: library.filter((item) => item.mediaType === "ebooks").length,
      },
      favorites: library.filter((item) => item.isFavorite).length,
      totalPlayCount: library.reduce(
        (sum, item) => sum + (item.playCount || 0),
        0
      ),
      mostPlayed: library
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, 5)
        .map((item) => ({
          mediaId: item.mediaId,
          mediaTitle: item.mediaTitle,
          playCount: item.playCount,
        })),
      recentlyAdded: library
        .sort(
          (a, b) =>
            new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
        )
        .slice(0, 5)
        .map((item) => ({
          mediaId: item.mediaId,
          mediaTitle: item.mediaTitle,
          savedAt: item.savedAt,
        })),
      recentlyAccessed: library
        .filter((item) => item.lastAccessed)
        .sort(
          (a, b) =>
            new Date(b.lastAccessed!).getTime() -
            new Date(a.lastAccessed!).getTime()
        )
        .slice(0, 5)
        .map((item) => ({
          mediaId: item.mediaId,
          mediaTitle: item.mediaTitle,
          lastAccessed: item.lastAccessed!,
        })),
    };

    return stats;
  }

  // Search library
  static async searchLibrary(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    library: ILibraryItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const user = (await User.findById(userId).select(
      "library"
    )) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    let library: ILibraryItem[] = user.library || [];

    if (query) {
      const searchQuery = query.toLowerCase();
      library = library.filter(
        (item) =>
          item.mediaTitle.toLowerCase().includes(searchQuery) ||
          (item.artistName &&
            item.artistName.toLowerCase().includes(searchQuery))
      );
    }

    library.sort((a, b) => {
      const aTitle = a.mediaTitle.toLowerCase();
      const bTitle = b.mediaTitle.toLowerCase();
      const queryLower = query.toLowerCase();

      const aExactMatch = aTitle === queryLower;
      const bExactMatch = bTitle === queryLower;

      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;

      return aTitle.localeCompare(bTitle);
    });

    const total = library.length;
    const skip = (page - 1) * limit;
    const paginatedLibrary = library.slice(skip, skip + limit);

    return {
      library: paginatedLibrary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Get library by category
  static async getLibraryByCategory(
    userId: string,
    category: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    library: ILibraryItem[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }> {
    const user = (await User.findById(userId).select(
      "library"
    )) as IUserDocument | null;
    if (!user) {
      throw new Error("User not found");
    }

    let library: ILibraryItem[] = user.library || [];

    if (category) {
      library = library.filter((item) => item.contentType === category);
    }

    library.sort((a, b) => {
      const aDate = a.lastAccessed || a.savedAt;
      const bDate = b.lastAccessed || b.savedAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    const total = library.length;
    const skip = (page - 1) * limit;
    const paginatedLibrary = library.slice(skip, skip + limit);

    return {
      library: paginatedLibrary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Clear library
  static async clearLibrary(userId: string): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const libraryCount = user.library?.length || 0;

    await User.findByIdAndUpdate(userId, {
      $set: { library: [] },
    });

    await AuditService.logActivity({
      userId,
      action: "library_clear",
      resourceType: "library",
      metadata: { itemsCleared: libraryCount },
      timestamp: new Date(),
    });
  }
}
