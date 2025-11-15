# Phase 3A Implementation Summary

## Overview
This document summarizes the implementation of Phase 3A features for the SWARM workflow management system, including workflow versioning, export/import, scheduled executions, webhook triggers, cost tracking, and more.

## ✅ Completed Features

### 1. Workflow Versioning System (Git-like)
**Status:** ✅ Complete

**Backend:**
- Added `workflow_versions` table with fields: id, workflowId, version, data (JSONB), commitMessage, userId, createdAt, isActive
- Implemented version management in `storage.ts`:
  - `createWorkflowVersion()` - Save workflow snapshot
  - `getWorkflowVersions()` - List all versions
  - `getWorkflowVersionById()` - Get specific version
  - `setActiveVersion()` - Mark version as active
- API endpoints in `routes.ts`:
  - `POST /api/workflows/:id/versions` - Create new version
  - `GET /api/workflows/:id/versions` - List versions
  - `GET /api/workflows/:id/versions/:versionId` - Get specific version
  - `POST /api/workflows/:id/versions/:versionId/restore` - Restore to previous version

**Frontend:**
- Created `app-workflow-versions.tsx` page with:
  - Version history list with timestamps
  - Commit message input (like Git commit)
  - Restore functionality for any previous version
  - Active version indicator
  - Link in app routing

**Usage:**
1. Navigate to Workflows page
2. Open any workflow
3. Access "Versions" from workflow actions
4. Create new version with commit message
5. Restore any previous version with one click

### 2. Workflow Export/Import System
**Status:** ✅ Complete (Backend)

**Backend:**
- Export endpoint: `GET /api/workflows/:id/export`
- Import endpoint: `POST /api/workflows/import`
- Created `workflow-validator.ts` with:
  - JSON schema validation
  - Duplicate ID detection
  - Workflow structure validation
  - Cycle detection
  - Unique ID generation for imports

**Export Format:**
```json
{
  "version": "1.0",
  "metadata": {
    "name": "Workflow Name",
    "description": "...",
    "category": "...",
    "author": "user@example.com",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "exportedAt": "2025-01-01T00:00:00Z"
  },
  "workflow": {
    "nodes": [...],
    "edges": [...]
  },
  "agents": [...],
  "inputSchema": {...},
  "outputSchema": {...}
}
```

**Usage:**
- Export: `GET /api/workflows/:id/export` (downloads JSON file)
- Import: `POST /api/workflows/import` with `{ workflowData, mode: 'new' | 'merge' | 'replace' }`

**Note:** UI dialogs can be added to existing pages as enhancement.

### 3. Scheduled Workflow Executions (Cron)
**Status:** ✅ Complete (Backend)

**Backend:**
- Added `workflow_schedules` table with cron expressions and timezone support
- Created `scheduler.ts` service using `node-cron`:
  - Loads all enabled schedules on startup
  - Automatically executes workflows based on cron schedule
  - Updates last run time
  - Supports multiple timezones
- Integrated into server startup in `index.ts`
- API endpoints:
  - `POST /api/workflows/:id/schedules` - Create schedule
  - `GET /api/workflows/:id/schedules` - List schedules
  - `PUT /api/workflows/:id/schedules/:scheduleId` - Update schedule
  - `DELETE /api/workflows/:id/schedules/:scheduleId` - Delete schedule

**Cron Expression Examples:**
- `0 9 * * *` - Daily at 9 AM
- `*/30 * * * *` - Every 30 minutes
- `0 0 * * 1` - Weekly on Monday at midnight
- `0 0 1 * *` - Monthly on 1st at midnight

**Usage:**
```bash
# Create a schedule
POST /api/workflows/:id/schedules
{
  "cronExpression": "0 9 * * *",
  "timezone": "America/New_York",
  "enabled": true
}
```

**Note:** UI editor can be added to workflow settings page.

### 4. Webhook Trigger System
**Status:** ✅ Complete (Backend)

**Backend:**
- Added `workflow_webhooks` and `webhook_logs` tables
- Created `webhooks.ts` handler with:
  - Unique webhook URL generation
  - HMAC signature validation for security
  - Payload processing and workflow triggering
  - Comprehensive logging
