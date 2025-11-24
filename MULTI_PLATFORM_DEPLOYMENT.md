# Multi-Platform Deployment Guide

This guide explains how to deploy PROJECT-SWARM simultaneously across multiple platforms:
1. **Cloudflare Pages/Workers** - Global CDN with edge computing
2. **GitHub Pages** - Free static site hosting
3. **Self-Hosted Servers** - Full control on your infrastructure

## Architecture Overview

PROJECT-SWARM consists of two main components:

```
┌─────────────────────────────────────────────────────────────┐
│                     PROJECT-SWARM                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React SPA)          Backend (Express API)        │
│  ├─ Vite build                 ├─ Node.js server           │
│  ├─ Static files               ├─ REST API endpoints       │
│  └─ dist/public/               └─ dist/index.js            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Component Requirements by Platform

| Component | Cloudflare | GitHub Pages | Windows Server | Amazon Linux |
|-----------|------------|--------------|----------------|--------------|
| Frontend  | ✅ Pages   | ✅ Static    | ✅ IIS/PM2     | ✅ Nginx/PM2 |
| Backend   | ✅ Workers | ❌ External  | ✅ IIS/PM2     | ✅ PM2       |
| Database  | ✅ External| ❌ External  | ✅ Self/RDS    | ✅ Self/RDS  |

## Quick Start by Platform

### 🌐 Cloudflare Pages + Workers (Recommended for Production)

**Best for**: Global distribution, edge computing, automatic scaling, serverless backend

```bash
# Frontend: Cloudflare Pages (auto-deploys)
# Backend: Cloudflare Workers (edge API)
# Database: Neon PostgreSQL (serverless)
```

**Full-Stack Architecture:**
- **Pages**: Hosts frontend React app (300+ global locations)
- **Workers**: Runs backend API at the edge (<50ms latency worldwide)
- **Combination**: Complete serverless solution with zero server management

**Deployment Steps**:
1. **Frontend (Pages)**:
   - Go to [Cloudflare Pages](https://pages.cloudflare.com)
   - Connect GitHub repository
   - Configure: `npm run build` → `dist/public`
   - Auto-deploys on git push

2. **Backend (Workers)**:
   - Install Wrangler: `npm install -g wrangler`
   - Deploy: `wrangler deploy`
   - Your API runs globally at the edge

📖 **Full Guides**: 
- [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md) - Pages setup
- [CLOUDFLARE_WORKERS_GUIDE.md](./CLOUDFLARE_WORKERS_GUIDE.md) - Workers backend

---

### 🐙 GitHub Pages (Frontend Only)

**Best for**: Demo sites, documentation, free hosting

```bash
# Automatic deployment via GitHub Actions
# Enable in: Settings → Pages → Source: GitHub Actions
```

**What Gets Deployed**: Frontend static files only  
**Backend Needed**: Separate (use Cloudflare Workers or self-hosted)

📖 **Full Guide**: [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)

---

### 🖥️ Windows Server 2025 Datacenter

**Best for**: Corporate networks, Active Directory integration, Windows ecosystem

```powershell
# Install IIS, IISNode, and Node.js 22
# Clone repository
git clone https://github.com/UniversalStandards/PROJECT-SWARM.git
cd PROJECT-SWARM

# Build
npm ci
npm run build

# Configure IIS site or use PM2
pm2 start dist/index.js --name project-swarm
```

📖 **Full Guide**: [SELF_HOSTED_DEPLOYMENT.md](./SELF_HOSTED_DEPLOYMENT.md#windows-server-2025-deployment)

---

### 🐧 Amazon Linux

**Best for**: AWS ecosystem, scalability, cost-effective cloud hosting

```bash
# Install Node.js 22, PM2, Nginx
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo yum install -y nodejs nginx
sudo npm install -g pm2

# Clone and build
git clone https://github.com/UniversalStandards/PROJECT-SWARM.git
cd PROJECT-SWARM
npm ci
npm run build

