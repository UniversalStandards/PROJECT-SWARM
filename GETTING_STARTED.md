# Getting Started with SWARM Project Board

Welcome! This guide will help you quickly set up the complete project management system and start working on SWARM features.

## What's Been Set Up

This repository now includes a complete project management system with:

✅ **32 documented issues** covering all missing features  
✅ **7 workflow groups** for parallel development  
✅ **50+ GitHub labels** for organization  
✅ **3 automation workflows** for issue management  
✅ **Automated scripts** for setup  
✅ **Sprint planning** and roadmap  
✅ **Best practices** documentation  

## 🚀 5-Minute Setup

### Step 1: Create Labels (1 minute)

```bash
# Make sure you're in the repository root
cd /home/runner/work/PROJECT-SWARM/PROJECT-SWARM

# Create all labels
./scripts/create-labels.sh
```

**What this does**: Creates 50+ labels for organizing issues by priority, category, and group.

### Step 2: Preview Issues (1 minute)

```bash
# See what issues will be created
node scripts/generate-issues.js --dry-run
```

**What this does**: Shows you all 20 issues that will be created without actually creating them.

### Step 3: Create Issues (2 minutes)

```bash
# Create all issues
node scripts/generate-issues.js
```

**What this does**: Creates all issues in GitHub with proper labels, task lists, and descriptions.

### Step 4: Set Up Project Board (1 minute)

1. Go to: https://github.com/Universal-Standard/PROJECT-SWARM/projects
2. Click **"New project"**
3. Select **"Board"** layout
4. Name it: **"SWARM Development Board"**
5. Click **"Create project"**

### Step 5: Add Issues to Board (Manual)

In your new project board:
1. Click **"Add items"** (+ icon)
2. Type `/` to search
3. Search by label: `label:critical` to start
4. Select all issues and click **"Add selected"**
5. Repeat for other priority levels

---

## 📋 What You Get

### Issue Organization

**By Priority:**
- 🔴 **Critical (5 issues)** - Security and core functionality
- 🟡 **High (5 issues)** - Essential MVP features
- 🟢 **Medium (7 issues)** - Important UX improvements
- ⚪ **Low (3 issues)** - Nice-to-have enhancements

**By Group (for parallel work):**
- **Group A**: Core Functionality (3 issues) - Can work in parallel
- **Group B**: Auth & Security (2 issues) - Must be sequential
- **Group C**: Monitoring (2 issues) - Must be sequential
- **Group D**: Knowledge & Templates (2 issues) - Can work in parallel
- **Group E**: UX Improvements (7 issues) - Can work in parallel
- **Group F**: Advanced Features (4 issues) - After core is done
- **Group G**: Future (12 issues) - Backlog

### Automation Workflows

**1. Auto-Assign Issues** (`.github/workflows/auto-assign-issues.yml`)
- Automatically adds new issues to your project board
- Triggers when issues are created or labeled

**2. Issue Triage** (`.github/workflows/issue-triage.yml`)
- Auto-labels issues based on title and content
- Detects keywords like "security", "bug", "execution", etc.

**3. Parallel Agent Workflow** (`.github/workflows/parallel-agent-workflow.yml`)
- Enables parallel processing of issue groups
- Can be triggered manually or by labels

---

## 🎯 Development Workflow

### Starting Work on an Issue

1. **Find an issue** on the project board
2. **Assign yourself** to the issue
3. **Add label**: `in-progress`
4. **Create branch**:
   ```bash
   git checkout -b feature/<issue-number>-description
   # Example: git checkout -b feature/2-execution-engine
   ```

### Making Changes

1. **Make your changes** following design guidelines
2. **Write tests** for new functionality
3. **Commit regularly** with good messages:
   ```bash
   git commit -m "feat(#2): Add topological sorting to orchestrator
   
   - Implement graph traversal
   - Add cycle detection
   - Test with complex workflows
   
   Part of #2"
   ```

### Creating Pull Request

1. **Push your branch**:
   ```bash
   git push origin feature/2-execution-engine
   ```

2. **Open PR** on GitHub with:
   - Title: "Fix: [#2] Test and Fix Workflow Execution Engine"
   - Description: "Closes #2" (this will auto-close the issue when merged)
   - Checklist of completed tasks
   - Screenshots if UI changes

3. **Add label**: `needs-review`

4. **Request review** from team members

### After Merge

- Issue automatically closes
- Board automatically updates
- On to the next issue!

---

## 📅 Sprint Planning

### Recommended 4-Sprint Plan

**Sprint 1: Foundation (2 weeks)**
```
Priority: Critical + High
Focus: Groups A & B
Issues: #1, #2, #4, #5
Goal: Core execution working, security fixed
```

**Sprint 2: Intelligence (2 weeks)**
```
Priority: High
Focus: Groups C & D  
Issues: #3, #6, #7, #8, #9
Goal: Monitoring, knowledge, templates working
```

**Sprint 3: Polish (2 weeks)**
```
Priority: Medium
Focus: Group E
Issues: #11-17
Goal: Great UX, easy onboarding
```

**Sprint 4: Professional (2 weeks)**
```
Priority: Medium
Focus: Group F
Issues: #10, #18, #19, #20
Goal: Advanced features, competitive edge
```

### Sprint Planning Meeting

**Agenda** (1 hour):
1. Review previous sprint (15 min)
2. Select issues for next sprint (20 min)
3. Break down tasks (15 min)
4. Assign issues (10 min)

**Daily Standup** (15 min):
1. What did you do yesterday?
2. What will you do today?
3. Any blockers?

**Sprint Review** (1 hour):
1. Demo completed work
2. Get stakeholder feedback
3. Update product backlog