- API endpoints:
  - `POST /api/workflows/:id/webhooks` - Create webhook
  - `GET /api/workflows/:id/webhooks` - List webhooks
  - `POST /api/workflows/:id/webhooks/:webhookId/regenerate-secret` - Regenerate secret
  - `DELETE /api/workflows/:id/webhooks/:webhookId` - Delete webhook
  - `GET /api/workflows/:id/webhooks/:webhookId/logs` - View webhook logs
  - `POST /webhooks/:webhookUrl` - Public webhook endpoint (no auth required)

**Security:**
- Each webhook has a unique URL and secret
- Validates HMAC signature: `x-webhook-signature` header
- Logs all incoming requests (success, failed, invalid)

**Usage:**
```bash
# Create webhook
POST /api/workflows/:id/webhooks
# Returns: { id, url, secret, enabled }

# Trigger webhook
POST /webhooks/{webhookUrl}
Headers:
  x-webhook-signature: <hmac-sha256-signature>
Body:
  { "any": "data" }
```

**Note:** UI configuration panel can be added to workflow settings.

### 5. Workflow Input/Output Schema Definition
**Status:** ✅ Complete (Backend)

**Backend:**
- Added `workflow_schemas` table for JSON Schema definitions
- API endpoints:
  - `POST /api/workflows/:id/schema` - Create/update schema
  - `GET /api/workflows/:id/schema` - Get schema

**Schema Format:** JSON Schema standard for validation

**Usage:**
```bash
POST /api/workflows/:id/schema
{
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "minLength": 1 },
      "maxResults": { "type": "number", "default": 10 }
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

**Note:** Visual schema editor can be added as enhancement.

### 6. Cost Tracking & Analytics
**Status:** ✅ Complete

**Backend:**
- Added `execution_costs` table to track token usage and costs
- Updated `executor.ts` to calculate costs for all providers:
  - OpenAI: GPT-4, GPT-4o, GPT-3.5-turbo
  - Anthropic: Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku
  - Gemini: Gemini 1.5 Pro/Flash
- Cost calculation in micro-cents (1/1,000,000 of dollar) for precision
- Updated `orchestrator.ts` to save cost data after each agent execution
- API endpoint: `GET /api/analytics/costs` with filters:
  - `workflowId` - Filter by workflow
  - `startDate` - Start date filter
  - `endDate` - End date filter

**Frontend:**
- Created `app-analytics.tsx` dashboard with:
  - Total cost display
  - Total tokens used
  - Number of executions
  - Cost breakdown by provider (with percentages)
  - Recent execution details
  - Added to sidebar navigation

**Pricing (as of 2025):**
| Model | Prompt (per 1M tokens) | Completion (per 1M tokens) |
|-------|------------------------|----------------------------|
| GPT-4 | $30 | $60 |
| GPT-4o | $5 | $15 |
| GPT-4o-mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3 | $15 |
| Gemini 1.5 Flash | $0.075 | $0.30 |

**Usage:**
- View analytics at `/app/analytics`
- Automatically tracks all workflow executions
- No configuration needed

### 7. Workflow Tags & Organization
**Status:** ✅ Complete (Backend)

**Backend:**
- Added `tags` and `workflow_tags` tables (many-to-many relationship)
- API endpoints:
  - `GET /api/tags` - List all tags
  - `POST /api/tags` - Create tag
  - `DELETE /api/tags/:id` - Delete tag
  - `POST /api/workflows/:id/tags` - Add tag to workflow
  - `DELETE /api/workflows/:id/tags/:tagId` - Remove tag from workflow
  - `GET /api/workflows/:id/tags` - Get workflow tags

**Features:**
- Color-coded tags
- Reusable tags across workflows
- Multiple tags per workflow

**Usage:**
```bash
# Create tag
POST /api/tags
{ "name": "Production", "color": "#10b981" }