# Start with PM2
pm2 start dist/index.js --name project-swarm
pm2 save
pm2 startup systemd

# Configure Nginx reverse proxy
sudo nano /etc/nginx/conf.d/project-swarm.conf
```

📖 **Full Guide**: [SELF_HOSTED_DEPLOYMENT.md](./SELF_HOSTED_DEPLOYMENT.md#amazon-linux-deployment)

---

## Multi-Platform Strategy

### Strategy 1: Hybrid Deployment (Recommended)

Use different platforms for different purposes:

```
Production:    Cloudflare Pages + Workers (Global users)
Staging:       GitHub Pages + Cloudflare Workers (Testing)
Development:   Self-hosted (Local development)
Backup:        Amazon Linux (Failover/Regional)
```

**Benefits**:
- Global CDN performance (Cloudflare)
- Free staging environment (GitHub Pages)
- Full control and debugging (Self-hosted)
- Geographic redundancy

### Strategy 2: Full Self-Hosted

Deploy everything on your servers:

```
Primary:       Windows Server 2025 (Corporate HQ)
Secondary:     Amazon Linux (Cloud backup)
Load Balancer: AWS ELB or Azure Load Balancer
```

**Benefits**:
- Complete control and privacy
- No third-party dependencies
- Custom compliance requirements
- Integration with existing infrastructure

### Strategy 3: Cloud-First

Use managed services for everything:

```
Frontend:      Cloudflare Pages
Backend:       Cloudflare Workers
Database:      Neon PostgreSQL (serverless)
Assets:        Cloudflare R2
```

**Benefits**:
- Zero server management
- Automatic scaling
- Global distribution
- Pay-as-you-go pricing

---

## Environment Configuration

### Managing Multiple Environments

Create environment-specific `.env` files:

```bash
# .env.production (Cloudflare/Self-hosted)
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.example.com/swarm
API_URL=https://api.yourcompany.com

# .env.staging (GitHub Pages + Workers)
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db.example.com/swarm
API_URL=https://api-staging.yourcompany.com

# .env.development (Local)
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/swarm_dev
API_URL=http://localhost:3000
```

### Build-Time vs Runtime Variables

**Build-time** (bundled into frontend):
```javascript
// Access with import.meta.env
const API_URL = import.meta.env.VITE_API_URL;
```

**Runtime** (server environment):
```javascript
// Access with process.env
const DATABASE_URL = process.env.DATABASE_URL;
```

---

## Database Strategy

### Option 1: Centralized Database

One database for all deployments:

```
All Platforms → Single PostgreSQL (Neon/RDS)
```

**Pros**: Consistent data, simple management  
**Cons**: Single point of failure, latency for distant servers

### Option 2: Regional Databases

Separate databases per region/platform:

```
Cloudflare (US) → Neon US-East
Windows (EU) → Azure SQL EU-West
Amazon (APAC) → RDS AP-Southeast
```

**Pros**: Low latency, regional compliance  
**Cons**: Data synchronization complexity

### Option 3: Primary + Replicas

Master database with read replicas:

```
Write: Primary (RDS Multi-AZ)
Read: Replicas (Multiple regions)
```

**Pros**: High availability, read scalability  
**Cons**: Replication lag, higher cost

---

## Deployment Workflows

### Continuous Deployment Pipeline

```yaml
┌──────────────┐
│  Git Push    │
│   (main)     │
└──────┬───────┘
       │
       ├─────────────────────────────────────┐
       │                                     │
       ▼                                     ▼
┌──────────────┐                    ┌──────────────┐
│  Cloudflare  │                    │    GitHub    │
│    Pages     │                    │    Pages     │
│  (Auto)      │                    │   (Action)   │
└──────────────┘                    └──────────────┘
       
       Manual Deploy to Self-Hosted:
       ┌──────────────┐         ┌──────────────┐
       │   Windows    │         │   Amazon     │
       │   Server     │         │   Linux      │
       │  (Manual)    │         │  (Script)    │
       └──────────────┘         └──────────────┘