**Sprint Retrospective** (45 min):
1. What went well?
2. What could improve?
3. Action items for next sprint

---

## 🤝 Parallel Development

### For Multiple Developers

**Group A (Core) - 3 developers**
- Developer 1: Issue #2 (Execution Engine)
- Developer 2: Issue #4 (Validation)
- Developer 3: Issue #5 (Error Handling)
- **Sync**: Daily standup required

**Group E (UX) - 7 developers**
- Each developer takes one issue
- Can work completely independently
- **Sync**: Weekly check-in sufficient

**Groups B & C - Sequential**
- One developer per group
- Cannot parallelize within group
- Can parallelize between groups

### For AI Agents

Use the parallel workflow to trigger multiple agents:

```bash
# Trigger Group A agents (parallel)
gh workflow run parallel-agent-workflow.yml -f issue_group=group-a-core

# Trigger Group E agents (parallel)  
gh workflow run parallel-agent-workflow.yml -f issue_group=group-e-ux
```

Or add group labels to issues to trigger automatically.

---

## 📚 Key Documents

Must read before starting:

1. **[README_PROJECT_MANAGEMENT.md](./README_PROJECT_MANAGEMENT.md)**
   - Quick reference for everything
   - Common commands
   - Best practices

2. **[PROJECT_BOARD.md](./PROJECT_BOARD.md)**
   - Complete breakdown of all 32 issues
   - Detailed task lists
   - Dependencies and estimates

3. **[PROJECT_BOARD_SETUP.md](./PROJECT_BOARD_SETUP.md)**
   - Detailed setup instructions
   - Troubleshooting guide
   - Configuration options

4. **[design_guidelines.md](./design_guidelines.md)**
   - UI/UX standards
   - Component library
   - Design patterns

5. **[replit.md](./replit.md)**
   - System architecture
   - Tech stack
   - Core features

---

## 🛠️ Useful Commands

### Issue Management

```bash
# List all issues
gh issue list

# List by priority
gh issue list --label "critical"
gh issue list --label "high"

# List by group
gh issue list --label "group-a-core"
gh issue list --label "group-e-ux"

# List by status
gh issue list --label "in-progress"
gh issue list --label "blocked"

# View issue details
gh issue view 2

# Update issue status
gh issue edit 2 --add-label "in-progress"
gh issue edit 2 --add-label "needs-review"

# Close issue
gh issue close 2 --comment "Fixed in PR #123"
```

### Workflow Management

```bash
# List workflows
gh workflow list

# Run a workflow
gh workflow run parallel-agent-workflow.yml -f issue_group=group-a-core

# View workflow runs
gh run list

# View run details
gh run view 123
```

### Project Management

```bash
# View projects
gh project list --owner Universal-Standard

# View project items
gh project item-list 1 --owner Universal-Standard

# Add issue to project
gh project item-add 1 --owner Universal-Standard --url https://github.com/.../issues/2
```

---

## 🐛 Troubleshooting

### "gh: command not found"

**Solution**: Install GitHub CLI
```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux - see https://github.com/cli/cli/blob/trunk/docs/install_linux.md
```

### "not authenticated"

**Solution**: Authenticate with GitHub
```bash
gh auth login
```

### "permission denied" for scripts

**Solution**: Make scripts executable
```bash
chmod +x scripts/create-labels.sh
chmod +x scripts/generate-issues.js
```

### Labels not creating

**Solution**: Check authentication and rate limits
```bash
gh auth status
gh api rate_limit
```

### Issues already exist

**Solution**: The script will error if issues with same titles exist. Either:
1. Delete existing issues first
2. Manually create remaining issues
3. Modify the script to skip existing ones

---

## 🎓 Learning Resources

### Understanding the Codebase

1. Start with **replit.md** for architecture overview
2. Read **design_guidelines.md** for UI patterns
3. Look at **shared/schema.ts** for database structure
4. Review **server/routes.ts** for API endpoints

### Understanding React Flow

- Official docs: https://reactflow.dev/
- Used for workflow builder UI
- See **client/src/pages/workflow-builder.tsx**

### Understanding the Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Express + PostgreSQL + Drizzle ORM
- **UI**: Shadcn + Tailwind CSS + Radix UI
- **State**: TanStack Query
- **Routing**: Wouter

---

## ✅ Success Criteria

You'll know you're set up correctly when:

- ✅ All labels are created (run `gh label list`)
- ✅ All issues are created (run `gh issue list`)
- ✅ Project board exists with all issues
- ✅ Workflows are enabled (check Actions tab)
- ✅ You can see issues organized by group/priority
- ✅ You're ready to start development!

---

## 🚦 Ready to Start?

Pick your first issue:

**New to the codebase?** Start with Group E (UX):
- Issue #17: Improve Loading States (easiest)
- Issue #12: Agent Configuration Panel
- Issue #14: Settings Page

**Experienced developer?** Tackle Group A (Core):
- Issue #4: Workflow Validation
- Issue #5: Error Handling
- Issue #2: Execution Engine (most complex)

**Security focused?** Start with Group B:
- Issue #1: Per-User GitHub Auth

**UI/UX designer?** Group E is all yours:
- Issues #11-17 are all UI improvements

---

## 💬 Questions?

- Check **PROJECT_BOARD_SETUP.md** for detailed setup help
- Review **README_PROJECT_MANAGEMENT.md** for workflow questions
- Open a discussion on GitHub for support
- Ask in team chat or standup

---

## 🎉 You're All Set!

The project is now fully organized and ready for development. Happy coding!

**Next command to run**:
```bash
./scripts/create-labels.sh
```

Then:
```bash
node scripts/generate-issues.js --dry-run
```

Then:
```bash
node scripts/generate-issues.js
```

Good luck! 🚀
