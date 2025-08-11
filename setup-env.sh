#!/bin/bash

# Jevah Environment Setup Script
echo "🚀 Setting up Jevah Environment Variables"
echo "=========================================="

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists. Creating backup..."
    cp .env .env.backup
fi

# Create .env file
cat > .env << 'EOF'
# =============================================================================
# Jevah Gospel Media Platform - Environment Configuration
# =============================================================================

# Server Configuration
NODE_ENV=development
PORT=4000
API_BASE_URL=http://localhost:4000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/jevah

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Email Configuration (Resend)
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=noreply@jevahapp.com

# =============================================================================
# Cloudflare R2 Configuration (for media uploads and recordings)
# =============================================================================
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_CUSTOM_DOMAIN=your-custom-domain.com

# =============================================================================
# Contabo Streaming Configuration
# =============================================================================
# Your Contabo VPS IP: 161.97.181.71
CONTABO_RTMP_SERVER=rtmp://161.97.181.71/live
CONTABO_HLS_SERVER=http://161.97.181.71/hls
CONTABO_DASH_SERVER=http://161.97.181.71/dash
CONTABO_STREAM_KEY_PREFIX=jevah

# =============================================================================
# Frontend Configuration
# =============================================================================
FRONTEND_URL=http://localhost:3000

# =============================================================================
# Logging Configuration
# =============================================================================
LOG_LEVEL=info

# =============================================================================
# Rate Limiting
# =============================================================================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# =============================================================================
# File Upload Limits
# =============================================================================
MAX_FILE_SIZE=100000000
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp
ALLOWED_VIDEO_TYPES=video/mp4,video/webm,video/ogg
ALLOWED_AUDIO_TYPES=audio/mpeg,audio/mp3,audio/wav,audio/ogg

# =============================================================================
# Google AI Configuration
# =============================================================================
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# =============================================================================
# Security
# =============================================================================
CORS_ORIGIN=http://localhost:3000
HELMET_ENABLED=true

# =============================================================================
# Development Only
# =============================================================================
SWAGGER_ENABLED=true
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env file with your actual values:"
echo "   - Cloudflare R2 credentials"
echo "   - Resend API key"
echo "   - JWT secret"
echo ""
echo "2. Set up your Contabo server using CONTABO_SETUP_GUIDE.md"
echo ""
echo "3. Run: npm install && npm run build"
echo ""
echo "4. Start the server: npm run dev"
echo ""
echo "🔧 Required environment variables to update:"
echo "   - R2_ENDPOINT"
echo "   - R2_ACCESS_KEY_ID"
echo "   - R2_SECRET_ACCESS_KEY"
echo "   - R2_BUCKET"
echo "   - R2_ACCOUNT_ID"
echo "   - RESEND_API_KEY"
echo "   - JWT_SECRET"
