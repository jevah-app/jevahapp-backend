# Jevah Gospel Media Platform - Interaction Features

## Overview

This document outlines the comprehensive interaction system implemented for the Jevah Gospel Media Platform, including real-time likes, comments, messaging, and sharing functionality.

## 🎯 Features Implemented

### 1. Real-Time Likes & Reactions
- **Toggle Like/Unlike**: Users can like and unlike media content
- **Real-time Updates**: Like counts update instantly across all connected clients
- **Soft Delete**: Likes are soft-deleted for data integrity

### 2. Real-Time Comments System
- **Nested Comments**: Support for parent-child comment relationships
- **Comment Reactions**: Users can react to comments with emojis
- **Real-time Broadcasting**: New comments appear instantly
- **Comment Moderation**: Users can delete their own comments

### 3. Real-Time Messaging
- **Private Messaging**: Direct messages between users
- **Conversation Management**: Automatic conversation creation and management
- **Message Types**: Support for text, image, audio, video, and file messages
- **Read Receipts**: Track message read status
- **Message Reactions**: React to messages with emojis

### 4. Social Media Sharing
- **Multi-Platform Sharing**: Facebook, Twitter, WhatsApp, Telegram, LinkedIn, Email
- **QR Code Generation**: Generate QR codes for easy sharing
- **Embed Codes**: Generate embed codes for websites
- **Share Analytics**: Track sharing statistics
- **Custom Messages**: Add personal messages when sharing

### 5. Follow/Unfollow System
- **Artist Following**: Users can follow artists
- **Follower Counts**: Real-time follower statistics
- **Email Notifications**: Notify artists of new followers

## 🏗️ Architecture

### Models

#### 1. MediaInteraction Model
```typescript
interface IMediaInteraction {
  user: ObjectId;
  media: ObjectId;
  interactionType: "view" | "listen" | "read" | "download" | "like" | "comment" | "share";
  content?: string; // For comments
  parentCommentId?: ObjectId; // For nested comments
  reactions?: { [key: string]: number }; // Dynamic reactions
  isRemoved?: boolean; // Soft deletion
}
```

#### 2. Message Model
```typescript
interface IMessage {
  sender: ObjectId;
  recipient: ObjectId;
  content: string;
  messageType: "text" | "image" | "audio" | "video" | "file";
  mediaUrl?: string;
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  replyTo?: ObjectId;
  reactions?: { [key: string]: ObjectId[] };
}
```

#### 3. Conversation Model
```typescript
interface IConversation {
  participants: ObjectId[];
  lastMessage?: ObjectId;
  lastMessageAt?: Date;
  unreadCount: { [userId: string]: number };
  isGroupChat: boolean;
  groupName?: string;
  groupAdmin?: ObjectId;
  isActive: boolean;
}
```

### Services

#### 1. InteractionService
Handles all media interactions (likes, comments, shares)

#### 2. ShareService
Manages social media sharing and link generation

#### 3. SocketService (Enhanced)
Real-time communication for all interactions

## 🚀 API Endpoints

### Media Interactions

#### Like/Unlike Media
```http
POST /api/interactions/media/:mediaId/like
Authorization: Bearer <token>
```

#### Add Comment
```http
POST /api/interactions/media/:mediaId/comment
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Great content!",
  "parentCommentId": "optional_parent_comment_id"
}
```

#### Remove Comment
```http
DELETE /api/interactions/comments/:commentId
Authorization: Bearer <token>
```

#### Add Comment Reaction
```http
POST /api/interactions/comments/:commentId/reaction
Authorization: Bearer <token>
Content-Type: application/json

{
  "reactionType": "heart"
}
```

#### Share Media
```http
POST /api/interactions/media/:mediaId/share
Authorization: Bearer <token>
Content-Type: application/json

{
  "platform": "facebook",
  "message": "Check this out!"
}
```

#### Get Comments
```http
GET /api/interactions/media/:mediaId/comments?page=1&limit=20
```

#### Get Share URLs
```http
GET /api/interactions/media/:mediaId/share-urls?message=Custom message
```

#### Get Share Stats
```http
GET /api/interactions/media/:mediaId/share-stats
```

### Messaging

#### Send Message
```http
POST /api/interactions/messages/:recipientId
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hello!",
  "messageType": "text",
  "mediaUrl": "optional_media_url",
  "replyTo": "optional_reply_message_id"
}
```

#### Get Conversations
```http
GET /api/interactions/conversations
Authorization: Bearer <token>
```

#### Get Conversation Messages
```http
GET /api/interactions/conversations/:conversationId/messages?page=1&limit=50
Authorization: Bearer <token>
```

#### Delete Message
```http
DELETE /api/interactions/messages/:messageId
Authorization: Bearer <token>
```

## 🔌 Socket.IO Events

### Client to Server Events

