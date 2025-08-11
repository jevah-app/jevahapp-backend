# 🚀 Contabo Server Setup Guide for Jevah Live Streaming

## Your Contabo VPS Details

Based on your email, here are your server details:

```
IP Address: 161.97.181.71
Server Type: Cloud VPS 20 NVMe (no setup)
Location: Hub Europe
VNC IP: 5.189.139.92:63089
VNC Password: ev4pqXbs
Username: root
Password: [as chosen by you during order process]
```

## 🎯 What We're Setting Up

1. **Live Streaming Server** - Contabo handles live streaming
2. **Recording System** - Cloudflare R2 stores recorded sessions
3. **Complete Integration** - Backend connects to both services

## 📋 Step-by-Step Setup

### Step 1: Connect to Your Contabo Server

```bash
# Connect via SSH
ssh root@161.97.181.71

# Or if you have a domain pointing to this IP
ssh root@your-domain.com
```

### Step 2: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y nginx ffmpeg git curl wget unzip build-essential
sudo apt install -y libpcre3 libpcre3-dev libssl-dev zlib1g-dev
```

### Step 3: Install NGINX with RTMP Module

```bash
# Create temporary directory
cd /tmp

# Download NGINX and RTMP module
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip

# Extract files
tar -zxvf nginx-1.24.0.tar.gz
unzip master.zip

# Compile NGINX with RTMP module
cd nginx-1.24.0
./configure \
  --with-http_ssl_module \
  --with-http_v2_module \
  --with-http_realip_module \
  --with-http_addition_module \
  --with-http_sub_module \
  --with-http_dav_module \
  --with-http_flv_module \
  --with-http_mp4_module \
  --with-http_gunzip_module \
  --with-http_gzip_static_module \
  --with-http_random_index_module \
  --with-http_secure_link_module \
  --with-http_stub_status_module \
  --with-http_auth_request_module \
  --with-threads \
  --with-file-aio \
  --with-http_secure_link_module \
  --with-http_slice_module \
  --with-http_stub_status_module \
  --add-module=../nginx-rtmp-module-master

# Build and install
make -j$(nproc)
sudo make install

# Create systemd service
sudo tee /etc/systemd/system/nginx-rtmp.service > /dev/null <<EOF
[Unit]
Description=NGINX with RTMP module
After=network.target

[Service]
Type=forking
PIDFile=/usr/local/nginx/logs/nginx.pid
ExecStartPre=/usr/local/nginx/sbin/nginx -t
ExecStart=/usr/local/nginx/sbin/nginx
ExecReload=/usr/local/nginx/sbin/nginx -s reload
ExecStop=/bin/kill -s QUIT \$MAINPID
PrivateTmp=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable nginx-rtmp
sudo systemctl start nginx-rtmp
```

### Step 4: Configure NGINX for Streaming

```bash
# Create NGINX configuration
sudo tee /usr/local/nginx/conf/nginx.conf > /dev/null <<EOF
worker_processes auto;
rtmp_auto_push on;

events {
    worker_connections 1024;
}

# RTMP Configuration
rtmp {
    server {
        listen 1935;
        chunk_size 4096;

        application live {
            live on;
            record off;

            # HLS
            hls on;
            hls_path /var/www/hls;
            hls_fragment 3;
            hls_playlist_length 60;

            # DASH
            dash on;
            dash_path /var/www/dash;
            dash_fragment 3;
            dash_playlist_length 60;

            # Allow all clients to publish and play
            allow publish all;
            allow play all;
        }
    }
}

