# Postman Testing Guide for Media Upload with Thumbnail Validation

## Overview

This guide shows how to test the media upload functionality that requires both a main file (video, audio, or PDF) and a thumbnail image for cover display.

## Base URL

```
http://localhost:3000/api/media
```

## Authentication

All endpoints require authentication. You need to:

1. Login first to get a JWT token
2. Include the token in the Authorization header: `Bearer <your-token>`

## 1. Upload Media with Thumbnail

### Endpoint

```
POST /api/media/upload
```

### Headers

```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

### Body (Form-data)

| Key           | Type   | Required | Description                                                               |
| ------------- | ------ | -------- | ------------------------------------------------------------------------- |
| `title`       | Text   | ✅       | Media title                                                               |
| `contentType` | Text   | ✅       | "music", "videos", or "books"                                             |
| `description` | Text   | ❌       | Media description                                                         |
| `category`    | Text   | ❌       | "worship", "inspiration", "youth", "teachings", "marriage", "counselling" |
| `topics`      | Text   | ❌       | JSON array of topics                                                      |
| `duration`    | Number | ❌       | Duration in seconds                                                       |
| `file`        | File   | ✅       | Main media file                                                           |
| `thumbnail`   | File   | ✅       | Cover image                                                               |

### Supported File Types

#### Main Files:

- **Videos**: MP4, WebM, OGG, AVI, MOV
- **Music**: MP3, WAV, OGG, AAC, FLAC
- **Books**: PDF, EPUB

#### Thumbnails:

- **Images**: JPEG, PNG, WebP, JPG
- **Max Size**: 5MB

### Test Cases

#### ✅ Success Case 1: Upload Video with Thumbnail

```
POST http://localhost:3000/api/media/upload

Headers:
Authorization: Bearer <your-token>

Body (form-data):
title: "Sample Video"
contentType: "videos"
description: "A sample video upload"
category: "teachings"
topics: ["faith", "prayer"]
duration: 180
file: [select a .mp4 file]
thumbnail: [select a .jpg/.png file]
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Media uploaded successfully",
  "media": {
    "_id": "...",
    "title": "Sample Video",
    "contentType": "videos",
    "fileUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "category": "teachings",
    "topics": ["faith", "prayer"],
    "duration": 180,
    "uploadedBy": "...",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### ✅ Success Case 2: Upload Music with Thumbnail

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Worship Song"
contentType: "music"
description: "Beautiful worship music"
category: "worship"
topics: ["worship", "inspiration"]
duration: 240
file: [select a .mp3 file]
thumbnail: [select a .png file]
```

#### ✅ Success Case 3: Upload Book with Thumbnail

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Spiritual Growth Guide"
contentType: "books"
description: "A comprehensive guide to spiritual growth"
category: "teachings"
topics: ["spiritual growth", "maturity"]
file: [select a .pdf file]
thumbnail: [select a .webp file]
```

### ❌ Error Test Cases

#### Error Case 1: Missing Thumbnail

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Test Video"
contentType: "videos"
file: [select a .mp4 file]
// No thumbnail provided
```

**Expected Response:**

```json
{
  "success": false,
  "message": "No thumbnail uploaded. A thumbnail image is required for videos content and will be used as the cover image."
}
```

#### Error Case 2: Invalid Thumbnail Format

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Test Video"
contentType: "videos"
file: [select a .mp4 file]
thumbnail: [select a .txt file or other non-image file]
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid thumbnail format. Allowed formats: image/jpeg, image/png, image/webp, image/jpg"
}
```

#### Error Case 3: Thumbnail Too Large

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Test Video"
contentType: "videos"
file: [select a .mp4 file]
thumbnail: [select an image larger than 5MB]
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Thumbnail file size must be less than 5MB"
}
```

#### Error Case 4: Missing Main File

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Test Video"
contentType: "videos"
thumbnail: [select a .jpg file]
// No main file provided
```

**Expected Response:**

```json
{
  "success": false,
  "message": "No file uploaded. A videos file is required."
}
```

#### Error Case 5: Invalid Content Type

```
POST http://localhost:3000/api/media/upload

Body (form-data):
title: "Test"
contentType: "invalid"
file: [select a file]
thumbnail: [select an image]
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid content type. Must be 'music', 'videos', or 'books'"
}
```

## 2. Retrieve All Media (Test Thumbnail Display)

### Endpoint

```
GET /api/media
```

### Headers

```
Authorization: Bearer <your-jwt-token>
```

### Query Parameters (Optional)

- `contentType`: Filter by content type
- `category`: Filter by category
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

### Example Request

```
GET http://localhost:3000/api/media?contentType=videos&page=1&limit=5
```

### Expected Response

```json
{
  "success": true,
  "media": [
    {
      "_id": "...",
      "title": "Sample Video",
      "contentType": "videos",
      "category": "teachings",
      "thumbnailUrl": "https://res.cloudinary.com/...",
      "uploadedBy": {
        "_id": "...",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://..."
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 10,
    "pages": 2
  }
}
```

## 3. Get Single Media Item

### Endpoint

```
GET /api/media/:id
```

### Example Request

```
GET http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1
```

### Expected Response

```json
{
  "success": true,
  "media": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "Sample Video",
    "contentType": "videos",
    "category": "teachings",
    "fileUrl": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://res.cloudinary.com/...",
    "topics": ["faith", "prayer"],
    "uploadedBy": "...",
    "duration": 180,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "viewCount": 0,
    "listenCount": 0,
    "readCount": 0,
    "downloadCount": 0,
    "favoriteCount": 0,
    "shareCount": 0
  }
}
```

## Testing Checklist

### ✅ Upload Functionality

- [ ] Upload video with thumbnail
- [ ] Upload music with thumbnail
- [ ] Upload book with thumbnail
- [ ] Verify both fileUrl and thumbnailUrl are returned
- [ ] Verify thumbnailUrl is accessible and displays correctly

### ✅ Validation Tests

- [ ] Test missing thumbnail (should fail)
- [ ] Test invalid thumbnail format (should fail)
- [ ] Test thumbnail too large (should fail)
- [ ] Test missing main file (should fail)
- [ ] Test invalid content type (should fail)
- [ ] Test missing title (should fail)

### ✅ Retrieval Tests

- [ ] Test getAllMedia returns thumbnailUrl
- [ ] Test getMediaByIdentifier returns thumbnailUrl
- [ ] Verify thumbnailUrl is a valid Cloudinary URL
- [ ] Test pagination works correctly

### ✅ Frontend Integration

- [ ] Verify thumbnailUrl can be used as image src
- [ ] Test different thumbnail formats (JPG, PNG, WebP)
- [ ] Verify thumbnail displays correctly in UI

## Notes for Frontend Developer

1. **Thumbnail Display**: Use the `thumbnailUrl` field as the `src` attribute for `<img>` tags
2. **Fallback**: Consider adding a fallback image in case thumbnailUrl is null
3. **Responsive Images**: Cloudinary URLs can be modified for different sizes
4. **Loading States**: Show loading indicators while thumbnails are loading
5. **Error Handling**: Handle cases where thumbnailUrl might be invalid

## Common Issues and Solutions

### Issue: "No thumbnail uploaded" error

**Solution**: Make sure you're using `upload.fields()` in your form and the thumbnail field is named "thumbnail"

### Issue: Thumbnail not displaying

**Solution**: Check if the thumbnailUrl is a valid Cloudinary URL and accessible

### Issue: File size too large

**Solution**: Compress images before upload or implement client-side image compression

### Issue: Invalid MIME type

**Solution**: Ensure you're uploading the correct file types as specified in the documentation
