# Media Likes & Artist Signup Testing Guide

## Overview

This guide covers testing the improved media likes system (with toggle functionality) and the new artist signup system.

## Base URLs

```
Media API: http://localhost:3000/api/media
Auth API: http://localhost:3000/api/auth
```

## 1. Improved Media Likes System

### Key Improvements:

- ✅ **Toggle Functionality**: Users can like/unlike media
- ✅ **Self-Like Prevention**: Users cannot like their own content
- ✅ **Action Status**: Check if user has liked/shared specific media
- ✅ **Better Error Handling**: Clear error messages for different scenarios

### 1.1 Toggle Like/Unlike Media

#### Endpoint

```
POST /api/media/:id/favorite
```

#### Headers

```
Authorization: Bearer <your-jwt-token>
Content-Type: application/json
```

#### Test Cases

##### ✅ Success Case 1: Like Media (First Time)

```bash
POST http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1/favorite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actionType": "favorite"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Added favorite to media 64f1a2b3c4d5e6f7g8h9i0j1",
  "action": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "user": "64f1a2b3c4d5e6f7g8h9i0j3",
    "media": "64f1a2b3c4d5e6f7g8h9i0j1",
    "actionType": "favorite",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isRemoved": false
  }
}
```

##### ✅ Success Case 2: Unlike Media (Toggle Off)

```bash
POST http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1/favorite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actionType": "favorite"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Removed favorite from media 64f1a2b3c4d5e6f7g8h9i0j1",
  "action": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "user": "64f1a2b3c4d5e6f7g8h9i0j3",
    "media": "64f1a2b3c4d5e6f7g8h9i0j1",
    "actionType": "favorite",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isRemoved": true
  }
}
```

##### ❌ Error Case 1: Like Own Content

```bash
POST http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1/favorite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actionType": "favorite"
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "You cannot like your own content"
}
```

##### ❌ Error Case 2: Invalid Media ID

```bash
POST http://localhost:3000/api/media/invalid-id/favorite
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actionType": "favorite"
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid media identifier"
}
```

### 1.2 Get User Action Status

#### Endpoint

```
GET /api/media/:id/action-status
```

#### Headers

```
Authorization: Bearer <your-jwt-token>
```

#### Test Cases

##### ✅ Success Case: Check Action Status

```bash
GET http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1/action-status
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response:**

```json
{
  "success": true,
  "message": "User action status retrieved successfully",
  "status": {
    "isFavorited": true,
    "isShared": false
  }
}
```

### 1.3 Share Media (Toggle)

#### Endpoint

```
POST /api/media/:id/share
```

#### Test Cases

##### ✅ Success Case: Toggle Share

```bash
POST http://localhost:3000/api/media/64f1a2b3c4d5e6f7g8h9i0j1/share
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "actionType": "share"
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Added share to media 64f1a2b3c4d5e6f7g8h9i0j1",
  "action": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "user": "64f1a2b3c4d5e6f7g8h9i0j3",
    "media": "64f1a2b3c4d5e6f7g8h9i0j1",
    "actionType": "share",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "isRemoved": false
  }
}
```

## 2. Artist Signup System

### Key Features:

- ✅ **Separate Endpoint**: `/api/auth/artist/register`
- ✅ **Artist Profile**: Specialized fields for gospel artists
- ✅ **Genre Validation**: Predefined gospel music genres
- ✅ **Verification System**: Artist verification process
- ✅ **Profile Management**: Update artist information

### 2.1 Artist Registration

#### Endpoint

```
POST /api/auth/artist/register
```

#### Headers

```
Content-Type: multipart/form-data
```

#### Body (Form Data)

| Key                      | Type   | Required | Description             |
| ------------------------ | ------ | -------- | ----------------------- |
| `email`                  | Text   | ✅       | Artist's email address  |
| `password`               | Text   | ✅       | Password (min 6 chars)  |
| `firstName`              | Text   | ✅       | First name              |
| `lastName`               | Text   | ❌       | Last name               |
| `artistName`             | Text   | ✅       | Stage/artist name       |
| `genre`                  | Array  | ✅       | Array of genres         |
| `bio`                    | Text   | ❌       | Artist biography        |
| `socialMedia[instagram]` | Text   | ❌       | Instagram handle        |
| `socialMedia[twitter]`   | Text   | ❌       | Twitter handle          |
| `socialMedia[facebook]`  | Text   | ❌       | Facebook page           |
| `socialMedia[youtube]`   | Text   | ❌       | YouTube channel         |
| `socialMedia[spotify]`   | Text   | ❌       | Spotify profile         |
| `recordLabel`            | Text   | ❌       | Record label name       |
| `yearsActive`            | Number | ❌       | Years in music industry |
| `avatar`                 | File   | ❌       | Artist profile picture  |

#### Valid Genres

```
"gospel", "worship", "praise", "christian rock", "christian hip hop",
"contemporary christian", "traditional gospel", "southern gospel",
"urban gospel", "christian pop", "christian country", "christian jazz",
"christian blues", "christian reggae", "christian electronic"
```

#### Test Cases

##### ✅ Success Case 1: Basic Artist Registration

```bash
POST http://localhost:3000/api/auth/artist/register
Content-Type: multipart/form-data