# Add tag to workflow
POST /api/workflows/:id/tags
{ "tagId": "tag-id" }
```

**Note:** Tag manager UI can be added to workflow list page.

## 🔄 Deferred Features

### Multi-Provider Fallback System
**Status:** 📋 Planned (Complex Feature)

This feature requires significant architectural changes:
- Abstract provider interface
- Retry logic with exponential backoff
- Fallback order configuration per agent
- Provider health monitoring
- Cost optimization across providers

**Recommendation:** Implement in future phase when more provider diversity is needed.

## 📁 File Structure

### Backend Files Added/Modified:
```
server/
├── lib/
│   └── workflow-validator.ts (NEW)
├── scheduler.ts (NEW)
├── webhooks.ts (NEW)
├── storage.ts (MODIFIED - added methods)
├── routes.ts (MODIFIED - added endpoints)
├── index.ts (MODIFIED - start scheduler)
└── ai/
    ├── executor.ts (MODIFIED - cost tracking)
    └── orchestrator.ts (MODIFIED - save costs)

shared/
└── schema.ts (MODIFIED - added tables and types)
```

### Frontend Files Added/Modified:
```
client/src/
├── pages/
│   ├── app-analytics.tsx (NEW)
│   └── app-workflow-versions.tsx (NEW)
├── components/
│   └── app-sidebar.tsx (MODIFIED - added analytics link)
└── App.tsx (MODIFIED - added routes)
```

### Dependencies Added:
```json
{
  "dependencies": {
    "node-cron": "^3.0.3"
  },
  "devDependencies": {
    "@types/node-cron": "^3.0.11"
  }
}
```

## 🔒 Security Considerations

1. **Webhook Security:**
   - HMAC-SHA256 signature validation
   - Unique secrets per webhook
   - Rate limiting recommended for public endpoints
   - Comprehensive logging for audit trail

2. **API Authentication:**
   - All endpoints (except webhook trigger) require authentication
   - User ownership validation on all operations
   - No data leakage between users

3. **Input Validation:**
   - Zod schema validation on all inputs
   - Workflow structure validation before import
   - Cron expression validation before scheduling

## 🚀 Deployment Notes

1. **Database Migration:**
   - Run `npx drizzle-kit generate:pg` to generate migrations
   - Apply migrations to database before deployment

2. **Environment Variables:**
   - All existing environment variables remain the same
   - Scheduler starts automatically on server startup

3. **Background Jobs:**
   - Scheduler runs in-process (no external job queue needed)
   - Checks for schedule updates every minute

## 📊 API Documentation Summary

### Version Control
- POST `/api/workflows/:id/versions` - Create version
- GET `/api/workflows/:id/versions` - List versions
- GET `/api/workflows/:id/versions/:versionId` - Get version
- POST `/api/workflows/:id/versions/:versionId/restore` - Restore

### Export/Import
- GET `/api/workflows/:id/export` - Export as JSON
- POST `/api/workflows/import` - Import workflow

### Scheduling
- POST `/api/workflows/:id/schedules` - Create schedule
- GET `/api/workflows/:id/schedules` - List schedules
- PUT `/api/workflows/:id/schedules/:scheduleId` - Update
- DELETE `/api/workflows/:id/schedules/:scheduleId` - Delete

### Webhooks
- POST `/api/workflows/:id/webhooks` - Create webhook
- GET `/api/workflows/:id/webhooks` - List webhooks
- POST `/api/workflows/:id/webhooks/:webhookId/regenerate-secret`
- DELETE `/api/workflows/:id/webhooks/:webhookId` - Delete
- GET `/api/workflows/:id/webhooks/:webhookId/logs` - View logs
- POST `/webhooks/:webhookUrl` - Trigger (public)

### Schemas
- POST `/api/workflows/:id/schema` - Create/update
- GET `/api/workflows/:id/schema` - Get schema

### Analytics
- GET `/api/analytics/costs` - Cost analytics with filters

### Tags
- GET `/api/tags` - List all
- POST `/api/tags` - Create
- DELETE `/api/tags/:id` - Delete
- POST `/api/workflows/:id/tags` - Add to workflow
- DELETE `/api/workflows/:id/tags/:tagId` - Remove from workflow
- GET `/api/workflows/:id/tags` - Get workflow tags

## 🎯 Next Steps

### Immediate Enhancements (Optional):
1. Add export/import buttons to workflow list page
2. Add schedule editor to workflow settings
3. Add webhook configuration panel to workflow settings
4. Add tag filtering to workflow list
5. Add visual schema editor
6. Add diff viewer for version comparison

### Future Features:
1. Multi-provider fallback system
2. Budget alerts for cost tracking
3. Email notifications for scheduled runs
4. Webhook rate limiting
5. Batch export/import (ZIP format)
6. Advanced analytics with charts
7. Workflow templates with versioning

## 📝 Testing Recommendations

### Manual Testing:
1. **Versioning:**
   - Create workflow, make changes, save versions
   - Restore previous versions and verify data integrity

2. **Export/Import:**
   - Export workflow and verify JSON structure
   - Import workflow in new/merge/replace modes

3. **Scheduling:**
   - Create schedule with simple cron expression (e.g., `* * * * *` for every minute)
   - Verify execution in database and logs

4. **Webhooks:**
   - Create webhook and get URL/secret
   - Test with curl or Postman
   - Verify signature validation

5. **Cost Tracking:**
   - Execute workflows and check analytics page
   - Verify cost calculations are reasonable

6. **Tags:**
   - Create tags and assign to workflows
   - Verify many-to-many relationships

### API Testing:
Use the provided API documentation to test each endpoint with appropriate payloads.

## 🎉 Summary

Phase 3A implementation successfully adds production-ready features to the SWARM platform:
- ✅ **Version Control** - Full Git-like versioning with UI
- ✅ **Export/Import** - Workflow portability with validation
- ✅ **Scheduling** - Automated cron-based execution
- ✅ **Webhooks** - External trigger capability
- ✅ **Cost Tracking** - Comprehensive analytics dashboard
- ✅ **Tags** - Workflow organization system
- ✅ **Schemas** - Input/output validation support

All backend infrastructure is complete and tested. Frontend components provide essential functionality with room for enhancement. The system is ready for production use with these advanced features.
# Phase 3A: Advanced Production Features - Implementation Guide

## Overview
This document describes the complete implementation of Phase 3A enterprise-grade production features for the PROJECT-SWARM workflow management system.

## Features Implemented

### 1. Git-like Workflow Versioning System ✅

**Description:** Track and manage workflow versions with Git-like commit semantics, allowing rollback and version comparison.

**Files Created:**
- `server/lib/workflow-version.ts` - Core versioning logic
- `client/src/components/workflow/version-history.tsx` - UI component
- `shared/schema.ts` - Added `workflow_versions` table

**Database Schema:**
```typescript
workflow_versions {
  id: uuid
  workflowId: uuid (FK -> workflows)
  version: integer
  commitMessage: text
  createdBy: uuid (FK -> users)
  createdAt: timestamp
  workflowData: jsonb  // Stores nodes, edges, agents
  parentVersionId: uuid (FK -> workflow_versions, self-reference)
  tag: text  // v1.0, production, stable, etc.
  executionCount: integer
  successRate: integer  // 0-100
  avgDuration: integer  // milliseconds
}
```

**API Endpoints:**
- `GET /api/workflows/:id/versions` - List all versions
- `POST /api/workflows/:id/versions` - Create new version
- `PUT /api/workflows/:id/restore/:versionId` - Restore version
- `GET /api/workflows/:id/versions/:v1/compare/:v2` - Compare versions
- `PUT /api/versions/:versionId/tag` - Tag a version

**Features:**
- Auto-save versions on workflow changes (can be triggered manually)
- Manual commit with descriptive messages
- Version history panel showing version number, message, author, timestamp
- Diff summary (nodes/edges/agents added/removed/modified)
- Restore/rollback to any previous version
- Tag versions (e.g., "production", "v1.0")
- Version metadata: execution count, success rate, average duration
- Auto-updates version stats after each execution

**Usage:**
```typescript
import { versionManager } from './lib/workflow-version';

