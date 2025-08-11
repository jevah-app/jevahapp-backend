# 🚀 Quick Start Guide - Jevah with Contabo + Cloudflare R2

## 🎯 What You're Getting

✅ **Live Streaming** - Contabo VPS (161.97.181.71)  
✅ **Recorded Sessions** - Cloudflare R2 (10GB free storage)  
✅ **Real-time Features** - Socket.IO for comments/reactions  
✅ **Production Ready** - Winston logging, rate limiting, security

## 📋 Setup Steps

### 1. Set Up Environment Variables

```bash
# Run the setup script
./setup-env.sh

# Edit .env file with your credentials
nano .env
```

**Required updates in `.env`:**

```env
# Cloudflare R2 (for recordings)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_ACCOUNT_ID=your-account-id

# Email (Resend)
RESEND_API_KEY=your-resend-api-key

# Security
JWT_SECRET=your-super-secret-jwt-key
```

### 2. Set Up Contabo Server

Follow the detailed guide: `CONTABO_SETUP_GUIDE.md`

**Quick commands:**

```bash
# Connect to your server
ssh root@161.97.181.71

# Run the setup commands from CONTABO_SETUP_GUIDE.md
```

### 3. Install Dependencies & Build

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start development server
npm run dev
```

### 4. Test the Setup

**Test Live Streaming:**

```bash
curl -X POST http://localhost:4000/api/media/live/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Stream",
    "description": "Testing Contabo streaming",
    "category": "worship"
  }'
```

**Test Recording:**

```bash
curl -X POST http://localhost:4000/api/media/recording/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "your-stream-id",
    "streamKey": "your-stream-key",
    "title": "Test Recording"
  }'
```

## 🎥 How It Works

### Live Streaming Flow:

1. **User starts stream** → Backend generates Contabo stream key
2. **OBS publishes** → To `rtmp://161.97.181.71/live/stream-key`
3. **Contabo processes** → Creates HLS/DASH streams
4. **Viewers watch** → Via `http://161.97.181.71/hls/stream-key/index.m3u8`

### Recording Flow:

1. **User starts recording** → Backend downloads HLS segments
2. **Segments combined** → Into single video file
3. **Upload to R2** → For permanent storage
4. **Users watch later** → Via Cloudflare R2 URLs

## 🔧 API Endpoints

### Live Streaming:

- `POST /api/media/live/start` - Start live stream
- `POST /api/media/live/:id/end` - End live stream
- `GET /api/media/live` - Get active streams
- `POST /api/media/live/schedule` - Schedule stream

### Recording:

- `POST /api/media/recording/start` - Start recording
- `POST /api/media/recording/:streamId/stop` - Stop recording
- `GET /api/media/recording/:streamId/status` - Get recording status
- `GET /api/media/recordings` - Get user recordings

### User Management:

- `GET /api/users/me` - Get current user
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:userId` - Get user by ID
- `PUT /api/users/:userId` - Update user profile
- `DELETE /api/users/:userId` - Delete user (admin)
- `GET /api/users/stats` - Get user statistics (admin)

## 📊 Monitoring

**Check Contabo Server:**

```bash
# NGINX status
curl http://161.97.181.71/status

# Health check
curl http://161.97.181.71/health
```

**Check Backend:**

```bash
# Health check
curl http://localhost:4000/health

# API docs
curl http://localhost:4000/api-docs
```

## 🎯 Production Deployment

### 1. Update Environment Variables

```env
NODE_ENV=production
LOG_LEVEL=warn
SWAGGER_ENABLED=false
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Use Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### 3. Add SSL to Contabo

```bash
# Install SSL certificate
sudo certbot certonly --standalone -d your-domain.com
```

## 🆘 Troubleshooting

### Common Issues:

**1. Can't connect to Contabo:**

```bash
# Check if server is reachable
ping 161.97.181.71

# Check if RTMP port is open
telnet 161.97.181.71 1935
```

**2. Recording not working:**

- Check Cloudflare R2 credentials
- Verify R2 bucket permissions
- Check network connectivity

**3. Live stream not starting:**

- Verify Contabo NGINX is running
- Check firewall settings
- Test with FFmpeg directly

### Logs:

```bash
# Backend logs
tail -f logs/combined-*.log

# Contabo NGINX logs
ssh root@161.97.181.71 "tail -f /usr/local/nginx/logs/error.log"
```

## 📞 Support

1. **Check logs** in `logs/` directory
2. **Verify environment variables** are set correctly
3. **Test Contabo server** connectivity
4. **Check Cloudflare R2** bucket permissions

## 🎉 You're Ready!

Your Jevah platform now supports:

- ✅ Live streaming via Contabo
- ✅ Recording sessions to Cloudflare R2
- ✅ Real-time interactions
- ✅ Production-grade infrastructure

Start streaming! 🚀