Form Data:
email: gospelartist@example.com
password: securepassword123
firstName: John
lastName: Doe
artistName: Gospel John
genre: ["gospel", "worship"]
bio: A passionate gospel artist spreading the word through music
socialMedia[instagram]: @gospeljohn
socialMedia[youtube]: GospelJohnMusic
recordLabel: Heavenly Records
yearsActive: 5
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Artist registered successfully. Please verify your email.",
  "artist": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "email": "gospelartist@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": null,
    "role": "artist",
    "artistProfile": {
      "artistName": "Gospel John",
      "genre": ["gospel", "worship"],
      "bio": "A passionate gospel artist spreading the word through music",
      "socialMedia": {
        "instagram": "@gospeljohn",
        "youtube": "GospelJohnMusic"
      },
      "recordLabel": "Heavenly Records",
      "yearsActive": 5,
      "isVerifiedArtist": false,
      "verificationDocuments": []
    }
  }
}
```

##### ✅ Success Case 2: Artist Registration with Avatar

```bash
POST http://localhost:3000/api/auth/artist/register
Content-Type: multipart/form-data

Form Data:
email: worshipleader@example.com
password: securepassword123
firstName: Sarah
lastName: Johnson
artistName: Sarah J Worship
genre: ["worship", "contemporary christian"]
bio: Leading worship and creating contemporary Christian music
avatar: [select image file]
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Artist registered successfully. Please verify your email.",
  "artist": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j6",
    "email": "worshipleader@example.com",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "avatar": "https://res.cloudinary.com/...",
    "role": "artist",
    "artistProfile": {
      "artistName": "Sarah J Worship",
      "genre": ["worship", "contemporary christian"],
      "bio": "Leading worship and creating contemporary Christian music",
      "isVerifiedArtist": false,
      "verificationDocuments": []
    }
  }
}
```

##### ❌ Error Case 1: Invalid Genre

```bash
POST http://localhost:3000/api/auth/artist/register
Content-Type: multipart/form-data

Form Data:
email: artist@example.com
password: password123
firstName: John
artistName: Test Artist
genre: ["invalid_genre", "rock"]
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid genres: invalid_genre, rock. Valid genres: gospel, worship, praise, christian rock, christian hip hop, contemporary christian, traditional gospel, southern gospel, urban gospel, christian pop, christian country, christian jazz, christian blues, christian reggae, christian electronic"
}
```

##### ❌ Error Case 2: Missing Required Fields

```bash
POST http://localhost:3000/api/auth/artist/register
Content-Type: multipart/form-data

Form Data:
email: artist@example.com
password: password123
firstName: John
# Missing artistName and genre
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Email, password, first name, artist name, and genre are required fields"
}
```

##### ❌ Error Case 3: Email Already Registered

```bash
POST http://localhost:3000/api/auth/artist/register
Content-Type: multipart/form-data

