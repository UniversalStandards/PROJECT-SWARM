# Phase 3A Quick Start Guide

This guide helps you get started with the new Phase 3A features.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration
```bash
# Generate migrations
npx drizzle-kit generate:pg

# The server will auto-apply migrations on startup
npm run dev
```

### 3. Access New Features

#### Analytics Dashboard
- Navigate to: http://localhost:5000/app/analytics
- View: Total costs, token usage, cost by provider, recent executions

#### Workflow Versions
1. Open any workflow in the workflow builder
2. Navigate to the versions page (add button to workflow actions)
3. Create versions with commit messages
4. Restore previous versions

## 📚 Feature Guides

### Cost Tracking (Auto-enabled)
Costs are automatically tracked for every workflow execution. No configuration needed!

**View analytics:**
```bash
GET /api/analytics/costs
GET /api/analytics/costs?workflowId=workflow-123
GET /api/analytics/costs?startDate=2025-01-01&endDate=2025-01-31
```

### Workflow Versioning

**Create a version:**
```bash
POST /api/workflows/{workflowId}/versions
{
  "commitMessage": "Added data processing agent"
}
```

**List versions:**
```bash
GET /api/workflows/{workflowId}/versions
```

**Restore version:**
```bash
POST /api/workflows/{workflowId}/versions/{versionId}/restore
```

### Export/Import Workflows

**Export:**
```bash
GET /api/workflows/{workflowId}/export
# Downloads JSON file
```

**Import:**
```bash
POST /api/workflows/import
{
  "workflowData": { /* exported JSON */ },
  "mode": "new"  // or "merge" or "replace"
}
```

### Schedule Workflows (Cron)

**Create schedule:**
```bash
POST /api/workflows/{workflowId}/schedules
{
  "cronExpression": "0 9 * * *",  // Daily at 9 AM
  "timezone": "America/New_York",
  "enabled": true
}
```

**Common cron expressions:**
- `* * * * *` - Every minute (for testing)
- `0 * * * *` - Every hour
- `0 9 * * *` - Daily at 9 AM
- `0 0 * * 0` - Weekly on Sunday at midnight
- `0 0 1 * *` - Monthly on the 1st at midnight

### Webhook Triggers

**Create webhook:**
```bash
POST /api/workflows/{workflowId}/webhooks
# Returns: { id, url, secret, enabled }
```

**Trigger workflow via webhook:**
```bash
# Generate HMAC signature (example in Node.js):
const crypto = require('crypto');
const payload = JSON.stringify({ data: "test" });
const signature = crypto.createHmac('sha256', secret)
  .update(payload)
  .digest('hex');

# Send request:
POST /webhooks/{webhookUrl}
Headers:
  Content-Type: application/json
  x-webhook-signature: {signature}
Body:
  { "data": "test" }
```

**View webhook logs:**
```bash
GET /api/workflows/{workflowId}/webhooks/{webhookId}/logs
```

### Workflow Schemas (JSON Schema)

**Define input/output schema:**
```bash
POST /api/workflows/{workflowId}/schema
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "minLength": 1 },
      "limit": { "type": "number", "default": 10 }
    },
    "required": ["query"]
  },
  "outputSchema": {
    "type": "object",
    "properties": {
      "results": { "type": "array" },
      "count": { "type": "number" }
    }
  }
}
```

### Workflow Tags

**Create tag:**
```bash
POST /api/tags
{
  "name": "Production",
  "color": "#10b981"
}
```

**Add tag to workflow:**
```bash
POST /api/workflows/{workflowId}/tags
{
  "tagId": "tag-id"
}
```

**Get workflow tags:**
```bash
GET /api/workflows/{workflowId}/tags
```

## 🔧 Configuration

### Scheduler
The scheduler starts automatically when the server starts. No configuration needed!

To disable the scheduler, comment out in `server/index.ts`:
```typescript
// await scheduler.start();
```

### Webhook Security
Webhooks use HMAC-SHA256 for signature validation. The signature is calculated as:
```javascript
HMAC-SHA256(payload, secret)
```

## 🐛 Troubleshooting

### Scheduler not running workflows
1. Check cron expression is valid
2. Check schedule is enabled: `GET /api/workflows/:id/schedules`
3. Check server logs for scheduler output

### Webhook not working
1. Verify webhook is enabled
2. Check signature is correctly calculated
3. View webhook logs: `GET /api/workflows/:id/webhooks/:webhookId/logs`

### Cost data not showing
1. Execute some workflows first
2. Ensure workflows have completed successfully
3. Check `/api/analytics/costs` endpoint directly

## 📊 Monitoring

### Check Scheduler Status
Look for this log on server startup:
```
Workflow scheduler started
```

### View Scheduled Tasks
```bash
GET /api/workflows/{workflowId}/schedules
```

### View Webhook Logs
```bash
GET /api/workflows/{workflowId}/webhooks/{webhookId}/logs
```

### View Cost Analytics
```bash
GET /api/analytics/costs
```

## 🎯 Next Steps

1. **Try it out**: Create a simple workflow and schedule it to run every minute
2. **Export it**: Export your workflow to JSON and inspect the structure
3. **Add webhooks**: Create a webhook and test triggering your workflow externally
4. **Track costs**: Execute workflows and view the analytics dashboard

## 📖 Full Documentation

See `PHASE_3A_IMPLEMENTATION.md` for complete documentation including:
- Detailed API reference
- Security considerations
- File structure
- Deployment notes
- Testing recommendations

## 💡 Tips

- Use version control before making major changes to workflows
- Test cron schedules with `* * * * *` (every minute) before setting production schedules
- Monitor webhook logs to debug integration issues
- Check analytics regularly to optimize costs
- Use tags to organize workflows by environment (dev, staging, prod)
