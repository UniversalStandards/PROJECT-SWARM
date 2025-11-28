# Self-Hosted Deployment Guide

This guide covers deploying PROJECT-SWARM on your own servers, including Microsoft Windows Server 2025 Datacenter and Amazon Linux.

## Architecture Overview

PROJECT-SWARM is a full-stack application consisting of:
- **Frontend**: React SPA built with Vite → static files in `dist/public`
- **Backend**: Express.js API server → Node.js server in `dist/index.js`
- **Database**: PostgreSQL (recommended: Neon, AWS RDS, or self-hosted)

## Prerequisites

### For All Servers
- Node.js 22.x (specified in `.node-version`)
- npm 10.x or higher
- PostgreSQL database
- Git (for cloning repository)
- Process manager (PM2 recommended for Linux, IIS for Windows)

### For Windows Server 2025 Datacenter
- IIS (Internet Information Services) with IISNode module
- OR use PM2 with Node.js directly

### For Amazon Linux
- PM2 or systemd for process management
- Nginx or Apache for reverse proxy (recommended)

---

## Deployment Steps

### Step 1: Clone and Build

```bash
# Clone the repository
git clone https://github.com/UniversalStandards/PROJECT-SWARM.git
cd PROJECT-SWARM

# Install dependencies
npm ci

# Build the application
npm run build

# This creates:
# - dist/public/    (frontend static files)
# - dist/index.js   (backend server)
```

### Step 2: Environment Configuration

Create a `.env` file in the project root:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/project_swarm

# Node Environment
NODE_ENV=production
PORT=3000

# API Keys (get from your providers)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
GEMINI_API_KEY=your_gemini_key

# Session Secret
SESSION_SECRET=your_random_secret_here

# Replit Auth (if using)
REPL_ID=your_repl_id
REPLIT_DB_URL=your_replit_db_url
```

### Step 3: Database Setup

```bash
# Push database schema
npm run db:push

# Or manually run migrations if you have them
# psql -d project_swarm -f migrations/schema.sql
```

---

## Windows Server 2025 Deployment

### Option A: Using IIS with IISNode (Recommended for Windows)

#### 1. Install Prerequisites

```powershell
# Install IIS and IISNode
# Download IISNode from: https://github.com/Azure/iisnode/releases

# Install URL Rewrite module
# Download from: https://www.iis.net/downloads/microsoft/url-rewrite

# Install Node.js 22.x
# Download from: https://nodejs.org/
```

#### 2. Configure IIS

Create `web.config` in the project root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <handlers>
      <add name="iisnode" path="dist/index.js" verb="*" modules="iisnode" />
    </handlers>
    
    <rewrite>
      <rules>
        <!-- Serve static files directly -->
        <rule name="StaticContent" stopProcessing="true">
          <match url="^(dist/public/.*)$" />
          <action type="Rewrite" url="{R:1}" />
        </rule>
        
        <!-- Route API calls to Node.js -->
        <rule name="DynamicContent">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="True" />
          </conditions>
          <action type="Rewrite" url="dist/index.js" />
        </rule>
      </rules>
    </rewrite>
    
    <iisnode
      nodeProcessCommandLine="C:\Program Files\nodejs\node.exe"
      watchedFiles="*.js;.env"
      loggingEnabled="true"
      logDirectory="iisnode" />
    
    <staticContent>
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <mimeMap fileExtension=".wasm" mimeType="application/wasm" />
    </staticContent>
  </system.webServer>
</configuration>
```

#### 3. Create IIS Site

```powershell
# Open IIS Manager
# 1. Right-click "Sites" → "Add Website"
# 2. Site name: PROJECT-SWARM
# 3. Physical path: C:\inetpub\wwwroot\PROJECT-SWARM
# 4. Port: 80 (or your preferred port)
# 5. Click OK

# Set application pool to No Managed Code
# Select the site → Application Pools → Set .NET CLR version to "No Managed Code"
```

#### 4. Set Environment Variables

```powershell
# In IIS Manager → Site → Configuration Editor
# Section: system.webServer/iisnode
# Add environment variables or use .env file
```

### Option B: Using PM2 on Windows

```powershell
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.js --name project-swarm

# Make PM2 start on system boot
pm2 startup
pm2 save

# View logs
pm2 logs project-swarm

# Restart
pm2 restart project-swarm
```

---

## Amazon Linux Deployment

### Option A: Using PM2 with Nginx (Recommended)

#### 1. Install Dependencies

```bash
# Update system
sudo yum update -y

# Install Node.js 22.x
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs

# Install Nginx
sudo amazon-linux-extras install nginx1 -y

# Install PM2
sudo npm install -g pm2
```

#### 2. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'project-swarm',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
  }]
};
```

Start the application:

```bash
# Start with ecosystem file
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command it outputs