```

### Automated Deployment Script

Create `multi-deploy.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Multi-Platform Deployment"
echo "================================"

# 1. Git operations
echo "📦 Committing changes..."
git add .
git commit -m "Deploy: $(date +%Y-%m-%d_%H:%M:%S)" || true
git push origin main

echo "✅ Cloudflare Pages will auto-deploy"
echo "✅ GitHub Pages will auto-deploy"

# 2. Deploy to Amazon Linux (if SSH configured)
if [ "$DEPLOY_AWS" = "true" ]; then
    echo "🐧 Deploying to Amazon Linux..."
    ssh ec2-user@your-server.com 'cd PROJECT-SWARM && ./deploy.sh'
fi

# 3. Deploy to Windows Server (if configured)
if [ "$DEPLOY_WINDOWS" = "true" ]; then
    echo "🖥️ Deploying to Windows Server..."
    # Use PowerShell remoting or manual deployment
    echo "Manual step required for Windows"
fi

echo "================================"
echo "✅ Deployment complete!"
```

---

## Monitoring and Health Checks

### Platform-Specific Monitoring

**Cloudflare**:
- Built-in Analytics dashboard
- Real-time logs
- Performance metrics

**GitHub Pages**:
- GitHub Actions workflow status
- Traffic insights (if public)

**Self-Hosted**:
```bash
# PM2 monitoring
pm2 monit

# Custom health check endpoint
curl https://your-server.com/health
```

### Unified Monitoring

Use external monitoring service:
- **Uptime**: UptimeRobot, Pingdom
- **APM**: New Relic, Datadog
- **Logs**: LogDNA, Papertrail

---

## Load Balancing

### Geographic Load Balancing

Use DNS-based routing:

```
User Location    → Nearest Server
├─ US East       → Cloudflare (Global)
├─ Europe        → Windows Server (EU)
└─ Asia Pacific  → Amazon Linux (APAC)
```

**Tools**: Cloudflare Load Balancer, AWS Route 53, Azure Traffic Manager

### Application Load Balancing

For self-hosted deployments:

```
Internet → Load Balancer → Multiple App Servers
          (AWS ELB/ALB)    ├─ Server 1
                           ├─ Server 2
                           └─ Server 3
```

---

## Security Considerations

### SSL/TLS Certificates

| Platform | SSL Setup |
|----------|-----------|
| Cloudflare | Automatic (included) |
| GitHub Pages | Automatic (Let's Encrypt) |
| Windows Server | Manual (Let's Encrypt/Commercial) |
| Amazon Linux | Let's Encrypt via Certbot |

### Environment Variables Security

**Never commit**:
- API keys
- Database passwords
- Session secrets

**Use**:
- `.env` files (gitignored)
- Platform secret managers (Cloudflare, GitHub Secrets)
- AWS Secrets Manager / Azure Key Vault

### Firewall Rules

```bash
# Self-hosted servers
- Allow: 80/443 (HTTP/HTTPS)
- Allow: 22 (SSH) from specific IPs only
- Deny: Everything else

# Database servers
- Allow: 5432 (PostgreSQL) from app servers only
- Deny: Public access
```

---

## Cost Comparison

### Estimated Monthly Costs (assuming moderate traffic)

| Platform | Cost Range | Notes |
|----------|------------|-------|
| Cloudflare Pages | $0-20 | Free tier generous, Workers extra |
| GitHub Pages | $0 | Free for public repos |
| Windows Server | $50-200 | Server licensing + hosting |
| Amazon Linux (EC2) | $10-50 | t3.medium instance + bandwidth |
| Database (RDS) | $15-100 | db.t3.micro to db.t3.small |

**Total for Full Hybrid**: $75-370/month

---

## Troubleshooting

### Common Issues

**Issue**: Frontend loads but API calls fail
```
Solution: Check API_URL configuration and CORS settings
- Cloudflare: Configure Workers routes
- GitHub Pages: Point to external API
- Self-hosted: Check Nginx proxy configuration
```

**Issue**: Different behavior on different platforms
```
Solution: Ensure consistent environment variables
- Check NODE_ENV setting
- Verify DATABASE_URL
- Confirm API keys are set
```

**Issue**: Database connection errors
```
Solution: Check firewall and connection strings
- Whitelist all deployment server IPs
- Use connection pooling
- Verify SSL/TLS requirements
```

---

## Quick Reference Commands

### Cloudflare
```bash
# Local development
npm run dev

