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
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
// Configure S3 client for Cloudflare R2
const s3Client = new client_s3_1.S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT, // e.g., https://<accountid>.r2.cloudflarestorage.com
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
    // Disable checksum calculation to avoid x-amz-decoded-content-length header issues
    forcePathStyle: true,
});
class FileUploadService {
    uploadMedia(fileBuffer, folderPath, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const isVideoOrAudio = mimeType.startsWith("video") || mimeType.startsWith("audio");
                const isDocument = mimeType === "application/pdf" || mimeType === "application/epub+zip";
                const isImage = mimeType.startsWith("image");
                const extensionMap = {
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
                const putCommand = new client_s3_1.PutObjectCommand({
                    Bucket: process.env.R2_BUCKET,
                    Key: objectKey,
                    Body: fileBuffer,
                    ContentType: mimeType,
                    ContentLength: fileBuffer.length,
                });
                yield s3Client.send(putCommand);
                // Generate presigned URL for accessing the file (valid for 24 hours)
                const signedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, new client_s3_1.GetObjectCommand({
                    Bucket: process.env.R2_BUCKET,
                    Key: objectKey,
                }), { expiresIn: 86400 } // 24 hours
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
            }
            catch (error) {
                console.error("Cloudflare R2 upload error:", error);
                throw new Error(`Failed to upload ${mimeType.startsWith("video")
                    ? "video"
                    : mimeType.startsWith("audio")
                        ? "audio"
                        : mimeType.startsWith("image")
                            ? "image"
                            : "document"}: ${error.message}`);
            }
        });
    }
    deleteMedia(objectKey) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log("Deleting from Cloudflare R2:", { objectKey });
                const deleteCommand = new client_s3_1.DeleteObjectCommand({
                    Bucket: process.env.R2_BUCKET,
                    Key: objectKey,
                });
                yield s3Client.send(deleteCommand);
                console.log("Cloudflare R2 deletion success:", { objectKey });
            }
            catch (error) {
                console.error("Cloudflare R2 deletion error:", error);
                throw new Error(`Failed to delete media from Cloudflare R2: ${error.message}`);
            }
        });
    }
}
exports.default = new FileUploadService();
