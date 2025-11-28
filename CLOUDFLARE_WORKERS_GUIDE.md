# Cloudflare Workers Deployment Guide

## Overview

Cloudflare Workers is a serverless platform that runs your backend code at the edge, close to your users. This guide explains how to deploy PROJECT-SWARM's backend API to Cloudflare Workers.

## Architecture: Pages + Workers

PROJECT-SWARM can be deployed using Cloudflare's full-stack solution:

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Cloudflare Pages            Cloudflare Workers             │
│  ├─ Frontend (React SPA)     ├─ Backend (Express API)      │
│  ├─ Static assets            ├─ Serverless functions       │
│  └─ dist/public/             └─ Edge runtime               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    External Database
                    (Neon, Supabase, etc.)
```

## Key Benefits of Workers

- **Edge Computing**: Code runs on 300+ global locations
- **Low Latency**: <50ms response time worldwide
- **Auto-Scaling**: Handles traffic spikes automatically
- **Cost-Effective**: Pay only for execution time
- **Zero Config**: No server management needed
- **Instant Deploy**: Changes propagate in <30 seconds

## Prerequisites

1. Cloudflare account (free tier available)
2. Wrangler CLI installed: `npm install -g wrangler`
3. Domain connected to Cloudflare (optional but recommended)

## Setup Instructions

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

### Step 2: Configure wrangler.toml

The project includes a `wrangler.toml` file. Update it with your settings:

```toml
name = "project-swarm-api"  # Change to your preferred worker name
main = "dist/index.js"
compatibility_date = "2024-11-24"

# Workers configuration
workers_dev = true  # Use *.workers.dev subdomain for testing

[build]
command = "npm run build"

# Environment variables (use wrangler secret for sensitive data)
[vars]
NODE_ENV = "production"

# Bindings (add as needed)
# [durable_objects]
# bindings = []

# [kv_namespaces]
# binding = "KV"
# id = "your-kv-id"

# [r2_buckets]
# binding = "R2"
# bucket_name = "your-bucket"
```

### Step 3: Add Environment Variables

For sensitive data (API keys, database credentials):

```bash
# Add secrets (encrypted)
wrangler secret put DATABASE_URL
wrangler secret put OPENAI_API_KEY
wrangler secret put ANTHROPIC_API_KEY
wrangler secret put SESSION_SECRET

# Non-sensitive variables go in wrangler.toml [vars] section
```

### Step 4: Deploy to Workers

```bash
# Build the project
npm run build

# Deploy to Cloudflare Workers
wrangler deploy