#### Media Interactions
```javascript
// Join media room for real-time updates
socket.emit('join-media', mediaId);

// Leave media room
socket.emit('leave-media', mediaId);

// Send new comment
socket.emit('new-comment', {
  mediaId: 'media_id',
  content: 'Comment content',
  parentCommentId: 'optional_parent_id'
});

// React to comment
socket.emit('comment-reaction', {
  commentId: 'comment_id',
  reaction: 'heart'
});

// React to media
socket.emit('media-reaction', {
  mediaId: 'media_id',
  actionType: 'like'
});

// Typing indicators
socket.emit('typing-start', mediaId);
socket.emit('typing-stop', mediaId);
```

#### Messaging
```javascript
// Send private message
socket.emit('send-message', {
  recipientId: 'recipient_id',
  content: 'Message content',
  messageType: 'text',
  mediaUrl: 'optional_media_url',
  replyTo: 'optional_reply_id'
});

// Join private chat
socket.emit('join-chat', recipientId);

// Leave private chat
socket.emit('leave-chat', recipientId);

// Chat typing indicators
socket.emit('chat-typing-start', recipientId);
socket.emit('chat-typing-stop', recipientId);
```

#### Live Streaming
```javascript
// Join live stream
socket.emit('join-stream', {
  streamId: 'stream_id',
  action: 'join'
});

// Leave live stream
socket.emit('leave-stream', {
  streamId: 'stream_id',
  action: 'leave'
});

// Stream chat
socket.emit('stream-chat', {
  streamId: 'stream_id',
  message: 'Chat message'
});

// Stream status update
socket.emit('stream-status', {
  streamId: 'stream_id',
  status: 'live'
});
```

### Server to Client Events

#### Media Interactions
```javascript
// New comment received
socket.on('new-comment', (commentData) => {
  console.log('New comment:', commentData);
});

// Comment reaction update
socket.on('comment-reaction', (data) => {
  console.log('Comment reaction:', data);
});

// Media reaction update
socket.on('media-reaction', (data) => {
  console.log('Media reaction:', data);
});

// User typing indicator
socket.on('user-typing', (data) => {
  console.log('User typing:', data);
});
```

#### Messaging
```javascript
// New message received
socket.on('new-message', (data) => {
  console.log('New message:', data);
});

// Message sent confirmation
socket.on('message-sent', (data) => {
  console.log('Message sent:', data);
});

// Chat typing indicator
socket.on('user-typing-chat', (data) => {
  console.log('User typing in chat:', data);
});
```

#### Live Streaming
```javascript
// Viewer joined stream
socket.on('viewer-joined', (data) => {
  console.log('Viewer joined:', data);
});

// Viewer left stream
socket.on('viewer-left', (data) => {
  console.log('Viewer left:', data);
});

// Stream chat message
socket.on('stream-chat', (data) => {
  console.log('Stream chat:', data);
});

// Stream status update
socket.on('stream-status', (data) => {
  console.log('Stream status:', data);
});
```

## 🔧 Environment Configuration

The following environment variables are required:

```bash
# Server Configuration
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000

# Database Configuration
MONGODB_URI=mongodb+srv://...

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🧪 Testing

Run the interaction tests:

```bash
# Test public endpoints
node test-interactions-simple.js

# Test with authentication (requires test data)
node test-interactions.js
```

## 📊 Performance Considerations

### Database Indexes
- User-Media-InteractionType compound index for fast queries
- Media-InteractionType index for media-specific queries
- ParentCommentId index for nested comments
- CreatedAt index for chronological ordering

### Rate Limiting
- Interaction endpoints: 10 requests per minute
- Comment endpoints: 5 requests per minute
- Message endpoints: 20 requests per minute

### Caching Strategy
- Consider implementing Redis for frequently accessed data
- Cache user conversations and media interactions
- Implement cache invalidation on updates

## 🔒 Security Features

### Authentication
- JWT-based authentication for all protected endpoints
- Socket.IO authentication middleware
- Token verification on every request

### Authorization
- Users can only delete their own comments and messages
- Conversation access restricted to participants
- Media interaction validation

### Input Validation
- Content length limits (comments: 1000 chars, messages: 2000 chars)
- ObjectId validation for all IDs
- Rate limiting to prevent abuse

## 🚀 Deployment

### Prerequisites
- Node.js 16+
- MongoDB 4.4+
- Redis (optional, for caching)

### Build and Deploy
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build image
docker build -t jevah-backend .

# Run container
docker run -p 4000:4000 jevah-backend
```

## 📈 Monitoring and Analytics

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking and monitoring

### Metrics
- Interaction counts and trends
- User engagement analytics
- Share statistics and platform breakdown

### Health Checks
- Database connectivity
- Socket.IO server status
- External service dependencies

## 🔄 Future Enhancements

### Planned Features
- Group chat functionality
- Message encryption
- Advanced comment moderation
- Share analytics dashboard
- Push notifications
- Message search functionality

### Performance Improvements
- Database query optimization
- Redis caching implementation
- CDN integration for media files
- WebSocket connection pooling

## 📞 Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Jevah Development Team