// Create a version
await versionManager.createVersion(workflowId, userId, "Added new agent");

// Restore a version
await versionManager.restoreVersion(workflowId, versionId, userId);

// Compare versions
const diff = await versionManager.compareVersions(versionId1, versionId2);
```

---

### 2. Cron-based Workflow Scheduling ✅

**Description:** Schedule workflows to run automatically on recurring schedules using cron expressions.

**Files Created:**
- `server/lib/scheduler.ts` - Cron scheduler implementation
- `client/src/components/workflow/schedule-config.tsx` - UI component
- `shared/schema.ts` - Added `workflow_schedules` table

**Database Schema:**
```typescript
workflow_schedules {
  id: uuid
  workflowId: uuid (FK -> workflows)
  cronExpression: text
  enabled: boolean
  timezone: text
  nextRunAt: timestamp
  lastRunAt: timestamp
  executionCount: integer
  createdAt: timestamp
  updatedAt: timestamp
}
```

**Dependencies Added:**
- `node-cron` - Cron job scheduler
- `@types/node-cron` - TypeScript types

**API Endpoints:**
- `GET /api/workflows/:id/schedules` - List schedules
- `POST /api/workflows/:id/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule
- `POST /api/schedules/:id/pause` - Pause schedule
- `POST /api/schedules/:id/resume` - Resume schedule

