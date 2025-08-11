# Cloudflare R2 Setup Guide

## Overview

This guide helps you set up Cloudflare R2 for media storage in your Jevah app, taking advantage of their free 10GB storage and free egress.

## Prerequisites

1. Cloudflare account
2. R2 bucket created
3. API tokens with R2 permissions

## Environment Variables

Add these environment variables to your `.env` file:

```env
# Cloudflare R2 Configuration
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET=your_bucket_name
R2_ACCOUNT_ID=your_account_id

# Optional: Custom domain for public access
R2_CUSTOM_DOMAIN=your-custom-domain.com
```

## Setup Steps

### 1. Create R2 Bucket

1. Go to Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Create a new bucket
4. Note the bucket name

### 2. Create API Token

1. Go to Cloudflare Dashboard > My Profile > API Tokens
2. Create Custom Token
3. Set permissions:
   - Account: R2 Object Storage:Edit
   - Zone: None
4. Set Account Resources: Include: All accounts
5. Save and copy the token

### 3. Get Account ID

1. In Cloudflare Dashboard, look at the URL or sidebar
2. Your account ID is in the format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### 4. Configure CORS (Optional)

If you need direct browser access, add CORS rules to your R2 bucket:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

## Features

### Current Implementation

- ✅ File upload to R2
- ✅ Presigned URL generation for secure access
- ✅ Public URL generation (if custom domain configured)
- ✅ File deletion
- ✅ Cache control headers for better performance
- ✅ Support for images, videos, audio, and documents

### File Types Supported

- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, OGG, AVI, MOV
- **Audio**: MP3, WAV, OGG, AAC, FLAC
- **Documents**: PDF, EPUB

### Usage Examples

#### Upload Media

```typescript
const result = await fileUploadService.uploadMedia(
  fileBuffer,
  "user-avatars",
  "image/jpeg"
);

// Result includes:
// - secure_url: Presigned URL for secure access
// - public_url: Public URL (if custom domain configured)
// - objectKey: Internal object key
```

#### Generate New Presigned URL

```typescript
const presignedUrl = await fileUploadService.generatePresignedUrl(
  "user-avatars/1234567890-abc123.jpg",
  3600 // expires in 1 hour
);
```

#### Get Public URL

```typescript
const publicUrl = fileUploadService.getPublicUrl(
  "user-avatars/1234567890-abc123.jpg"
);
```

#### Delete File

```typescript
await fileUploadService.deleteMedia("user-avatars/1234567890-abc123.jpg");
```

## Benefits of R2

### Free Tier

- 10GB storage
- Free egress (no bandwidth charges)
- 1,000,000 Class A operations per month
- 10,000,000 Class B operations per month

### Performance

- Global edge network
- Low latency access
- Automatic caching
- CDN integration

### Security

- S3-compatible API
- Presigned URLs for secure access
- Custom domain support
- CORS configuration

## Troubleshooting

### Common Issues

1. **"R2_CUSTOM_DOMAIN or R2_ACCOUNT_ID not configured"**

   - Set the required environment variables
   - Ensure R2_ACCOUNT_ID is correct

2. **Upload fails with 403**

   - Check API token permissions
   - Verify bucket name and access keys

3. **Presigned URLs not working**

   - Ensure R2_ENDPOINT is correct
   - Check bucket permissions

4. **Public URLs not accessible**
   - Configure custom domain in R2
   - Set up proper DNS records

### Testing

Use the existing media upload endpoints to test R2 integration:

```bash
# Test upload
curl -X POST http://localhost:3000/api/media/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "title=Test Media" \
  -F "contentType=music" \
  -F "file=@test.mp3" \
  -F "thumbnail=@thumbnail.jpg"
```

## Migration from Other Storage

If migrating from Cloudinary or other storage providers:

1. Update environment variables
2. Test upload functionality
3. Migrate existing files (if needed)
4. Update frontend URLs

## Security Considerations

1. **Access Keys**: Keep API keys secure
2. **Presigned URLs**: Set appropriate expiration times
3. **CORS**: Configure only necessary origins
4. **Bucket Permissions**: Use least privilege principle

## Cost Optimization

1. **Cache Control**: Set appropriate cache headers
2. **File Compression**: Compress files before upload
3. **CDN**: Use Cloudflare CDN for better performance
4. **Monitoring**: Monitor usage to stay within free tier
