# Jevah - Gospel Media Platform

A comprehensive gospel media platform featuring live streaming, music, videos, and community features with real-time interactions.

## 🚀 Features

### Core Features

- **User Management**: Registration, authentication, profile management
- **Media Management**: Upload, stream, and manage gospel content
- **Live Streaming**: Real-time streaming with Contabo infrastructure
- **Real-time Interactions**: Socket.IO powered comments, reactions, and chat
- **Content Discovery**: Search, filter, and recommend gospel media
- **Artist Management**: Specialized features for gospel artists
- **Analytics**: Comprehensive tracking and reporting

### Technical Features

- **Production-Grade**: Winston logging, error handling, rate limiting
- **Real-time**: Socket.IO for live interactions
- **Documentation**: Swagger/OpenAPI documentation
- **Security**: Helmet, CORS, JWT authentication
- **Performance**: Compression, caching, optimization
- **Testing**: Jest testing framework with coverage

## 📋 Prerequisites

- Node.js 18+
- MongoDB 6+
- Contabo VPS (for live streaming)
- Cloudflare R2 (for media storage)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd jevah-app
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with the required variables:

   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=4000

   # Database
   MONGODB_URI=mongodb://localhost:27017/jevah

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key

   # Email (Resend)
   RESEND_API_KEY=your-resend-api-key

   # Cloudflare R2
   R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your-access-key
   R2_SECRET_ACCESS_KEY=your-secret-key
   R2_BUCKET=your-bucket-name
   R2_ACCOUNT_ID=your-account-id

   # Contabo Streaming
   CONTABO_RTMP_SERVER=rtmp://your-domain.com/live
   CONTABO_HLS_SERVER=https://your-domain.com/hls
   CONTABO_DASH_SERVER=https://your-domain.com/dash
   CONTABO_STREAM_KEY_PREFIX=jevah

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000

   # Logging
   LOG_LEVEL=info
   ```

4. **Build the project**

   ```bash
   npm run build
   ```

5. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test -- --coverage
```

## 📚 API Documentation

Once the server is running, visit:

- **Swagger UI**: `http://localhost:4000/api-docs`
- **OpenAPI JSON**: `http://localhost:4000/api-docs.json`

## 🔌 Real-time Features

The platform uses Socket.IO for real-time features:

### Socket Events

#### Client to Server

- `join-media` - Join media room for comments/reactions
- `leave-media` - Leave media room
- `join-stream` - Join live stream
- `leave-stream` - Leave live stream
- `new-comment` - Post new comment
- `comment-reaction` - React to comment
- `media-reaction` - React to media (like, favorite, share)
- `typing-start` - Start typing indicator
- `typing-stop` - Stop typing indicator
- `user-presence` - Update user presence
- `stream-chat` - Send chat message in live stream
- `stream-status` - Update stream status

#### Server to Client

- `new-comment` - New comment posted
- `comment-reaction` - Comment reaction updated
- `media-reaction` - Media reaction updated
- `user-typing` - User typing indicator
- `user-presence` - User presence update
- `viewer-joined` - Viewer joined stream
- `viewer-left` - Viewer left stream
- `stream-chat` - New chat message
- `stream-status` - Stream status update

### Socket Connection Example

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  auth: {
    token: "your-jwt-token",
  },
});

// Join media room
socket.emit("join-media", "media-id");

// Listen for new comments
socket.on("new-comment", comment => {
  console.log("New comment:", comment);
});

// Post a comment
socket.emit("new-comment", {
  mediaId: "media-id",
  content: "Great gospel content!",
});
```

## 🏗️ Project Structure

```
src/
├── config/           # Configuration files
├── constants/        # Application constants
├── controllers/      # Route controllers
├── middleware/       # Express middleware
├── models/          # MongoDB models
├── routes/          # Express routes
├── service/         # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
├── app.ts           # Express app setup
└── index.ts         # Server entry point
```

## 🚀 Deployment

### Production Build

```bash
# Build the project
npm run build

# Start production server
npm start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb://your-production-db
JWT_SECRET=your-production-jwt-secret
RESEND_API_KEY=your-production-resend-key
FRONTEND_URL=https://your-frontend-domain.com
LOG_LEVEL=info
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 4000

CMD ["node", "dist/index.js"]
```

## 📊 Monitoring

The application includes comprehensive logging:

- **Request Logging**: All HTTP requests with timing
- **Error Logging**: Detailed error tracking
- **Database Logging**: Query performance monitoring
- **Streaming Logging**: Live stream events
- **Authentication Logging**: User login/logout events

Logs are stored in the `logs/` directory with daily rotation.

## 🔧 Development

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Database Seeding

```bash
# Seed cities data
npm run seed-cities
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@jevahapp.com or create an issue in the repository.

## 🔗 Links

- **API Documentation**: `/api-docs`
- **Health Check**: `/health`
- **Socket.IO**: Real-time connections on the same port

---

Built with ❤️ for the gospel community
