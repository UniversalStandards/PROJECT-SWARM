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
- **2024-10-10**: Deployment Fix & Feature Enhancements
  - **Deployment Fix**: Resolved Vite peer dependency conflict
    - Downgraded Vite from 7.1.9 to 6.0.5 for @tailwindcss/vite@4.1.3 compatibility
    - Verified @vitejs/plugin-react 4.7.0 works with Vite 6
    - All features tested and working correctly in production
  - **AI Assistant**: Full chat interface with OpenAI integration
    - Real-time chat UI with message history and timestamps
    - Smart suggestions with 3 quick-start prompts
    - Conversation persistence in database
    - Enhanced error handling with quota management
  - **Executable Workflow Templates**: 3 production-ready templates
    - Code Generation Pipeline: Architecture → Implementation → QA
    - Research & Summary Pipeline: Research → Data gathering → Synthesis
    - Content Creation Workflow: Strategy → Writing → SEO
  - **Visual Content**: Professional stock imagery on all marketing pages
    - Landing page hero image showcasing workflow visualization
    - Features page with dashboard and analytics images
    - How It Works page with 4-step process visuals
  - **Bug Fixes**: 
    - Fixed /app routing infinite loop using navigate() instead of window.location
    - Enhanced error message parsing to show actual server responses

- **2024-10-10**: Production-Ready Website with Complete Authentication & Security
  - **Dual-Surface Architecture**: Public marketing pages (no sidebar) vs authenticated app pages (with sidebar)
  - **7 Marketing Pages**: Landing, Features, How It Works, Pricing, About, Privacy Policy, Terms of Service
  - **5 App Pages**: Workflows, Executions, Templates, AI Assistant, Settings
  - **Complete Security Implementation**:
    - All protected API routes enforce isAuthenticated middleware
    - Per-user ownership verification for all CRUD operations
    - Data isolation: users can only access/modify their own resources
    - Proper error responses: 403 Unauthorized, 404 Not Found
  - **Replit Auth Integration**: Real user authentication, session management, user profiles in sidebar
  - **End-to-End Testing**: Multi-user isolation and auth flow verified

- **2024-10-09**: Persistent Knowledge Base System
  - Implemented persistent shared knowledge base for agent swarms
  - Knowledge automatically extracted from agent responses and stored
  - Agents retrieve and leverage accumulated knowledge in subsequent executions
  - Composite index for efficient knowledge queries
  - Support for all AI providers (OpenAI, Anthropic, Gemini)
  - End-to-end tested and validated

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
- `knowledge_entries`: Persistent shared knowledge base with composite index (userId, agentType, category, confidence)

### Key Features

#### 1. Marketing Website
**Public Pages** (no authentication required):
- **Landing Page** (`/`): Hero section, feature highlights, pricing preview, CTA buttons
- **Features** (`/features`): Comprehensive feature showcase with visual hierarchy
- **How It Works** (`/how-it-works`): Step-by-step workflow explanation
- **Pricing** (`/pricing`): Three-tier pricing (Free, Pro, Enterprise)
- **About** (`/about`): Company mission, vision, team information
- **Privacy Policy** (`/privacy`): Data handling and privacy commitments
- **Terms of Service** (`/terms`): Legal terms and conditions

**PublicHeader Component**: Consistent navigation across all marketing pages with login/signup CTAs

#### 2. Application Console (Authenticated Access)
**Protected Pages** (require Replit Auth):
- **Workflows** (`/app/workflows`): List and manage user workflows, create from templates
- **Executions** (`/app/executions`): View execution history with status and timestamps
- **Templates** (`/app/templates`): Browse and use pre-built workflow templates
- **AI Assistant** (`/app/assistant`): AI-powered workflow assistance (placeholder)
- **Settings** (`/app/settings`): User profile and preferences

**AppSidebar Component**: Navigation with user profile, email, and all app pages