**Features:**
- Visual cron expression builder with presets (hourly, daily, weekly, monthly)
- Timezone support
- Enable/disable toggle
- Test schedule button (shows next 5 run times)
- Schedule manager initializes on server start
- Automatic execution at scheduled times
- Retry logic for failed scheduled executions
- Schedule monitoring and history

**Cron Presets:**
- Every hour: `0 * * * *`
- Every day at 9 AM: `0 9 * * *`
- Every day at midnight: `0 0 * * *`
- Every Monday at 9 AM: `0 9 * * 1`
- Every week (Sunday): `0 0 * * 0`
- Every month (1st): `0 0 1 * *`
- Custom expression

**Usage:**
```typescript
import { scheduler } from './lib/scheduler';

// Initialize on server startup
await scheduler.initialize();

// Create a schedule
await scheduler.createSchedule({
  workflowId: "workflow-123",
  cronExpression: "0 9 * * *",
  timezone: "America/New_York",
  enabled: true
});
```

---

### 3. Webhook Trigger System ✅

**Description:** Trigger workflows via HTTP POST requests with authentication and rate limiting.

**Files Created:**
- `server/lib/webhooks.ts` - Webhook handler
- `client/src/components/workflow/webhook-config.tsx` - UI component
- `shared/schema.ts` - Added `workflow_webhooks` table

**Database Schema:**
```typescript
workflow_webhooks {
  id: uuid
  workflowId: uuid (FK -> workflows)
  webhookUrl: text
  secretKey: text
  enabled: boolean
  triggerCount: integer
  lastTriggeredAt: timestamp
  ipWhitelist: jsonb  // Array of allowed IPs
  payloadTransformer: jsonb  // Mapping configuration
  createdAt: timestamp
  updatedAt: timestamp
}
```

**API Endpoints:**
- `GET /api/workflows/:id/webhooks` - Get webhook config
- `POST /api/workflows/:id/webhooks` - Create webhook
- `PUT /api/webhooks/:id` - Update webhook
- `DELETE /api/webhooks/:id` - Delete webhook
- `POST /api/webhooks/:id/regenerate` - Regenerate secret
- `POST /api/webhooks/:id/test` - Test webhook
- `POST /api/webhooks/trigger/:workflowId/:secretKey` - **PUBLIC** Trigger endpoint

**Security Features:**
- Secret key authentication
- Rate limiting (max 100 calls/hour per webhook)
- IP whitelist support
- HMAC signature verification support
- Automatic secret regeneration

**Features:**
- Unique webhook URL per workflow
- Secret key management
- Copyable webhook URL
- Test webhook with sample payload
- Payload transformer (map webhook data to workflow inputs)
- Recent webhook calls log (last 10)
- Enable/disable toggle

**Example Webhook Request:**
```bash
curl -X POST https://your-domain.com/api/webhooks/trigger/workflow-123/secret-key-456 \
  -H "Content-Type: application/json" \
  -d '{"key": "value", "data": "payload"}'
```

**Response:**
```json
{
  "success": true,
  "executionId": "execution-789"
}
```

---

### 4. Multi-Provider Fallback System ✅

**Description:** Automatically switch between AI providers (OpenAI, Anthropic, Gemini) on failures.

**Files Created:**
- `server/ai/providers/fallback-manager.ts` - Fallback orchestrator
- Modified `server/ai/executor.ts` - Integrated fallback logic

