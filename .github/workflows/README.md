# GitHub Actions Workflows Configuration

This directory contains automated workflows for the SWARM project.

## Workflows

### 1. auto-assign-issues.yml
Automatically adds new issues and pull requests to the project board.

**Configuration Required**:
1. Create your GitHub Project board first
2. Get the project URL (e.g., `https://github.com/orgs/Universal-Standard/projects/5`)
3. Set up a repository variable:
   ```bash
   gh variable set PROJECT_BOARD_URL --body "https://github.com/orgs/Universal-Standard/projects/YOUR_PROJECT_NUMBER"
   ```

**Alternative**: Edit the workflow file and replace `${{ vars.PROJECT_BOARD_URL }}` with your actual project URL.

### 2. issue-triage.yml
Automatically labels issues based on keywords in title and description.

**No configuration required** - works out of the box.

**Keywords detected**:
- Priority: "critical", "broken", "security", "fix", "bug", "enhance"
- Categories: "github", "execution", "knowledge", "workflow", "template", "monitor", "websocket"

### 3. parallel-agent-workflow.yml
Enables parallel processing of issue groups for multi-agent development.

**Usage**:
```bash
# Trigger manually for a specific group
gh workflow run parallel-agent-workflow.yml -f issue_group=group-a-core
gh workflow run parallel-agent-workflow.yml -f issue_group=group-e-ux
```

**Or** add the appropriate group label to an issue to trigger automatically.

**Groups**:
- `group-a-core` - Core Functionality (3 issues)
- `group-b-auth` - Authentication & Security (2 issues)
- `group-c-monitoring` - Execution Monitoring (2 issues)
- `group-d-knowledge` - Knowledge & Templates (2 issues)
- `group-e-ux` - UX Improvements (7 issues)
- `group-f-advanced` - Advanced Features (4 issues)
- `group-g-future` - Future Enhancements (12 issues)

## Permissions

All workflows require the following permissions (already configured):
- `issues: write` - To create and modify issues
- `pull-requests: write` - To modify PRs

These permissions are granted through the `GITHUB_TOKEN` automatically.

## Troubleshooting

### Workflow not running
1. Check if Actions are enabled: Settings → Actions → General
2. Verify workflow file syntax is valid
3. Check workflow runs: Actions tab → Select workflow

### Auto-assign not working
1. Verify `PROJECT_BOARD_URL` variable is set correctly
2. Check that project exists and is accessible
3. Ensure GITHUB_TOKEN has project access

### View workflow logs
```bash
# List recent runs
gh run list

# View specific run
gh run view RUN_ID

# View logs
gh run view RUN_ID --log
```

## Disabling Workflows

If you don't want a workflow to run:
1. Go to Actions tab
2. Click on the workflow name
3. Click "..." menu → "Disable workflow"

Or delete the workflow file from this directory.