# HTTP Configuration
http {
    include       /usr/local/nginx/conf/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                    '\$status \$body_bytes_sent "\$http_referer" '
                    '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log /usr/local/nginx/logs/access.log main;
    error_log /usr/local/nginx/logs/error.log;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # HTTP server
    server {
        listen 80;
        server_name 161.97.181.71; # Your server IP

        # HLS
        location /hls {
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            root /var/www;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }

        # DASH
        location /dash {
            types {
                application/dash+xml mpd;
                video/mp4 mp4;
            }
            root /var/www;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Status page
        location /status {
            rtmp_stat all;
            rtmp_stat_stylesheet stat.xsl;
        }
    }
}
EOF

# Create HLS and DASH directories
sudo mkdir -p /var/www/hls
sudo mkdir -p /var/www/dash
sudo chown -R www-data:www-data /var/www/hls
sudo chown -R www-data:www-data /var/www/dash

# Test configuration
sudo /usr/local/nginx/sbin/nginx -t

# Reload NGINX
sudo systemctl reload nginx-rtmp
```

### Step 5: Configure Firewall

```bash
# Allow necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS (if you add SSL later)
sudo ufw allow 1935  # RTMP
sudo ufw enable

# Check firewall status
sudo ufw status
```

### Step 6: Test the Setup

```bash
# Test RTMP publishing with FFmpeg
ffmpeg -re -f lavfi -i testsrc=duration=30:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=30 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -c:a aac -b:a 128k \
  -f flv rtmp://161.97.181.71/live/test_stream

# Check if HLS files are generated
ls -la /var/www/hls/test_stream/

# Test HLS playback URL
curl -I http://161.97.181.71/hls/test_stream/index.m3u8
```

## 🔧 Environment Variables for Your Backend

Add these to your `.env` file:

```env
# Contabo Streaming Configuration
CONTABO_RTMP_SERVER=rtmp://161.97.181.71/live
CONTABO_HLS_SERVER=http://161.97.181.71/hls
CONTABO_DASH_SERVER=http://161.97.181.71/dash
CONTABO_STREAM_KEY_PREFIX=jevah

# Cloudflare R2 Configuration (for recordings)
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=your-bucket-name
R2_ACCOUNT_ID=your-account-id
R2_CUSTOM_DOMAIN=your-custom-domain.com # Optional

# Server monitoring
CONTABO_SERVER_IP=161.97.181.71
```

## 🎥 How It Works

### Live Streaming Flow:

1. **User starts stream** → Backend calls Contabo service
2. **Contabo generates stream key** → Returns RTMP URL
3. **OBS/Streaming software** → Publishes to RTMP URL
4. **Contabo processes** → Creates HLS/DASH streams
5. **Viewers watch** → Via HLS/DASH URLs

### Recording Flow:

1. **User starts recording** → Backend calls recording service
2. **Service downloads HLS segments** → From Contabo server
3. **Segments combined** → Into single video file
4. **Upload to Cloudflare R2** → For permanent storage
5. **Users can watch later** → Via R2 URLs

## 🧪 Testing Commands

### Test Live Streaming:

```bash
# Start a test stream
curl -X POST http://localhost:4000/api/media/live/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Stream",
    "description": "Testing Contabo streaming",
    "category": "worship"
  }'
```

### Test Recording:

```bash
# Start recording
curl -X POST http://localhost:4000/api/media/recording/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "streamId": "your-stream-id",
    "streamKey": "your-stream-key",
    "title": "Test Recording"
  }'

# Stop recording
curl -X POST http://localhost:4000/api/media/recording/your-stream-id/stop \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Monitoring

### Check NGINX Status:

```bash
# View NGINX status
curl http://161.97.181.71/status

# Check NGINX logs
sudo tail -f /usr/local/nginx/logs/error.log
sudo tail -f /usr/local/nginx/logs/access.log
```

### Check System Resources:

```bash
# Monitor CPU and memory
htop

# Check disk space
df -h

# Monitor network
iftop
```

## 🔒 Security Considerations

1. **Firewall**: Only necessary ports are open
2. **RTMP Security**: Consider adding authentication for production
3. **SSL**: Add SSL certificate for HTTPS streaming
4. **Monitoring**: Set up alerts for server health

## 🚀 Production Deployment

### Optional: Add SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate (if you have a domain)
sudo certbot certonly --standalone -d your-domain.com

# Update NGINX config to use SSL
# (Add SSL configuration to the HTTP server block)
```

### Optional: Domain Setup

1. Point your domain to `161.97.181.71`
2. Update environment variables to use domain instead of IP
3. Add SSL certificate for secure streaming

## 🎯 Next Steps

1. **Test the setup** with the provided commands
2. **Update your backend** with the environment variables
3. **Test live streaming** from your application
4. **Test recording** functionality
5. **Monitor performance** and adjust as needed

## 📞 Support

If you encounter issues:

1. Check NGINX logs: `/usr/local/nginx/logs/error.log`
2. Check system logs: `journalctl -u nginx-rtmp -f`
3. Test connectivity: `telnet 161.97.181.71 1935`
4. Verify firewall: `sudo ufw status`

Your Contabo server is now ready for live streaming! 🎉