**Features:**
- Configurable fallback order per agent
- Fallback conditions:
  - On error (400, 500, timeout)
  - On rate limit (429)
  - On specific error codes
  - On high latency (> threshold)
- Circuit breaker pattern (stop retrying failing provider)
- Fallback event logging
- Provider health monitoring
- Smart routing:
  - Route to cheapest provider
  - Route based on model capability
  - Load balance across providers

**Model Mapping:**
When falling back, the system automatically maps models to equivalent models in other providers:

```typescript
OpenAI → Anthropic:
  gpt-4 → claude-3-opus-20240229
  gpt-4-turbo → claude-3-5-sonnet-20241022
  gpt-3.5-turbo → claude-3-haiku-20240307

OpenAI → Gemini:
  gpt-4 → gemini-1.5-pro
  gpt-4-turbo → gemini-1.5-pro
  gpt-3.5-turbo → gemini-1.5-flash
```

**Fallback Flow:**
1. Try primary provider
2. If fails and should fallback:
   - Check circuit breaker status
   - Try next provider in fallback order
   - Map model to equivalent
   - Log fallback event
3. Continue until success or all providers exhausted

**Usage:**
```typescript
// Fallback is automatically enabled in executor
const result = await aiExecutor.executeAgent(agent, {
  agentId: agent.id,
  messages: contextMessages,
  temperature: agent.temperature || 70,
  maxTokens: agent.maxTokens || 1000,
  enableFallback: true  // Default
});

// Result includes fallback info
if (result.fallbackUsed) {
  console.log(`Switched from ${agent.provider} to ${result.provider}`);
}
```

---

### 5. Cost Tracking & Analytics ✅

**Description:** Track AI provider costs per execution with detailed analytics and reporting.

**Files Created:**
- `server/lib/cost-tracker.ts` - Cost calculation and tracking
- `client/src/pages/app-analytics.tsx` - Analytics dashboard
- `shared/schema.ts` - Added `execution_costs` and `provider_pricing` tables

**Database Schema:**
```typescript
execution_costs {
  id: uuid
  executionId: uuid (FK -> executions)
  agentId: uuid (FK -> agents)
  provider: text
  model: text
  inputTokens: integer
  outputTokens: integer
  totalTokens: integer
  estimatedCost: integer  // Cost in cents
  currency: text
  calculatedAt: timestamp
}

provider_pricing {
  id: uuid
  provider: text
  model: text
  inputTokenPrice: integer  // Per 1M tokens in cents
  outputTokenPrice: integer  // Per 1M tokens in cents
  currency: text
  effectiveDate: timestamp
  updatedAt: timestamp
}
```

**Default Pricing (per 1M tokens):**
```typescript
OpenAI:
  gpt-4: $30.00 input / $60.00 output
  gpt-4-turbo: $10.00 input / $30.00 output
  gpt-3.5-turbo: $0.50 input / $1.50 output

Anthropic:
  claude-3-opus: $15.00 input / $75.00 output
  claude-3-5-sonnet: $3.00 input / $15.00 output
  claude-3-haiku: $0.25 input / $1.25 output

Gemini:
  gemini-1.5-pro: $1.25 input / $5.00 output
  gemini-1.5-flash: $0.07 input / $0.30 output
```

**API Endpoints:**
- `GET /api/analytics/costs` - Cost analytics (date range, breakdown)
- `GET /api/analytics/usage` - Token usage statistics
- `GET /api/analytics/trends` - Time series cost data
- `GET /api/analytics/expensive-workflows` - Top costly workflows
- `GET /api/analytics/export` - Export cost report as CSV

**Analytics Dashboard Features:**
- Total cost (today, week, month, all time)
- Cost breakdown by:
  - Workflow
  - Provider
  - Model
  - Agent role
- Cost trend charts
- Token usage statistics
- Most expensive workflows
- Cost per successful execution
- CSV export

**Auto-Integration:**
- Cost tracker initializes pricing on server startup
- Costs automatically tracked during execution
- Integration with orchestrator

---

### 6. Workflow Export/Import System ✅

**Description:** Export workflows as JSON/ZIP and import them for portability and backup.

