# Contabo Streaming Setup Guide

## Overview

This guide helps you set up live streaming on your Contabo 12GB NVME server, replacing the current Mux implementation with a self-hosted streaming solution.

## Prerequisites

1. Contabo VPS with 12GB NVME (already purchased)
2. Ubuntu/Debian server
3. Domain name (optional but recommended)
4. SSL certificate (Let's Encrypt recommended)

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y nginx ffmpeg git curl wget unzip
```

### 2. Install NGINX with RTMP Module

```bash
# Install build dependencies
sudo apt install -y build-essential libpcre3 libpcre3-dev libssl-dev zlib1g-dev

# Download and compile NGINX with RTMP module
cd /tmp
wget http://nginx.org/download/nginx-1.24.0.tar.gz
wget https://github.com/arut/nginx-rtmp-module/archive/master.zip

tar -zxvf nginx-1.24.0.tar.gz
unzip master.zip

cd nginx-1.24.0
./configure --with-http_ssl_module --with-http_v2_module --with-http_realip_module --with-http_addition_module --with-http_sub_module --with-http_dav_module --with-http_flv_module --with-http_mp4_module --with-http_gunzip_module --with-http_gzip_static_module --with-http_random_index_module --with-http_secure_link_module --with-http_stub_status_module --with-http_auth_request_module --with-threads --with-file-aio --with-http_secure_link_module --with-http_slice_module --with-http_stub_status_module --add-module=../nginx-rtmp-module-master

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

sudo systemctl enable nginx-rtmp
sudo systemctl start nginx-rtmp
```

### 3. Configure NGINX for Streaming

Create the NGINX configuration:

```bash
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

            # Only allow publishing from trusted sources
            allow publish all;
            deny publish all;

            # Allow all clients to play
            allow play all;
        }
    }
}

# HTTP Configuration
http {
    include       mime.types;
    default_type  application/octet-stream;

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

    server {
        listen 80;
        server_name your-domain.com; # Replace with your domain

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

        # Redirect HTTP to HTTPS
        return 301 https://\$server_name\$request_uri;
    }

    # HTTPS Configuration
    server {
        listen 443 ssl http2;
        server_name your-domain.com; # Replace with your domain

        # SSL Configuration
        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

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
    }
}
EOF
```

### 4. Create HLS and DASH directories

```bash
sudo mkdir -p /var/www/hls
sudo mkdir -p /var/www/dash
sudo chown -R www-data:www-data /var/www/hls
sudo chown -R www-data:www-data /var/www/dash
```

### 5. Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot

# Get SSL certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### 6. Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS, and RTMP
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1935
sudo ufw enable
```

## Environment Variables

Add these to your `.env` file:

```env
# Contabo Streaming Configuration
CONTABO_RTMP_SERVER=rtmp://your-domain.com/live
CONTABO_HLS_SERVER=https://your-domain.com/hls
CONTABO_DASH_SERVER=https://your-domain.com/dash
CONTABO_STREAM_KEY_PREFIX=jevah

# Optional: Server monitoring
CONTABO_SERVER_IP=your-server-ip
CONTABO_SERVER_DOMAIN=your-domain.com
```

## Testing the Setup

### 1. Test RTMP Publishing

Using OBS Studio or FFmpeg:

```bash
# Test with FFmpeg
ffmpeg -re -f lavfi -i testsrc=duration=60:size=1280x720:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=60 \
  -c:v libx264 -preset ultrafast -tune zerolatency \
  -c:a aac -b:a 128k \
  -f flv rtmp://your-domain.com/live/test_stream
```

### 2. Test HLS Playback

```bash
# Check if HLS files are generated
ls -la /var/www/hls/test_stream/

# Test playback URL
curl -I https://your-domain.com/hls/test_stream/index.m3u8
```

### 3. Test DASH Playback

```bash
# Check if DASH files are generated
ls -la /var/www/dash/test_stream/

# Test playback URL
curl -I https://your-domain.com/dash/test_stream/manifest.mpd
```

## API Endpoints

### Start Live Stream

```bash
POST /api/media/live/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "My Live Stream",
  "description": "Live gospel music",
  "category": "worship",
  "topics": ["gospel", "worship"]
}
```

### Schedule Live Stream