# Build for production
npm run build

# Deploy: git push (auto-deploys)
```

### GitHub Pages
```bash
# Enable in repository settings
# Deploys automatically on push to main
```

### Windows Server
```powershell
# IIS
iisreset

# PM2
pm2 restart project-swarm
pm2 logs
```

### Amazon Linux
```bash
# PM2
pm2 restart project-swarm
pm2 logs

# Nginx
sudo systemctl reload nginx
sudo nginx -t
```

---

## Support and Resources

- **Cloudflare**: [CLOUDFLARE_DEPLOYMENT.md](./CLOUDFLARE_DEPLOYMENT.md)
- **GitHub Pages**: [GITHUB_PAGES_DEPLOYMENT.md](./GITHUB_PAGES_DEPLOYMENT.md)
- **Self-Hosted**: [SELF_HOSTED_DEPLOYMENT.md](./SELF_HOSTED_DEPLOYMENT.md)
- **Repository**: https://github.com/UniversalStandards/PROJECT-SWARM

---

## Summary

Yes, you can deploy PROJECT-SWARM simultaneously on all three platforms! Here's the simplest approach:

1. **Primary (Production)**: Cloudflare Pages - Auto-deploys on git push
2. **Staging**: GitHub Pages - Auto-deploys frontend for testing
3. **Corporate/Private**: Windows Server 2025 - Full stack with IIS
4. **Cloud Backup**: Amazon Linux - Full stack with PM2 + Nginx

Each platform has its strengths, and you can use them together for redundancy, geographic distribution, and different use cases.

---

## Platform-Specific Feature Enhancements

Different platforms enable different features:

### Cloudflare Workers Exclusive Features
- **Edge Computing**: API runs in 300+ locations worldwide (<50ms latency)
- **Durable Objects**: Stateful edge computing for real-time collaboration
- **KV Storage**: Fast key-value cache for API responses
- **R2 Storage**: S3-compatible object storage for files
- **Workers Analytics**: Built-in performance monitoring
- **Background Jobs**: Queues for async task processing

See [CLOUDFLARE_WORKERS_GUIDE.md](./CLOUDFLARE_WORKERS_GUIDE.md) for complete Workers deployment.

### Self-Hosted Exclusive Features
- **Custom Integrations**: Full control to add any library/service
- **Internal Network Access**: Connect to internal databases/APIs
- **Compliance**: Meet specific regulatory requirements (HIPAA, SOC2)
- **Resource Control**: Dedicated CPU/memory allocation
- **Cost Predictability**: Fixed monthly costs regardless of traffic

### Recommended Feature Additions

For a comprehensive overview of features to implement, see [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) which includes:

**High Priority (Implement First):**
- Multi-user collaboration with real-time editing
- Advanced error recovery and retry logic  
- Rate limiting and cost controls
- Workflow testing and debugging tools
- Conditional logic and branching nodes
- Integration marketplace (Slack, GitHub, etc.)

**Platform-Specific Recommendations:**
- **Cloudflare**: Leverage Durable Objects for WebSocket/real-time features
- **Self-Hosted**: Add admin dashboard, user management, resource quotas
- **Hybrid**: Use Cloudflare for production, self-hosted for development/testing

📖 **Complete Feature List**: [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md)

