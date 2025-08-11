import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configure S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // e.g., https://<accountid>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Disable checksum calculation to avoid x-amz-decoded-content-length header issues
  forcePathStyle: true,
});

interface UploadApiResponse {
  secure_url: string;
  objectKey: string;
  version?: number;
}

class FileUploadService {
  async uploadMedia(
    fileBuffer: Buffer,
    folderPath: string,
    mimeType: string
  ): Promise<UploadApiResponse> {
    try {
      const isVideoOrAudio =
        mimeType.startsWith("video") || mimeType.startsWith("audio");
      const isDocument =
        mimeType === "application/pdf" || mimeType === "application/epub+zip";
      const isImage = mimeType.startsWith("image");

      const extensionMap: { [key: string]: string } = {
        "application/pdf": ".pdf",
        "application/epub+zip": ".epub",
        "video/mp4": ".mp4",
        "video/webm": ".webm",
        "video/ogg": ".ogg",
        "video/avi": ".avi",
        "video/mov": ".mov",
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/wav": ".wav",
        "audio/ogg": ".ogg",
        "audio/aac": ".aac",
        "audio/flac": ".flac",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/jpg": ".jpg",
      };
      const extension = extensionMap[mimeType] || "";

      if (!extension) {
        throw new Error(`Unsupported MIME type: ${mimeType}`);
      }

      const objectKey = `${folderPath}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`;

      console.log("Uploading to Cloudflare R2:", {
        folderPath,
        mimeType,
        objectKey,
      });

      const putCommand = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: mimeType,
        ContentLength: fileBuffer.length,
      });

      await s3Client.send(putCommand);

      // Generate presigned URL for accessing the file (valid for 24 hours)
      const signedUrl = await getSignedUrl(
        s3Client,
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: objectKey,
        }),
        { expiresIn: 86400 } // 24 hours
      );

      console.log("Cloudflare R2 upload success:", {
        secure_url: signedUrl,
        objectKey,
      });

      return {
        secure_url: signedUrl,
        objectKey: objectKey,
        version: Math.floor(Date.now() / 1000),
      };
    } catch (error: any) {
      console.error("Cloudflare R2 upload error:", error);
      throw new Error(
        `Failed to upload ${
          mimeType.startsWith("video")
            ? "video"
            : mimeType.startsWith("audio")
              ? "audio"
              : mimeType.startsWith("image")
                ? "image"
                : "document"
        }: ${error.message}`
      );
    }
  }

  async deleteMedia(objectKey: string): Promise<void> {
    try {
      console.log("Deleting from Cloudflare R2:", { objectKey });

      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: objectKey,
      });
      await s3Client.send(deleteCommand);

      console.log("Cloudflare R2 deletion success:", { objectKey });
    } catch (error: any) {
      console.error("Cloudflare R2 deletion error:", error);
      throw new Error(
        `Failed to delete media from Cloudflare R2: ${error.message}`
      );
    }
  }
}

export default new FileUploadService();