# Enable on boot
sudo systemctl enable pm2-$USER
```

#### 3. Configure Nginx

Create `/etc/nginx/conf.d/project-swarm.conf`:

```nginx
upstream project_swarm_backend {
    least_conn;
    server localhost:3000;
}

server {
    listen 80;
    # Use your domain name or server IP address
    server_name your-domain.com;  # Replace with: example.com or 52.123.45.67 (your server IP)
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Serve frontend static files
    location / {
        root /home/ec2-user/PROJECT-SWARM/dist/public;
        try_files $uri $uri/ /index.html;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://project_swarm_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://project_swarm_backend;
        access_log off;
    }
}
```

Enable and start Nginx:

```bash
# Test configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Reload after changes
sudo systemctl reload nginx
```

#### 4. SSL with Let's Encrypt (Recommended)

```bash
# Install certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

### Option B: Using systemd Service

Create `/etc/systemd/system/project-swarm.service`:

```ini
[Unit]
Description=PROJECT-SWARM Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/PROJECT-SWARM
Environment="NODE_ENV=production"
Environment="PORT=3000"
EnvironmentFile=/home/ec2-user/PROJECT-SWARM/.env
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=project-swarm

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable project-swarm
sudo systemctl start project-swarm

# Check status
sudo systemctl status project-swarm

# View logs
sudo journalctl -u project-swarm -f
```

---

## Database Setup

### Using Amazon RDS (Recommended for AWS)

```bash
# 1. Create RDS PostgreSQL instance in AWS Console
# 2. Note the endpoint URL
# 3. Update DATABASE_URL in .env
DATABASE_URL=postgresql://username:password@your-instance.rds.amazonaws.com:5432/project_swarm
```

### Using Self-Hosted PostgreSQL

#### On Amazon Linux:
```bash
# Install PostgreSQL (use version 15, 16, or 17 as available)
sudo yum install -y postgresql-server postgresql
# Or for specific version: sudo yum install -y postgresql15-server postgresql15

sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql -c "CREATE DATABASE project_swarm;"
sudo -u postgres psql -c "CREATE USER swarm_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE project_swarm TO swarm_user;"
```

#### On Windows Server:
Download PostgreSQL from https://www.postgresql.org/download/windows/

---

## Monitoring and Maintenance

### PM2 Monitoring

```bash
# View process status
pm2 status

# View logs
pm2 logs project-swarm --lines 100

# Monitor resources
pm2 monit

# Restart on file changes
pm2 restart project-swarm
```

### Log Rotation (Linux)

Create `/etc/logrotate.d/project-swarm`:

```
/home/ec2-user/PROJECT-SWARM/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

## Firewall Configuration

### Amazon Linux (Security Groups)
In AWS Console → EC2 → Security Groups:
- Allow inbound TCP 80 (HTTP)
- Allow inbound TCP 443 (HTTPS)
- Allow inbound TCP 22 (SSH) from your IP only

### Windows Server (Windows Firewall)
```powershell
# Allow HTTP
New-NetFirewallRule -DisplayName "HTTP" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow

# Allow HTTPS
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow
```

---

## Backup Strategy

```bash
# Database backup script (Linux)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ec2-user/backups"
pg_dump -U swarm_user project_swarm > "$BACKUP_DIR/backup_$DATE.sql"
# Keep only last 30 days
find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /home/ec2-user/backup.sh
```

---

## Performance Tuning

### Node.js
- Use cluster mode in PM2 for multi-core utilization
- Set appropriate NODE_OPTIONS for memory: `NODE_OPTIONS=--max-old-space-size=4096`

### Nginx
- Enable gzip compression
- Configure caching for static assets
- Use HTTP/2

### PostgreSQL
- Tune `shared_buffers`, `work_mem`, `maintenance_work_mem`
- Enable connection pooling

---

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs project-swarm

# Check if port is in use
netstat -tulpn | grep :3000

# Check environment variables
pm2 env project-swarm
```

### Database connection errors
```bash
# Test database connection
psql -h your-db-host -U username -d project_swarm

# Check if PostgreSQL is running
systemctl status postgresql
```

### High memory usage
```bash
# Monitor with PM2
pm2 monit

# Restart with memory limit
pm2 restart project-swarm --max-memory-restart 1G
```

---

## Update and Deployment Script

Create `deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying PROJECT-SWARM..."

# Pull latest changes
git pull origin main

# Install dependencies
npm ci

# Build application
npm run build

# Run database migrations
npm run db:push

# Restart application
pm2 restart project-swarm

echo "✅ Deployment complete!"
```

Make executable:
```bash
chmod +x deploy.sh
```

---

## Security Checklist

- [ ] Use HTTPS (SSL certificate configured)
- [ ] Environment variables not committed to git
- [ ] Database uses strong password
- [ ] Firewall configured properly
- [ ] Regular security updates applied
- [ ] PM2 or systemd configured for auto-restart
- [ ] Log rotation configured
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured
- [ ] Rate limiting enabled on API
