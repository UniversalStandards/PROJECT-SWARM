# SWARM Project Board Setup Guide

This guide explains how to set up the complete project board, create all issues, and enable parallel agent workflows for the SWARM project.

## Overview

The SWARM project has **32 identified features** that need implementation, organized into 7 groups for parallel development. This setup includes:

- **Automated issue creation** from documented requirements
- **GitHub labels** for organization and filtering
- **GitHub Actions workflows** for parallel agent processing
- **Project board structure** for tracking progress
- **Documentation** for all features and requirements

## Quick Start

### Prerequisites

1. **GitHub CLI** installed and authenticated
   ```bash
   # Install GitHub CLI (if not already installed)
   # macOS
   brew install gh
   
   # Windows
   winget install GitHub.cli
   
   # Linux
   # See: https://github.com/cli/cli/blob/trunk/docs/install_linux.md
   
   # Authenticate
   gh auth login
   ```

2. **Node.js** (for running the issue generation script)
   ```bash
   node --version  # Should be v16 or higher
   ```

### Setup Steps

#### Step 1: Create GitHub Labels

Create all necessary labels for organizing issues:

```bash
# Make script executable
chmod +x scripts/create-labels.sh

# Run the script
./scripts/create-labels.sh
```

This creates:
- **Priority labels**: critical, high, medium, low
- **Type labels**: bug, enhancement, documentation, testing
- **Status labels**: in-progress, blocked, needs-review, ready-for-testing
- **Category labels**: 30+ labels for different feature areas
- **Group labels**: 7 groups for parallel processing

#### Step 2: Generate Issues (Dry Run First)

Preview what issues will be created:

```bash
node scripts/generate-issues.js --dry-run
```

Review the output to ensure everything looks correct.

#### Step 3: Create Issues

Create all issues in the repository:

```bash
node scripts/generate-issues.js
```

This will create 20+ issues with:
- Proper titles and descriptions
- Task checklists
- Priority and category labels
- Group assignments for parallel work

#### Step 4: Create GitHub Project Board

1. Go to your repository on GitHub
2. Click on **Projects** tab
3. Click **New project**
4. Choose **Board** layout
5. Name it: "SWARM Development Board"

#### Step 5: Add Issues to Project

```bash
# Add all issues to the project (replace PROJECT_NUMBER with your project number)
gh project item-add PROJECT_NUMBER --owner Universal-Standard --url $(gh issue list --limit 100 --json url --jq '.[].url')
```

Or manually:
1. Open the project board
2. Click "Add items"
3. Search for issues by label (e.g., `label:critical`)
4. Select and add issues

#### Step 6: Configure Project Views

Create custom views in your project board:

**View 1: By Priority**
- Group by: Priority (critical, high, medium, low)
- Sort by: Created date

**View 2: By Group**
- Group by: Group label (group-a-core, group-b-auth, etc.)
- Sort by: Priority

**View 3: By Status**
- Group by: Status label (in-progress, blocked, etc.)
- Filter: Only open issues

**View 4: Sprint Board**
- Columns: Backlog, In Progress, Review, Testing, Done
- Filter by: Current sprint milestone

## Issue Groups for Parallel Processing

### Group A: Core Functionality (Parallel)
**Label**: `group-a-core`
- Issue #2: Workflow Execution Engine
- Issue #4: Workflow Validation
- Issue #5: Error Handling System

**Workflow**: Can all be worked on simultaneously

### Group B: Authentication & Security (Sequential)
**Label**: `group-b-auth`
1. Issue #1: Per-User GitHub Auth (first)
2. Issue #9: Deep GitHub Integration (depends on #1)

**Workflow**: Must be done in order

### Group C: Execution Monitoring (Sequential)
**Label**: `group-c-monitoring`
1. Issue #6: Real-time Execution Monitoring (first)
2. Issue #7: Agent Message Visualization (depends on #6)