# Your API will be available at:
# https://project-swarm-api.YOUR_SUBDOMAIN.workers.dev
```

## Connecting Pages and Workers

### Method 1: Custom Domain (Recommended)

1. **Setup Custom Domain for Workers:**
   ```bash
   # In Cloudflare dashboard: Workers & Pages → Your Worker → Settings → Triggers
   # Add custom domain: api.yourdomain.com
   ```

2. **Configure Frontend API URL:**
   ```typescript
   // In your frontend .env or config
   VITE_API_URL=https://api.yourdomain.com
   ```

### Method 2: Workers Route

1. **Add Route to wrangler.toml:**
   ```toml
   [[routes]]
   pattern = "yourdomain.com/api/*"
   zone_name = "yourdomain.com"
   ```

2. **Frontend calls `/api/*` endpoints** - Cloudflare automatically routes to Worker

### Method 3: Direct Workers URL

Use the workers.dev subdomain directly:
```typescript
VITE_API_URL=https://project-swarm-api.YOUR_SUBDOMAIN.workers.dev
```

## Database Configuration

### Option 1: Neon PostgreSQL (Recommended)

Neon offers serverless PostgreSQL perfect for Workers:

```bash
# Install Neon serverless driver
npm install @neondatabase/serverless

# Set connection string as secret
wrangler secret put DATABASE_URL
# Enter: postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

**Benefits:**
- Serverless (auto-scaling)
- Low latency from edge
- Connection pooling built-in
- Free tier: 0.5GB storage

### Option 2: Cloudflare D1 (SQLite at Edge)

For simpler workloads, use Cloudflare's native D1:

```bash
# Create D1 database
wrangler d1 create project-swarm-db

# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "project-swarm-db"
database_id = "your-database-id"
```

**Note**: D1 is SQLite, so you'll need to adapt from PostgreSQL schema.

### Option 3: Supabase

Alternative serverless PostgreSQL:

```bash
wrangler secret put DATABASE_URL
# Enter your Supabase connection string
```

## WebSocket Support

Cloudflare Workers supports WebSockets for real-time features:

```typescript
// In your Worker
export default {
  async fetch(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());
      
      // Handle WebSocket in Durable Object for state
      await env.WEBSOCKET_STATE.get(id).fetch(request);
      
      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }
    // Regular HTTP handling
  }
}
```

## Advanced Features

### 1. Durable Objects (Stateful Edge Computing)

Use Durable Objects for:
- Real-time collaboration
- WebSocket connections
- Workflow execution state
- Rate limiting

```toml
# In wrangler.toml
[[durable_objects.bindings]]
name = "WORKFLOW_STATE"
class_name = "WorkflowState"
script_name = "project-swarm-api"
```

### 2. KV Storage (Fast Key-Value)

Use for caching:
- API responses
- Session data
- Rate limit counters

```bash
wrangler kv:namespace create "CACHE"
```

### 3. R2 Storage (S3-Compatible)

For file storage:
- Workflow templates
- User uploads
- Export files

```bash
wrangler r2 bucket create project-swarm-files
```

### 4. Queues (Background Jobs)

For async processing:
- Scheduled workflow execution
- Email notifications
- Long-running tasks

```toml
[[queues.producers]]
binding = "WORKFLOW_QUEUE"
queue = "workflow-tasks"
```

## Monitoring and Debugging

### Real-Time Logs

```bash
# View logs in real-time
wrangler tail

# Filter by status
wrangler tail --status error

# Filter by specific endpoint
wrangler tail --header "cf-request-id:xxx"
```

### Analytics Dashboard

Access in Cloudflare dashboard:
- Request volume
- Error rates
- Response times
- Geographic distribution
- CPU usage

### Local Development

```bash
# Run Workers locally
wrangler dev

# With remote bindings (KV, D1, etc.)
wrangler dev --remote
```

## Performance Optimization

### 1. Edge Caching

```typescript
// Cache API responses
const cache = caches.default;
const cacheKey = new Request(url, request);
const cached = await cache.match(cacheKey);

if (cached) {
  return cached;
}

const response = await handleRequest(request);
await cache.put(cacheKey, response.clone());
return response;
```

### 2. Connection Pooling

```typescript
// For Neon/Supabase
import { neon } from '@neondatabase/serverless';

const sql = neon(env.DATABASE_URL, {
  fetchConnectionCache: true, // Enable connection pooling
});
```

### 3. Minimize Cold Starts

- Keep bundle size < 1MB
- Use tree-shaking (already configured in esbuild)
- Avoid large dependencies

## Limitations and Workarounds

### CPU Time Limit

**Limit**: 50ms per request (free), 30s (paid)

**Workaround**:
- Use Durable Objects for longer tasks
- Split work into multiple requests
- Use Queues for background jobs

### Memory Limit

**Limit**: 128MB per request

**Workaround**:
- Stream large responses
- Use external storage (R2) for files
- Paginate large datasets

### No Filesystem Access

**Impact**: Can't use libraries that read files

**Workaround**:
- Bundle everything at build time
- Use KV/R2 for dynamic data
- Inline small assets

## Migration from Express

PROJECT-SWARM uses Express.js. To run on Workers:

### Option 1: Use Hono (Express-like, Workers-native)

```typescript
import { Hono } from 'hono';

const app = new Hono();

app.get('/api/workflows', async (c) => {
  // Your logic
  return c.json(data);
});

export default app;
```

### Option 2: Use Workers-compatible Express

```bash
npm install @cloudflare/workers-express
```

The current Express server can be adapted with minimal changes.

## Cost Estimation

### Free Tier (Generous)
- 100,000 requests/day
- 10ms CPU time per request
- All features included

### Paid Plan ($5/month)
- 10 million requests/month
- 50ms CPU time per request
- Unmetered bandwidth

### Example Monthly Cost
For 1M requests with 10ms avg CPU time:
- Free tier covers 100K requests/day = 3M/month
- **Cost: $0** for most projects

For higher traffic:
- 10M requests/month = $5
- Add D1: $0.75/month (10GB storage)
- Add KV: $0.50/month (1GB storage)
- **Total: ~$6.25/month**

## Deployment Checklist

- [ ] `wrangler.toml` configured
- [ ] Secrets added (`wrangler secret put`)
- [ ] Database connection tested
- [ ] Environment variables set
- [ ] Custom domain configured (optional)
- [ ] Workers deployed (`wrangler deploy`)
- [ ] Frontend API URL updated
- [ ] CORS configured for frontend domain
- [ ] Monitoring/logs checked
- [ ] Test in production

## Troubleshooting

### Issue: "Module not found"
**Solution**: Ensure all imports use full paths, not Node.js aliases

### Issue: "Database connection timeout"
**Solution**: Use Neon with connection pooling, not traditional PostgreSQL

### Issue: "Request exceeded time limit"
**Solution**: Move long tasks to Durable Objects or Queues

### Issue: "CORS errors"
**Solution**: Add proper CORS headers in Worker responses

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://yourdomain.com',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Best Practices

1. **Use Secrets for Sensitive Data**: Never put API keys in wrangler.toml
2. **Enable Caching**: Cache static responses at the edge
3. **Monitor Costs**: Set up alerts in Cloudflare dashboard
4. **Test Locally**: Use `wrangler dev` before deploying
5. **Version Control**: Tag releases and use staged rollouts
6. **Geographic Routing**: Use Smart Placement for database proximity
7. **Error Handling**: Return proper HTTP status codes
8. **Logging**: Use `console.log()` for debugging (appears in `wrangler tail`)

## Example: Full Deployment Flow

```bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Test locally
wrangler dev

# 4. Add secrets
wrangler secret put DATABASE_URL
wrangler secret put OPENAI_API_KEY

# 5. Deploy to production
wrangler deploy

# 6. Check logs
wrangler tail

# 7. Update frontend API URL
# Edit .env.production
VITE_API_URL=https://api.yourdomain.com

# 8. Deploy frontend to Cloudflare Pages
git push origin main
```

## Resources

- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Workers Examples**: https://github.com/cloudflare/workers-sdk
- **D1 Database**: https://developers.cloudflare.com/d1/
- **Neon + Workers**: https://neon.tech/docs/guides/cloudflare-workers
- **Durable Objects**: https://developers.cloudflare.com/durable-objects/

## Summary

Cloudflare Workers provides:
- ✅ Global edge deployment (300+ locations)
- ✅ Auto-scaling (handle any traffic)
- ✅ Low latency (<50ms worldwide)
- ✅ Cost-effective (free tier covers most projects)
- ✅ Zero maintenance (fully managed)
- ✅ Seamless integration with Cloudflare Pages

**Recommendation**: Use Cloudflare Pages + Workers for production deployment. This combination provides the best performance, scalability, and developer experience for PROJECT-SWARM.
