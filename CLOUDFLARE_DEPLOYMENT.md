# Cloudflare Deployment Guide

## Overview

PROJECT-SWARM is a full-stack application with two components:

1. **Frontend (React SPA)** - Can be deployed to Cloudflare Pages
2. **Backend (Express.js API)** - Requires a Node.js runtime and should be deployed to a compatible platform

### Important Architecture Note

The backend server uses Node.js-specific features that are **not compatible** with Cloudflare Workers runtime:
- `express` framework
- `http.createServer()` for HTTP server
- `ws` WebSocket library
- Node.js `crypto` module
- Session management with `express-session`

For full-stack deployment, you should:
- Deploy the **frontend** to Cloudflare Pages
- Deploy the **backend** to a Node.js-compatible platform (e.g., Railway, Render, Fly.io, or self-hosted)

---

## Cloudflare Pages - Frontend Deployment

### Build Settings

Configure these settings in your Cloudflare Pages dashboard:

### Framework preset
- **Framework**: None (or Node.js)

### Build settings
- **Build command**: `npm run build`
- **Build output directory**: `dist/public`
- **Root directory**: `/` (leave empty or set to repository root)

### Environment variables
Set the following environment variables in Cloudflare Pages dashboard:
- `NODE_VERSION`: `22` (or the version specified in package.json engines)
- `VITE_API_URL`: URL to your backend API (e.g., `https://your-backend.railway.app`)
- Any other required environment variables for your application

## Important Notes

1. **package-lock.json**: This file MUST be committed to the repository. Cloudflare Pages uses `npm ci` which requires this file.

2. **Build directory**: Ensure the build output directory matches the vite.config.ts output directory (`dist/public`).

3. **Node version**: The project uses Node.js 22.x. Make sure this is set in Cloudflare Pages.

4. **Backend deployment**: The Express.js backend cannot run on Cloudflare Workers. See the backend deployment options below.

## Backend Deployment Options

Since the backend uses Node.js-specific APIs, deploy it to one of these platforms:

### Option 1: Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Option 2: Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `npm install && npm run build`
4. Set start command: `npm run start`

### Option 3: Fly.io
```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Deploy
flyctl launch
flyctl deploy
```

## Troubleshooting

### Error: "npm ci can only install with an existing package-lock.json"

**Cause**: The build is running in a directory that doesn't contain package-lock.json, or the file is not committed to git.

**Solutions**:
1. Verify package-lock.json is committed: `git ls-files package-lock.json`
2. Ensure "Root directory" in Cloudflare Pages is set to `/` (repository root)
3. Check that package-lock.json has lockfileVersion >= 1 (currently v3)

### Build fails after npm install

**Cause**: Dependencies might have vulnerabilities or compatibility issues.

**Solution**: Review npm audit output and update dependencies if needed.

### Cloudflare Workers deployment fails

**Cause**: The Express.js server is not compatible with Cloudflare Workers runtime.

**Solution**: 
- Deploy only the frontend to Cloudflare Pages
- Deploy the backend to a Node.js-compatible platform (see Backend Deployment Options above)
- Update your frontend configuration to point to the backend API URL
