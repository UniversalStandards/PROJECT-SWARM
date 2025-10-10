# SWARM - Smart Workflow Automation & Repository Manager

## Overview
SWARM (Smart Workflow Automation & Repository Manager) is an enterprise-grade visual workflow platform designed for orchestrating AI agent swarms. It allows users to build, deploy, and monitor intelligent multi-agent workflows using a drag-and-drop interface, provides real-time execution tracking, and includes direct repository management. The platform aims to enable users to deploy AI agent swarms that intelligently automate workflows and manage repositories.

## User Preferences
- Design: Material Design 3 + Modern SaaS hybrid
- Theme: Dark mode primary (developer/technical tool aesthetic)
- Approach: Horizontal batching (complete features layer by layer)
- Quality: Premium frontend with attention to detail

## System Architecture

### Tech Stack
**Frontend:**
- React + TypeScript
- React Flow for workflow visualization
- Wouter for routing
- TanStack Query for data fetching
- Shadcn UI + Tailwind CSS for design system

**Backend:**
- Express.js REST API
- PostgreSQL database (Neon-backed)
- Drizzle ORM for database operations

### Core Features
1.  **Visual Workflow Design**: Drag-and-drop interface with React Flow for building agent swarms.
2.  **Multi-AI Provider Support**: Seamless integration with OpenAI, Anthropic Claude, and Google Gemini.
3.  **Real-time Monitoring**: Live execution tracking with detailed logs and agent message visualization.
4.  **Template Library**: Pre-built agent swarm configurations.
5.  **Persistent Knowledge Base**: Agents automatically extract, store, and retrieve knowledge from responses for subsequent executions, shared across all AI providers.
6.  **GitHub Integration**: Workspace-level repository access for listing, creating, and managing contents.
7.  **AI Assistant**: A full chat interface with OpenAI integration, real-time chat UI, message history, and conversation persistence.
8.  **Dual-Surface Architecture**: Public marketing pages and authenticated application console.

### System Design Choices
-   **UI/UX**: Material Design 3 + Modern SaaS aesthetics with a dark mode primary theme. Glass-morphism cards, gradient overlays, and elevated hover states are used.
-   **Authentication & Security**: Utilizes Replit Auth for user authentication and session management. All protected API routes enforce `isAuthenticated` middleware, with per-user ownership verification for all CRUD operations, ensuring data isolation.
-   **Data Architecture**: Agent updates are synced to workflow.nodes (JSONB) to prevent stale data.
-   **AI Execution Engine**: Features an Orchestrator for topological sorting of workflow execution, agent coordination, and knowledge management. An Executor provides provider-agnostic AI execution, supporting OpenAI, Anthropic, and Gemini with model fallbacks.

## External Dependencies
-   **Database**: PostgreSQL (Neon-backed)
-   **AI Providers**: OpenAI, Anthropic, Google Gemini
-   **Authentication**: Replit Auth
-   **Version Control**: GitHub API (via Replit connector)