**Workflow**: Must be done in order

### Group D: Knowledge & Templates (Parallel)
**Label**: `group-d-knowledge`
- Issue #3: Knowledge Base Persistence
- Issue #8: Complete Template System

**Workflow**: Can be worked on simultaneously

### Group E: UX Improvements (Parallel)
**Label**: `group-e-ux`
- Issue #11: Workflow Builder UX
- Issue #12: Agent Configuration Panel
- Issue #13: AI Assistant Chat
- Issue #14: Settings Page
- Issue #15: Execution Logs Detail
- Issue #16: Onboarding Flow
- Issue #17: Loading States

**Workflow**: All can be worked on simultaneously

### Group F: Advanced Features (After Core)
**Label**: `group-f-advanced`
- Issue #10: Workflow Versioning
- Issue #18: Enhanced Knowledge Base
- Issue #19: Multi-Provider Fallback
- Issue #20: Advanced Templates

**Workflow**: Start after Group A is complete

### Group G: Future Enhancements
**Label**: `group-g-future`
- Issues #21-32 (Webhooks, Scheduling, Cost Tracking, etc.)

**Workflow**: Backlog items for future sprints

## Sprint Planning

### Recommended Sprint Structure

**Sprint 1: Critical Foundation (2 weeks)**
- Focus: Groups A & B
- Goal: Core execution working, security fixed
- Issues: #1, #2, #4, #5, #9

**Sprint 2: Monitoring & Knowledge (2 weeks)**
- Focus: Groups C & D
- Goal: Real-time monitoring, knowledge system working
- Issues: #3, #6, #7, #8

**Sprint 3: User Experience (2 weeks)**
- Focus: Group E
- Goal: Polished UX, improved usability
- Issues: #11-17

**Sprint 4: Advanced Features (2 weeks)**
- Focus: Group F
- Goal: Professional features, competitive edge
- Issues: #10, #18, #19, #20

**Sprint 5+: Future Enhancements**
- Focus: Group G
- Goal: Scaling and advanced capabilities
- Issues: #21-32

## Using GitHub Actions Workflows

The project includes automated workflows for parallel processing:

### 1. Auto-Assign Issues to Project
**File**: `.github/workflows/auto-assign-issues.yml`

Automatically adds new issues to the project board when created.

### 2. Issue Triage and Labeling
**File**: `.github/workflows/issue-triage.yml`

Automatically labels issues based on title and description content.

### 3. Parallel Agent Workflow
**File**: `.github/workflows/parallel-agent-workflow.yml`

Enables parallel processing of issue groups:

```bash
# Trigger workflow for a specific group
gh workflow run parallel-agent-workflow.yml -f issue_group=group-a-core
gh workflow run parallel-agent-workflow.yml -f issue_group=group-e-ux
```

Or add the appropriate group label to an issue to trigger automatically.

## Best Practices

### For Issue Management

1. **Always add appropriate labels**
   - One priority label
   - One or more category labels
   - One group label
   - Status labels as work progresses

2. **Update status regularly**
   - Add `in-progress` when starting work
   - Add `blocked` if stuck
   - Add `needs-review` when ready for review
   - Add `ready-for-testing` after review

3. **Link related issues**
   - Use "Depends on #X" in issue descriptions
   - Use "Blocks #Y" to show blocking relationships
   - Reference issues in commits: "Fixes #123"

4. **Keep tasks updated**
   - Check off completed tasks in issue descriptions
   - Add comments for progress updates
   - Update estimates if scope changes

### For Development

1. **Branch naming convention**
   ```
   feature/<issue-number>-short-description
   fix/<issue-number>-short-description
   docs/<issue-number>-short-description
   ```
   
   Example:
   ```bash
   git checkout -b feature/2-workflow-execution-engine
   git checkout -b fix/1-per-user-github-auth
   ```

