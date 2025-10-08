# SAWRM - AI Agent Swarm Orchestrator

## Overview
SAWRM (AI Agent Swarm Orchestrator) is an enterprise-grade visual workflow platform for orchestrating AI agent swarms. It enables users to design, deploy, and monitor intelligent multi-agent workflows with drag-and-drop simplicity and real-time execution tracking.

## Project Goals
- **Visual Workflow Design**: Drag-and-drop interface using React Flow for building agent swarms
- **Multi-AI Provider Support**: Seamless integration with OpenAI, Anthropic Claude, and Google Gemini
- **Real-time Monitoring**: Live execution tracking with detailed logs and agent message visualization
- **Template Library**: Pre-built agent swarm configurations for common use cases
- **Enterprise-Ready**: Built with PostgreSQL, TypeScript, and modern web technologies

## Recent Changes
- **2024-10-08**: Initial MVP implementation complete
  - Database schema designed and deployed
  - Workflow builder with React Flow integration
  - Dashboard with stats and template library
  - AI execution engine supporting 3 providers
  - Execution monitoring with real-time updates
  - Template system with seed data

## Architecture

### Tech Stack
**Frontend:**
- React + TypeScript
- React Flow for workflow visualization
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI + Tailwind CSS for design system
- Material Design 3 + Modern SaaS aesthetics

**Backend:**
- Express.js REST API
- PostgreSQL database (Neon-backed)
- Drizzle ORM for database operations
- Multi-AI provider support:
  - OpenAI SDK
  - Anthropic SDK
  - Google Gemini SDK

### Database Schema

**Core Tables:**
- `users`: User authentication and profiles
- `workflows`: Workflow definitions with nodes and edges (JSONB)
- `agents`: Agent configurations linked to workflow nodes
- `executions`: Workflow execution records with status tracking
- `agent_messages`: Inter-agent communication logs
- `execution_logs`: Detailed execution logging
- `templates`: Pre-built workflow templates
- `assistant_chats`: AI assistant conversation history

### Key Features

#### 1. Workflow Builder (`/workflow-builder`)
- Visual drag-and-drop canvas powered by React Flow
- Custom agent nodes with role-based styling (Coordinator, Coder, Researcher, etc.)
- Real-time node configuration panel
- Support for complex agent topologies with message passing

#### 2. Dashboard (`/`)
- Quick stats: Active workflows, executions, running agents, success rate
- Recent workflows with quick access
- Featured template library
- Hero section with gradient design

#### 3. Execution Monitor (`/executions/:id`)
- Real-time execution status tracking
- Live execution logs with timestamps and severity levels
- Agent message visualization
- Output and error display

#### 4. AI Execution Engine
**Orchestrator** (`server/ai/orchestrator.ts`):
- Topological sort for workflow execution order
- Agent coordination and message passing
- Execution logging and error handling

**Executor** (`server/ai/executor.ts`):
- Provider-agnostic AI execution
- OpenAI, Anthropic, and Gemini support
- Token tracking and response handling

### Design System

**Color Palette** (Dark Mode Primary):
- Primary Cyan: `189 94% 43%` - Interactive elements, CTAs
- Primary Blue: `217 91% 60%` - Secondary actions, accents
- Deep Navy: `222 47% 11%` - Main background
- Success Green: `142 76% 36%` - Agent active states
- Warning Amber: `38 92% 50%` - Alerts
- Error Red: `0 72% 51%` - Errors

**Typography:**
- Primary: Inter (UI)
- Monospace: JetBrains Mono (code, logs)
- Display: Inter Display (headings)

**Key Components:**
- Glass-morphism cards with backdrop blur
- Gradient overlays for visual hierarchy
- Elevated hover states with smooth transitions
- Custom React Flow nodes with status indicators

### API Routes

**Workflows:**
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details
- `PATCH /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow

**Agents:**
- `GET /api/workflows/:workflowId/agents` - List workflow agents
- `POST /api/agents` - Create agent
- `PATCH /api/agents/:id` - Update agent

**Executions:**
- `GET /api/executions` - List user executions
- `POST /api/executions` - Execute workflow (triggers orchestrator)
- `GET /api/executions/:id` - Get execution details
- `GET /api/executions/:id/logs` - Get execution logs
- `GET /api/executions/:id/messages` - Get agent messages

**Templates:**
- `GET /api/templates` - List all templates
- `GET /api/templates/featured` - Featured templates
- `POST /api/templates` - Create template

### Environment Variables
```
DATABASE_URL - PostgreSQL connection string
OPENAI_API_KEY - OpenAI API key
ANTHROPIC_API_KEY - Anthropic API key
GEMINI_API_KEY - Google Gemini API key
SESSION_SECRET - Session encryption key
```

### Development Workflow

**Database Operations:**
```bash
npm run db:push        # Push schema changes
npx tsx server/seed.ts # Seed template data
```

**Running the App:**
```bash
npm run dev           # Start dev server (port 5000)
```

## User Preferences
- Design: Material Design 3 + Modern SaaS hybrid
- Theme: Dark mode primary (developer/technical tool aesthetic)
- Approach: Horizontal batching (complete features layer by layer)
- Quality: Premium frontend with attention to detail

## Future Enhancements
- [ ] WebSocket support for real-time execution updates
- [ ] Replit Auth integration for user authentication
- [ ] AI assistant chat interface
- [ ] Advanced agent capabilities (function calling, tools)
- [ ] Workflow versioning and rollback
- [ ] Collaborative editing
- [ ] Performance analytics dashboard
- [ ] Export/import workflow configurations

## File Structure
```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # Shadcn components
│   │   ├── workflow/     # Workflow-specific components
│   │   ├── app-sidebar.tsx
│   │   ├── theme-provider.tsx
│   │   └── theme-toggle.tsx
│   ├── pages/
│   │   ├── dashboard.tsx
│   │   ├── workflow-builder.tsx
│   │   ├── execution-monitor.tsx
│   │   └── not-found.tsx
│   ├── App.tsx
│   └── index.css
server/
├── ai/
│   ├── executor.ts       # AI provider execution
│   └── orchestrator.ts   # Workflow orchestration
├── db.ts                 # Database connection
├── storage.ts            # Data access layer
├── routes.ts             # API endpoints
├── seed.ts              # Database seeding
└── index.ts             # Express server
shared/
└── schema.ts            # Shared types and schemas
```

## Notes
- Mock user authentication currently in place (user ID: "mock-user-id")
- Seed data includes 3 pre-configured workflow templates
- React Flow custom nodes support dynamic status updates
- All AI executions are logged with timestamps and token counts
