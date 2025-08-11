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
const cloudinary_1 = require("cloudinary");
const stream_1 = require("stream");
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
class FileUploadService {
    uploadMedia(fileBuffer, folderPath, mimetype) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const isVideoOrAudio = mimetype.startsWith("video") || mimetype.startsWith("audio");
                const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                    folder: folderPath,
                    resource_type: isVideoOrAudio ? "video" : "auto", // ✅ audio treated as video
                }, (error, uploadResult) => {
                    if (error) {
                        return reject(new Error(`${isVideoOrAudio ? "Video/Audio" : "File"} upload failed: ${error.message}`));
                    }
                    if (!uploadResult) {
                        return reject(new Error("Upload failed: No response from Cloudinary"));
                    }
                    resolve(uploadResult);
                });
                const stream = new stream_1.Readable();
                stream.push(fileBuffer);
                stream.push(null);
                stream.pipe(uploadStream);
            });
        });
    }
    deleteMedia(publicId_1) {
        return __awaiter(this, arguments, void 0, function* (publicId, resourceType = "video") {
            try {
                const result = yield cloudinary_1.v2.uploader.destroy(publicId, {
                    resource_type: resourceType,
                });
                if (result.result !== "ok") {
                    throw new Error(`Media deletion failed: ${result.result}`);
                }
            }
            catch (error) {
                console.error("Cloudinary deletion error:", error);
                throw new Error("Failed to delete media from Cloudinary");
            }
        });
    }
}
exports.default = new FileUploadService();