#### 3. Workflow Builder (`/workflow-builder`)
- Visual drag-and-drop canvas powered by React Flow
- Custom agent nodes with role-based styling (Coordinator, Coder, Researcher, etc.)
- Real-time node configuration panel
- Support for complex agent topologies with message passing

#### 4. Execution Monitor (`/executions/:id`)
- Real-time execution status tracking
- Live execution logs with timestamps and severity levels
- Agent message visualization
- Output and error display

#### 4. AI Execution Engine
**Orchestrator** (`server/ai/orchestrator.ts`):
- Topological sort for workflow execution order
- Agent coordination and message passing
- Knowledge fetching before agent execution and storage after
- Execution logging and error handling

**Executor** (`server/ai/executor.ts`):
- Provider-agnostic AI execution
- OpenAI, Anthropic, and Gemini support with model fallbacks
- Knowledge injection into system prompts
- Token tracking and response handling

#### 5. Persistent Knowledge Base
**Knowledge Management**:
- Automatic extraction of learnings from agent responses
- Pattern-based knowledge capture (code blocks, "Learned:", "Key insight:", etc.)
- Categorization by agent type and content category
- Composite index for efficient queries (userId, agentType, category, confidence)

**Knowledge Retrieval**:
- Fetches top 50 most relevant knowledge entries before agent execution
- Matches by agent type (coordinator, coder, etc.) and categories
- Orders by confidence score and recency
- Injects accumulated knowledge into agent context

**Supported Categories**:
- General, coding, research, security, database, workflow
- Coordinator agents access all categories including coding
- Knowledge shared across executions for collective intelligence

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

**Authentication:**
- `GET /api/auth/user` - Get current authenticated user (protected)
- `GET /api/login` - Initiate Replit Auth login
- `GET /api/callback` - OAuth callback handler

**Workflows (All Protected - isAuthenticated + Ownership Verification):**
- `GET /api/workflows` - List user workflows
- `POST /api/workflows` - Create workflow
- `GET /api/workflows/:id` - Get workflow details (verifies userId ownership)
- `PATCH /api/workflows/:id` - Update workflow (verifies userId ownership)
- `DELETE /api/workflows/:id` - Delete workflow (verifies userId ownership)

**Agents (All Protected - Verified via Workflow Ownership):**
- `GET /api/workflows/:workflowId/agents` - List workflow agents
- `POST /api/agents` - Create agent
- `PATCH /api/agents/:id` - Update agent

**Executions (All Protected - Verified via Workflow Ownership):**
- `GET /api/executions` - List user executions
- `POST /api/executions` - Execute workflow (triggers orchestrator)
- `GET /api/executions/:id` - Get execution details
- `PATCH /api/executions/:id` - Update execution status
- `GET /api/executions/:id/logs` - Get execution logs
- `GET /api/executions/:id/messages` - Get agent messages

**Templates (Public Resources):**
- `GET /api/templates` - List all templates (public)
- `GET /api/templates/featured` - Featured templates (public)
- `POST /api/templates` - Create template (protected)
- `POST /api/templates/:id/create-workflow` - Create workflow from template (protected)

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

## Security & Authentication
- **Replit Auth**: Complete OIDC integration with session management
- **User Isolation**: All data operations filtered by authenticated user ID (req.user.claims.sub)
- **Ownership Verification**: Every resource access/modification verifies user ownership
- **Error Handling**: 
  - 401 Unauthorized - Missing/invalid authentication
  - 403 Forbidden - User doesn't own the resource
  - 404 Not Found - Resource doesn't exist
  - 400 Bad Request - Invalid input data
- **Public Resources**: Templates and marketing pages accessible without authentication
- **Protected Routes**: All /app/* routes require authentication, redirect to login if unauthenticated

## Notes
- Seed data includes 3 pre-configured workflow templates (public resources)
- React Flow custom nodes support dynamic status updates
- All AI executions are logged with timestamps and token counts
- Multi-user data isolation verified via end-to-end testing