Form Data:
email: existing@example.com
password: password123
firstName: John
artistName: Test Artist
genre: ["gospel"]
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Email address is already registered"
}
```

### 2.2 Artist Verification (Admin Only)

#### Endpoint

```
POST /api/auth/artist/:userId/verify
```

#### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

#### Test Cases

##### ✅ Success Case: Verify Artist

```bash
POST http://localhost:3000/api/auth/artist/64f1a2b3c4d5e6f7g8h9i0j5/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "verificationDocuments": [
    "https://example.com/id-verification.pdf",
    "https://example.com/music-license.pdf"
  ]
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Artist verified successfully",
  "artist": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "email": "gospelartist@example.com",
    "artistName": "Gospel John",
    "isVerifiedArtist": true
  }
}
```

### 2.3 Update Artist Profile

#### Endpoint

```
PUT /api/auth/artist/:userId/profile
```

#### Headers

```
Authorization: Bearer <artist-jwt-token>
Content-Type: application/json
```

#### Test Cases

##### ✅ Success Case: Update Artist Profile

```bash
PUT http://localhost:3000/api/auth/artist/64f1a2b3c4d5e6f7g8h9i0j5/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "artistName": "Gospel John Updated",
  "genre": ["gospel", "worship", "praise"],
  "bio": "Updated biography with more details about my music journey",
  "socialMedia": {
    "instagram": "@gospeljohn_updated",
    "spotify": "GospelJohnOfficial"
  },
  "recordLabel": "New Heavenly Records",
  "yearsActive": 7
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Artist profile updated successfully",
  "artist": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j5",
    "email": "gospelartist@example.com",
    "artistProfile": {
      "artistName": "Gospel John Updated",
      "genre": ["gospel", "worship", "praise"],
      "bio": "Updated biography with more details about my music journey",
      "socialMedia": {
        "instagram": "@gospeljohn_updated",
        "spotify": "GospelJohnOfficial"
      },
      "recordLabel": "New Heavenly Records",
      "yearsActive": 7,
      "isVerifiedArtist": true,
      "verificationDocuments": [...]
    }
  }
}
```

## 3. Testing Checklist

### ✅ Media Likes System

- [ ] Test like media (first time)
- [ ] Test unlike media (toggle off)
- [ ] Test like media again (toggle on)
- [ ] Test like own content (should fail)
- [ ] Test share media (toggle functionality)
- [ ] Test get action status
- [ ] Verify favorite count updates correctly
- [ ] Verify share count updates correctly

### ✅ Artist Signup System

- [ ] Test basic artist registration
- [ ] Test artist registration with avatar
- [ ] Test invalid genre validation
- [ ] Test missing required fields
- [ ] Test duplicate email registration
- [ ] Test artist verification (admin)
- [ ] Test artist profile update
- [ ] Test unauthorized profile update
- [ ] Verify artist role assignment
- [ ] Verify artist profile structure

### ✅ Integration Tests

- [ ] Test artist can upload media
- [ ] Test artist media appears in search
- [ ] Test artist verification affects media visibility
- [ ] Test artist profile in media responses

## 4. Frontend Integration Notes

### Media Likes:

```javascript
// Toggle like functionality
const toggleLike = async (mediaId) => {
  const response = await fetch(`/api/media/${mediaId}/favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ actionType: "favorite" }),
  });

  const data = await response.json();
  if (data.success) {
    // Update UI based on isRemoved flag
    updateLikeButton(data.action.isRemoved);
  }
};

// Check like status
const getLikeStatus = async (mediaId) => {
  const response = await fetch(`/api/media/${mediaId}/action-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await response.json();
  if (data.success) {
    updateLikeButton(data.status.isFavorited);
  }
};
```

### Artist Signup:

```javascript
// Artist registration form
const registerArtist = async (formData) => {
  const response = await fetch("/api/auth/artist/register", {
    method: "POST",
    body: formData, // FormData with all fields
  });

  const data = await response.json();
  if (data.success) {
    // Redirect to email verification
    router.push("/verify-email");
  }
};
```

## 5. Common Issues and Solutions

### Issue: "You cannot like your own content" error

**Solution**: This is expected behavior. Users cannot like their own media to prevent self-promotion.

### Issue: Invalid genre error

**Solution**: Use only the predefined gospel music genres listed in the documentation.

### Issue: Artist verification not working

**Solution**: Ensure the user making the request has admin privileges and the artist exists.

### Issue: Profile update permission denied

**Solution**: Users can only update their own artist profile. Verify the userId matches the authenticated user.
