# Authentication Testing Guide - Clerk & OAuth Integration

## Overview

This guide covers testing the authentication system that integrates Clerk for frontend authentication and generates backend JWT tokens for API access.

## Base URL

```
http://localhost:3000/api/auth
```

## Environment Variables Required

```env
# Backend JWT Secret
JWT_SECRET=your-super-secret-jwt-key

# Clerk Configuration (Optional - for custom domains)
CLERK_JWKS_URI=https://your-domain.clerk.accounts.dev/.well-known/jwks.json
CLERK_ISSUER_URL=https://your-domain.clerk.accounts.dev
CLERK_AUDIENCE=https://your-domain.clerk.accounts.dev
```

## 1. Clerk Login (Frontend Token → Backend JWT)

### Endpoint

```
POST /api/auth/clerk-login
```

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "token": "clerk_jwt_token_from_frontend",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

### Test Cases

#### ✅ Success Case 1: New User Clerk Login

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "firstName": "Jane",
    "lastName": "Smith",
    "avatar": "https://images.clerk.dev/avatar.jpg"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Clerk login successful",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "email": "jane@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "avatar": "https://images.clerk.dev/avatar.jpg",
    "isProfileComplete": false,
    "role": "learner"
  },
  "needsAgeSelection": true,
  "isNewUser": true
}
```

#### ✅ Success Case 2: Existing User Clerk Login

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://images.clerk.dev/avatar2.jpg"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Clerk login successful",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://images.clerk.dev/avatar2.jpg",
    "isProfileComplete": true,
    "role": "learner"
  },
  "needsAgeSelection": false,
  "isNewUser": false
}
```

#### ❌ Error Case 1: Missing Token

```json
{
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Clerk authentication token is required"
}
```

#### ❌ Error Case 2: Invalid Token

```json
{
  "token": "invalid_token",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid or expired Clerk token"
}
```