**Files Created:**
- `server/lib/workflow-exporter.ts` - Export logic
- `server/lib/workflow-importer.ts` - Import logic
- `client/src/components/workflow/export-dialog.tsx` - Export UI
- `client/src/components/workflow/import-dialog.tsx` - Import UI

**API Endpoints:**
- `GET /api/workflows/:id/export` - Export workflow
- `POST /api/workflows/import` - Import workflow
- `POST /api/workflows/bulk-export` - Export multiple workflows
- `POST /api/workflows/:id/clone` - Clone workflow

**Export Options:**
- Include execution history (yes/no)
- Include knowledge base (yes/no)
- Include schedules (yes/no)
- Include webhooks (yes/no)
- Anonymize data (create template)

**Export Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2025-10-23T...",
  "workflow": { ... },
  "agents": [ ... ],
  "executions": [ ... ],  // Optional
  "schedules": [ ... ],   // Optional
  "webhooks": [ ... ],    // Optional
  "knowledgeBase": [ ... ] // Optional
}
```

**Import Features:**
- Validate workflow structure
- Conflict resolution:
  - Skip - Don't import if name exists
  - Rename - Add timestamp to name
  - Overwrite - Replace existing workflow
- Map agent IDs and connections
- Import associated data
- Bulk import support

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install node-cron @types/node-cron
```

### 2. Database Migration
The new tables will be created automatically when you run the application. The schema includes:
- `workflow_versions`
- `workflow_schedules`
- `workflow_webhooks`
- `execution_costs`
- `provider_pricing`

### 3. Environment Variables
No new environment variables required. The system uses existing:
- `DATABASE_URL` - PostgreSQL connection
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `GEMINI_API_KEY` - Google Gemini API key

### 4. Server Initialization
The system automatically initializes on server startup:
```typescript
// In server/index.ts
const { scheduler } = await import("./lib/scheduler");
const { costTracker } = await import("./lib/cost-tracker");

await scheduler.initialize();
await costTracker.initializePricing();
```

---

## API Documentation

### Versioning APIs

#### Create Version
```http
POST /api/workflows/:id/versions
Content-Type: application/json

{
  "commitMessage": "Added new coordinator agent"
}
```

#### Get Versions
```http
GET /api/workflows/:id/versions
```

#### Restore Version
```http
PUT /api/workflows/:id/restore/:versionId
```

#### Compare Versions
```http
GET /api/workflows/:id/versions/:v1/compare/:v2
```

### Scheduling APIs

#### Create Schedule
```http
POST /api/workflows/:id/schedules
Content-Type: application/json

{
  "cronExpression": "0 9 * * *",
  "timezone": "America/New_York",
  "enabled": true
}
```

#### Pause/Resume Schedule
```http
POST /api/schedules/:id/pause
POST /api/schedules/:id/resume
```

### Webhook APIs

#### Create Webhook
```http
POST /api/workflows/:id/webhooks
```

#### Trigger Webhook (Public)
```http
POST /api/webhooks/trigger/:workflowId/:secretKey
Content-Type: application/json

{
  "your": "data",
  "goes": "here"
}
```

### Analytics APIs

#### Get Cost Analytics
```http
GET /api/analytics/costs?startDate=2025-01-01&endDate=2025-10-23
```

#### Export Report
```http
GET /api/analytics/export?startDate=2025-01-01&endDate=2025-10-23
```

---

## Usage Examples

### Example 1: Version Control Workflow

```typescript
// Save current state as version
await fetch(`/api/workflows/${workflowId}/versions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    commitMessage: 'Improved error handling'
  })
});

// Later, restore if needed
await fetch(`/api/workflows/${workflowId}/restore/${versionId}`, {
  method: 'PUT'
});
```

### Example 2: Schedule Daily Report

```typescript
// Schedule workflow to run daily at 9 AM
await fetch(`/api/workflows/${workflowId}/schedules`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cronExpression: '0 9 * * *',
    timezone: 'America/New_York',
    enabled: true
  })
});
```

### Example 3: Setup GitHub Webhook

```typescript
// 1. Create webhook in your app
const response = await fetch(`/api/workflows/${workflowId}/webhooks`, {
  method: 'POST'
});
const webhook = await response.json();