```bash
POST /api/media/live/schedule
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Scheduled Stream",
  "description": "Upcoming event",
  "category": "worship",
  "topics": ["gospel"],
  "scheduledStart": "2024-01-15T20:00:00Z",
  "scheduledEnd": "2024-01-15T22:00:00Z"
}
```

### Get Stream Status

```bash
GET /api/media/live/{streamId}/status
Authorization: Bearer <token>
```

### Get Stream Statistics

```bash
GET /api/media/live/{streamId}/stats
Authorization: Bearer <token>
```

### End Live Stream

```bash
POST /api/media/live/{id}/end
Authorization: Bearer <token>
```

## Performance Optimization

### 1. NGINX Configuration Tuning

```nginx
# Add to nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}
```

### 2. System Tuning

```bash
# Increase file descriptor limits
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

# Optimize network settings
echo "net.core.rmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
echo "net.core.wmem_max = 16777216" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_rmem = 4096 87380 16777216" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_wmem = 4096 65536 16777216" | sudo tee -a /etc/sysctl.conf

sudo sysctl -p
```

### 3. Storage Optimization

```bash
# Monitor disk usage
df -h /var/www

# Clean up old stream files (add to crontab)
find /var/www/hls -name "*.ts" -mtime +1 -delete
find /var/www/dash -name "*.m4s" -mtime +1 -delete
```

## Monitoring and Maintenance

### 1. Health Check Script

```bash
#!/bin/bash
# /usr/local/bin/stream-health-check.sh

# Check NGINX status
if ! systemctl is-active --quiet nginx-rtmp; then
    echo "NGINX RTMP is down, restarting..."
    systemctl restart nginx-rtmp
fi

# Check disk space
DISK_USAGE=$(df /var/www | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is high: ${DISK_USAGE}%"
    # Clean up old files
    find /var/www/hls -name "*.ts" -mtime +1 -delete
    find /var/www/dash -name "*.m4s" -mtime +1 -delete
fi

# Check SSL certificate
if ! certbot certificates | grep -q "VALID"; then
    echo "SSL certificate needs renewal"
    certbot renew
fi
```

### 2. Add to Crontab

```bash
# Add health check every 5 minutes
echo "*/5 * * * * /usr/local/bin/stream-health-check.sh" | sudo crontab -
```

## Troubleshooting

### Common Issues

1. **RTMP Connection Failed**

   - Check firewall settings
   - Verify NGINX RTMP is running
   - Check RTMP application configuration

2. **HLS/DASH Not Working**

   - Verify HLS/DASH paths exist
   - Check file permissions
   - Ensure NGINX configuration is correct

3. **High CPU Usage**

   - Optimize video encoding settings
   - Consider hardware acceleration
   - Monitor concurrent streams

4. **Disk Space Issues**
   - Implement automatic cleanup
   - Monitor stream duration
   - Consider external storage

### Logs

```bash
# NGINX error logs
sudo tail -f /usr/local/nginx/logs/error.log

# NGINX access logs
sudo tail -f /usr/local/nginx/logs/access.log

# System logs
sudo journalctl -u nginx-rtmp -f
```

## Migration from Mux

1. **Update Environment Variables**

   - Remove MUX_TOKEN_ID and MUX_TOKEN_SECRET
   - Add Contabo configuration

2. **Update Frontend**

   - Change RTMP URLs from Mux to Contabo
   - Update playback URLs

3. **Test Migration**
   - Test with small streams first
   - Monitor performance
   - Verify all features work

## Cost Comparison

### Mux (Current)

- $0.50 per hour of live streaming
- $0.50 per hour of video processing
- Additional bandwidth costs

### Contabo (New)

- Fixed monthly cost: ~$10-20/month
- Unlimited streaming hours
- No bandwidth charges
- Full control over infrastructure

## Benefits of Contabo Setup

✅ **Cost Effective**: Fixed monthly cost vs. per-hour charges
✅ **Full Control**: Complete control over streaming infrastructure
✅ **No Bandwidth Limits**: Unlimited streaming within server capacity
✅ **Customizable**: Can optimize for your specific needs
✅ **Scalable**: Can upgrade server as needed
✅ **Privacy**: All data stays on your server

## Next Steps

1. Set up your Contabo server following this guide
2. Update your environment variables
3. Test the streaming functionality
4. Update your frontend to use the new endpoints
5. Monitor performance and optimize as needed