#### ❌ Error Case 3: Missing User Info

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "User information object is required"
}
```

## 2. OAuth Login (Google, Facebook, etc.)

### Endpoint

```
POST /api/auth/oauth-login
```

### Headers

```
Content-Type: application/json
```

### Body

```json
{
  "provider": "google",
  "token": "oauth_jwt_token_from_provider",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "avatar": "https://example.com/avatar.jpg"
  }
}
```

### Test Cases

#### ✅ Success Case 1: Google OAuth Login

```json
{
  "provider": "google",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "firstName": "Alice",
    "lastName": "Johnson",
    "avatar": "https://lh3.googleusercontent.com/avatar.jpg"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "google login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j3",
    "email": "alice@gmail.com",
    "firstName": "Alice",
    "lastName": "Johnson",
    "avatar": "https://lh3.googleusercontent.com/avatar.jpg",
    "isProfileComplete": false,
    "role": "learner"
  },
  "isNewUser": true
}
```

#### ✅ Success Case 2: Facebook OAuth Login

```json
{
  "provider": "facebook",
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "firstName": "Bob",
    "lastName": "Wilson",
    "avatar": "https://graph.facebook.com/avatar.jpg"
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "facebook login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64f1a2b3c4d5e6f7g8h9i0j4",
    "email": "bob@facebook.com",
    "firstName": "Bob",
    "lastName": "Wilson",
    "avatar": "https://graph.facebook.com/avatar.jpg",
    "isProfileComplete": false,
    "role": "learner"
  },
  "isNewUser": true
}
```

#### ❌ Error Case 1: Missing Provider

```json
{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "OAuth provider is required (e.g., 'google', 'facebook')"
}
```

#### ❌ Error Case 2: Invalid Provider Token

```json
{
  "provider": "google",
  "token": "invalid_oauth_token",
  "userInfo": {
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Expected Response:**

```json
{
  "success": false,
  "message": "Invalid or expired OAuth token"
}
```

## 3. Using Backend JWT Token

### After successful OAuth login, use the returned JWT token for API calls:

#### Example: Get User Session

```
GET /api/auth/session
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Expected Response:**

```json
{
  "success": true,
  "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
  "email": "alice@gmail.com",
  "firstName": "Alice",
  "lastName": "Johnson",
  "isProfileComplete": false,
  "role": "learner"
}
```

#### Example: Complete User Profile

```
POST /api/auth/complete-profile
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "age": 25,
  "location": "New York",
  "hasConsentedToPrivacyPolicy": true,
  "desiredRole": "content_creator",
  "interests": ["faith", "prayer", "worship"]
}
```

## 4. Frontend Integration Guide

### Step 1: Clerk Setup in Frontend

```javascript
// Frontend Clerk configuration
import { ClerkProvider, useAuth } from "@clerk/nextjs";

const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
```

### Step 2: Get Clerk Token and User Info

```javascript
import { useAuth } from "@clerk/nextjs";

function LoginComponent() {
  const { getToken, user } = useAuth();

  const handleClerkLogin = async () => {
    try {
      // Get Clerk JWT token
      const clerkToken = await getToken();

      // Prepare user info
      const userInfo = {
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        avatar: user?.imageUrl || "",
      };

      // Send to backend
      const response = await fetch("/api/auth/clerk-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: clerkToken,
          userInfo,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store backend JWT token
        localStorage.setItem("backendToken", data.token);

        // Handle new user flow
        if (data.isNewUser) {
          // Redirect to profile completion
          router.push("/complete-profile");
        } else if (data.needsAgeSelection) {
          // Redirect to age selection
          router.push("/select-age");
        } else {
          // Redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return <button onClick={handleClerkLogin}>Login with Clerk</button>;
}
```

### Step 3: Use Backend JWT for API Calls

```javascript
// API utility function
const apiCall = async (endpoint, options = {}) => {
  const backendToken = localStorage.getItem("backendToken");

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${backendToken}`,
      ...options.headers,
    },
  });

  return response.json();
};

// Example usage
const getUserProfile = () => apiCall("/auth/me");
const uploadMedia = (formData) =>
  apiCall("/media/upload", {
    method: "POST",
    body: formData,
    headers: {
      // Don't set Content-Type for FormData
    },
  });
```

## 5. Testing Checklist

### ✅ Clerk Login Tests

- [ ] Test new user registration via Clerk
- [ ] Test existing user login via Clerk
- [ ] Test missing token error
- [ ] Test invalid token error
- [ ] Test missing user info error
- [ ] Verify `needsAgeSelection` flag
- [ ] Verify `isNewUser` flag

### ✅ OAuth Login Tests

- [ ] Test Google OAuth login
- [ ] Test Facebook OAuth login
- [ ] Test other OAuth providers
- [ ] Test missing provider error
- [ ] Test invalid OAuth token error
- [ ] Verify backend JWT token generation
- [ ] Verify `isNewUser` flag

### ✅ Backend JWT Tests

- [ ] Test API calls with backend JWT
- [ ] Test token expiration
- [ ] Test invalid token rejection
- [ ] Test protected routes access
- [ ] Test user session retrieval

### ✅ Integration Tests

- [ ] Test complete flow: Clerk → Backend JWT → API access
- [ ] Test profile completion flow
- [ ] Test age selection flow
- [ ] Test logout and token blacklisting

## 6. Common Issues and Solutions

### Issue: "Invalid token" error

**Solution**: Ensure you're using the correct Clerk token format and it hasn't expired

### Issue: "Email not found in token" error

**Solution**: Verify the Clerk token contains the email claim and user has verified email

### Issue: Backend JWT not working

**Solution**: Check that the backend JWT token is being stored and sent correctly in Authorization header

### Issue: CORS errors

**Solution**: Ensure your backend CORS configuration allows requests from your frontend domain

### Issue: Different keys for frontend/backend

**Solution**: Use environment variables to configure different Clerk keys for different environments

## 7. Security Considerations

1. **Token Storage**: Store backend JWT in secure storage (httpOnly cookies for web apps)
2. **Token Expiration**: Implement token refresh logic
3. **CORS**: Configure CORS properly for your domains
4. **Rate Limiting**: Ensure rate limiting is enabled on auth endpoints
5. **HTTPS**: Always use HTTPS in production
6. **Environment Variables**: Keep sensitive keys in environment variables