2. **Commit messages**
   ```
   <type>(#issue): <description>
   
   - Detailed point 1
   - Detailed point 2
   
   Fixes #<issue-number>
   ```
   
   Example:
   ```
   feat(#2): Add topological sorting to orchestrator
   
   - Implement graph traversal algorithm
   - Add cycle detection
   - Test with complex workflows
   
   Fixes #2
   ```

3. **Pull Request template**
   - Link to issue: "Closes #X"
   - Checklist of completed tasks
   - Screenshots/videos for UI changes
   - Test results
   - Documentation updates

### For Parallel Development

1. **Group A (Core) - High Priority**
   - Assign multiple developers
   - Daily sync meetings
   - Shared knowledge base
   - Integration testing throughout

2. **Group E (UX) - Can Scale**
   - Perfect for parallel development
   - Each issue is independent
   - Can use AI agents for automation
   - Focus on consistency

3. **Dependencies Management**
   - Mark issues as blocked when waiting
   - Update dependent issues when unblocked
   - Communicate blockers in project board

## Monitoring Progress

### Project Board Automation

Set up these automations in your project:

1. **When issue is closed**
   - Move to "Done" column
   - Add completion date

2. **When issue is labeled "in-progress"**
   - Move to "In Progress" column
   - Add assignee if missing

3. **When issue is labeled "blocked"**
   - Move to "Blocked" column
   - Add warning indicator

4. **When PR is linked to issue**
   - Move to "Review" column
   - Add PR link to issue

### Metrics to Track

1. **Velocity**: Issues closed per sprint
2. **Cycle time**: Time from start to done
3. **Blocked time**: Time issues spend blocked
4. **Sprint completion**: % of committed issues completed
5. **Test coverage**: % of code covered by tests
6. **Bug rate**: Bugs found per feature

### Reports to Generate

1. **Weekly Progress Report**
   - Issues completed this week
   - Issues in progress
   - Blockers and risks
   - Next week's plan

2. **Sprint Retrospective**
   - What went well
   - What needs improvement
   - Action items for next sprint

3. **Project Status Dashboard**
   - Overall completion percentage
   - By priority (critical, high, medium, low)
   - By group (A-G)
   - Burndown chart

## Troubleshooting

### Issue Creation Fails

**Problem**: Script fails to create issues

**Solutions**:
1. Check GitHub CLI authentication: `gh auth status`
2. Verify repository access: `gh repo view`
3. Check rate limits: `gh api rate_limit`
4. Run with smaller batches

### Workflow Not Triggering

**Problem**: GitHub Actions workflow doesn't run

**Solutions**:
1. Check workflow permissions in repository settings
2. Verify GITHUB_TOKEN has necessary permissions
3. Check workflow file syntax: `gh workflow view`
4. Look at workflow runs: `gh run list`

### Labels Not Appearing

**Problem**: Labels created but not showing on issues

**Solutions**:
1. Refresh GitHub page
2. Check label creation: `gh label list`
3. Verify label names match exactly
4. Recreate labels if needed

## Additional Resources

- **PROJECT_BOARD.md**: Full details on all 32 issues
- **Workflow Status Tracker.md**: Current status of all features
- **design_guidelines.md**: UI/UX design standards
- **replit.md**: Architecture and technical documentation
- **.github/ISSUE_LABELS.md**: Complete label reference

## Support

For questions or issues with the project board setup:

1. Check this documentation first
2. Review GitHub's project documentation
3. Check GitHub Actions logs for workflow issues
4. Open a discussion in the repository

## Maintenance

### Regular Tasks

**Weekly**:
- Review and triage new issues
- Update issue statuses
- Sync project board with actual progress

**Monthly**:
- Review and update priority labels
- Archive completed issues
- Update documentation
- Review metrics and adjust velocity

**Per Sprint**:
- Sprint planning meeting
- Daily standups
- Sprint review
- Sprint retrospective

---

Last Updated: 2025-12-03
Version: 1.0