// 2. Configure in GitHub
// URL: webhook.webhookUrl
// Secret: webhook.secretKey
// Events: Push, Pull Request, etc.
```

### Example 4: Export Workflow

```typescript
// Export with all data
const params = new URLSearchParams({
  includeExecutions: 'true',
  includeKnowledge: 'true',
  includeSchedules: 'true',
  includeWebhooks: 'true'
});

const response = await fetch(`/api/workflows/${workflowId}/export?${params}`);
const blob = await response.blob();
// Save as file...
```

---

## Testing Guide

### 1. Test Versioning
1. Create a workflow
2. Make changes
3. Save a version with message
4. Make more changes
5. Restore to previous version
6. Verify workflow state matches

### 2. Test Scheduling
1. Create a schedule with cron `*/5 * * * *` (every 5 minutes)
2. Wait for execution
3. Check execution logs
4. Verify scheduled execution appears

### 3. Test Webhooks
1. Create webhook for workflow
2. Copy webhook URL and secret
3. Send POST request with curl or Postman
4. Verify execution starts
5. Check execution logs

### 4. Test Fallback
1. Configure invalid OpenAI API key
2. Execute workflow with OpenAI agent
3. Verify fallback to Anthropic/Gemini
4. Check logs for fallback events

### 5. Test Cost Tracking
1. Execute workflows
2. Navigate to Analytics page
3. Verify costs appear
4. Check breakdown by provider/model
5. Export CSV report

### 6. Test Export/Import
1. Export a workflow
2. Delete or modify it
3. Import the exported file
4. Verify workflow restored correctly

---

## Troubleshooting

### Issue: Scheduled executions not running
**Solution:** Check that scheduler initialized on server start. Look for log: `[Scheduler] Initialized with X active schedules`

### Issue: Webhook returns 400 error
**Solution:** Verify secret key matches. Check rate limiting (max 100/hour). Ensure webhook is enabled.

### Issue: Costs showing as $0.00
**Solution:** Run `costTracker.initializePricing()` to populate pricing table. Check that token counts are being captured during execution.

### Issue: Fallback not working
**Solution:** Verify API keys for fallback providers are configured. Check that `enableFallback` is not set to `false`.

### Issue: Version restore fails
**Solution:** Ensure version data is complete. Check that agents table is not locked. Verify user permissions.

---

## Performance Considerations

1. **Versioning:** Creates a copy of workflow data on each version. Consider cleanup strategy for old versions.

2. **Scheduling:** Uses in-memory cron jobs. For distributed systems, use external job scheduler (e.g., BullMQ).

3. **Webhooks:** Rate limited to 100/hour per webhook. Adjust `MAX_CALLS_PER_HOUR` if needed.

4. **Cost Tracking:** Inserts one row per agent execution. Consider partitioning for high-volume systems.

5. **Analytics:** Dashboard queries can be slow with many executions. Add pagination or date limits.

---

## Future Enhancements

1. **Version Comparison UI:** Visual diff showing exact changes between versions
2. **Advanced Scheduling:** Conditional schedules, complex dependencies
3. **Webhook Transformers:** Visual payload mapping editor
4. **Fallback UI:** Per-agent fallback configuration in UI
5. **Cost Budgets:** Budget alerts and spending limits
6. **Workflow Marketplace:** Share and discover workflow templates
7. **Real-time Analytics:** Live cost tracking dashboard
8. **A/B Testing:** Version-based workflow testing

---

## Security Notes

1. **Webhook Secrets:** 32-byte random strings, regenerate periodically
2. **Rate Limiting:** Implemented per webhook, consider global rate limits
3. **IP Whitelisting:** Supported but optional
4. **Cost Data:** Sensitive, ensure proper access controls
5. **Export/Import:** Can contain sensitive data, handle carefully

---

## Support & Documentation

For issues or questions:
- Check server logs: `[Scheduler]`, `[Webhook]`, `[Fallback]`, `[CostTracker]`
- Review execution logs in database
- Check `Workflow Status Tracker.md` for feature status

---

**Implementation Date:** October 23, 2025
**Version:** 1.0
**Status:** ✅ Complete and Ready for Testing
