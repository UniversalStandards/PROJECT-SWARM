# PROJECT-SWARM

**AI Workflow Orchestration Platform** - Build, execute, and monitor multi-agent AI workflows with visual drag-and-drop interface.

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare-orange)](./CLOUDFLARE_DEPLOYMENT.md)
[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue)](./GITHUB_PAGES_DEPLOYMENT.md)
[![Self-Hosted](https://img.shields.io/badge/Deploy-Self%20Hosted-green)](./SELF_HOSTED_DEPLOYMENT.md)

---

## 🚀 Quick Start

```bash
# Clone repository
git clone https://github.com/UniversalStandards/PROJECT-SWARM.git
cd PROJECT-SWARM

# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:5000` to access the workflow builder.

---

## ✨ Features

PROJECT-SWARM provides a complete AI workflow orchestration platform with 40+ features:

### Core Capabilities
- 🎨 **Visual Workflow Builder** - Drag-and-drop interface for creating AI agent workflows
- 🤖 **Multi-AI Provider Support** - OpenAI, Anthropic Claude, Google Gemini
- 🔄 **Workflow Orchestration** - Execute complex multi-agent workflows with context passing
- 📊 **Real-time Monitoring** - Track execution progress, logs, and metrics
- 💰 **Cost Tracking** - Monitor AI API costs by workflow, provider, and model

### Advanced Features
- ⏱️ **Scheduled Executions** - Run workflows on cron schedules
- 🪝 **Webhook Triggers** - Trigger workflows via HTTP webhooks
- 📦 **Version Control** - Git-like versioning with commit messages
- 📤 **Import/Export** - Share workflows as JSON files
- 🧪 **Testing & Debugging** - Dry runs, execution history, error tracking
- 📈 **Analytics Dashboard** - Visualize costs, usage, and performance

### Productivity
- ⌨️ **Keyboard Shortcuts** - Efficient workflow editing
- 📐 **Auto-Layout** - Hierarchical, force-directed, and grid layouts
- 🔲 **Grid Snapping** - Align nodes for clean workflows
- 🗺️ **Minimap Navigation** - Bird's-eye view of large workflows
- 🔍 **Search & Filter** - Find workflows quickly

See [WORKFLOW_BUILDER_FEATURES.md](./WORKFLOW_BUILDER_FEATURES.md) for workflow builder details and [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) for complete feature inventory.

---

## 📚 Documentation

### Deployment Guides

**Multi-Platform Deployment:**
- 📖 [**MULTI_PLATFORM_DEPLOYMENT.md**](./MULTI_PLATFORM_DEPLOYMENT.md) - Master guide for all platforms

**Platform-Specific:**
- ☁️ [**CLOUDFLARE_DEPLOYMENT.md**](./CLOUDFLARE_DEPLOYMENT.md) - Cloudflare Pages frontend deployment
- ⚡ [**CLOUDFLARE_WORKERS_GUIDE.md**](./CLOUDFLARE_WORKERS_GUIDE.md) - Cloudflare Workers backend (edge API)
- 🐙 [**GITHUB_PAGES_DEPLOYMENT.md**](./GITHUB_PAGES_DEPLOYMENT.md) - GitHub Pages static hosting
- 🖥️ [**SELF_HOSTED_DEPLOYMENT.md**](./SELF_HOSTED_DEPLOYMENT.md) - Windows Server & Amazon Linux

### Features & Roadmap
- 🗺️ [**FEATURES_ROADMAP.md**](./FEATURES_ROADMAP.md) - Current features & future roadmap (90+ total)
- 🎨 [**WORKFLOW_BUILDER_FEATURES.md**](./WORKFLOW_BUILDER_FEATURES.md) - Workflow builder capabilities

### Status & Testing
- ✅ [**DEPLOYMENT_STATUS.md**](./DEPLOYMENT_STATUS.md) - Current deployment status
- 🧪 [**TESTING.md**](./TESTING.md) - Testing guide

---

## 🌐 Deployment Options

PROJECT-SWARM can be deployed on multiple platforms simultaneously:

| Platform | Type | Auto-Deploy | Cost | Best For |
|----------|------|-------------|------|----------|
| **Cloudflare Pages + Workers** | Full-Stack | ✅ | $0-20/mo | Production (global CDN) |
| **GitHub Pages** | Frontend | ✅ | $0 | Staging/Demo |
| **Windows Server 2025** | Full-Stack | Manual | $50-200/mo | Corporate/Internal |
| **Amazon Linux (EC2)** | Full-Stack | Script | $10-50/mo | Cloud/Backup |

### Recommended: Cloudflare Pages + Workers

**Benefits:**
- ⚡ Edge computing in 300+ locations (<50ms latency worldwide)
- 📈 Auto-scaling (handles any traffic spike)
- 💰 Cost-effective (generous free tier, pay-per-use)
- 🔧 Zero maintenance (fully managed)
- 🚀 Instant deploys (<30 seconds)

**Setup:**
```bash
# 1. Frontend (Pages) - Auto-deploys on git push
git push origin main

# 2. Backend (Workers) - Deploy with Wrangler
npm install -g wrangler
wrangler login
wrangler deploy
```

See [CLOUDFLARE_WORKERS_GUIDE.md](./CLOUDFLARE_WORKERS_GUIDE.md) for complete guide.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                  PROJECT-SWARM                       │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Frontend (React + Vite)    Backend (Express API)  │
│  ├─ Workflow Builder        ├─ REST API            │
│  ├─ ReactFlow               ├─ AI Orchestration    │
│  ├─ TailwindCSS             ├─ Scheduling          │
│  └─ dist/public/            └─ dist/index.js       │
│                                                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Database: PostgreSQL (Neon, Supabase, or Self)   │
│  AI Providers: OpenAI, Anthropic, Google Gemini    │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**Tech Stack:**
- **Frontend**: React 18, TypeScript, Vite, ReactFlow, TailwindCSS
- **Backend**: Node.js 22, Express, TypeScript
- **Database**: PostgreSQL (via Drizzle ORM)
- **AI SDKs**: OpenAI, Anthropic, Google GenAI
- **Auth**: Replit Auth (extensible)

---

## 🎯 Use Cases

**Business Process Automation:**
- Customer support workflows (triage → research → response)
- Content generation pipelines (research → write → edit → publish)
- Data analysis workflows (collect → analyze → visualize → report)

**AI Development:**
- Multi-agent systems testing
- Prompt engineering workflows
- AI model comparison and evaluation

**Research & Analysis:**
- Literature review automation
- Market research pipelines
- Competitive analysis workflows

**DevOps & Monitoring:**
- Scheduled health checks
- Incident response automation
- Log analysis and alerting

---

## 🛣️ Roadmap

### Current (~40 Features Implemented)
- ✅ Visual workflow builder
- ✅ Multi-AI provider support
- ✅ Workflow versioning & history
- ✅ Scheduled executions
- ✅ Webhook triggers
- ✅ Cost tracking & analytics

### Day 1 (12-16 features, parallel development)
- 🎯 Rate limiting & error recovery (2-3 hrs each)
- 🎯 Conditional logic & loops (2-3 hrs each)
- 🎯 State management & scheduling (2-3 hrs each)
- 🎯 Multi-user collaboration & debugging (2-3 hrs each)

### Day 2 (12-16 features, parallel development)
- 🎯 Integrations: Slack, GitHub, Gmail, HTTP (2-3 hrs each)
- 🎯 Database connectors & custom SDK (2-3 hrs each)
- 🎯 AI optimization & templates (2-3 hrs each)
- 🎯 OAuth2, 2FA, mobile UI (2-3 hrs each)

### Day 3+ (Continuous, 12-16 features/day)
- 🎯 Additional integrations (parallel)
- 🎯 Advanced features (parallel)
- 🎯 Performance & security (parallel)

**Philosophy**: 2-4 hours per feature MVP, 4+ parallel tracks, 50+ core features in 3-4 days

See [FEATURES_ROADMAP.md](./FEATURES_ROADMAP.md) for complete roadmap (90+ features).

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

**Ways to contribute:**
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features via GitHub Discussions
- 📝 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repository

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

## 🔗 Links

- **Repository**: https://github.com/UniversalStandards/PROJECT-SWARM
- **Documentation**: See links above
- **Issues**: https://github.com/UniversalStandards/PROJECT-SWARM/issues
- **Discussions**: https://github.com/UniversalStandards/PROJECT-SWARM/discussions

---

## 🙏 Acknowledgments

Built with:
- [ReactFlow](https://reactflow.dev/) - Workflow visualization
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database
- [Neon](https://neon.tech/) - Serverless PostgreSQL
- [Cloudflare](https://cloudflare.com/) - Edge computing
- [OpenAI](https://openai.com/), [Anthropic](https://anthropic.com/), [Google AI](https://ai.google.dev/)

---

**Ready to build AI workflows?** 🚀

Start with: `npm install && npm run dev`

Deploy to: [Cloudflare](./CLOUDFLARE_DEPLOYMENT.md) | [GitHub Pages](./GITHUB_PAGES_DEPLOYMENT.md) | [Self-Hosted](./SELF_HOSTED_DEPLOYMENT.md)
