# GitHub Labels for SWARM Project

This document defines all labels to be created for the SWARM project board.

## How to Create Labels

Run the following commands using GitHub CLI (`gh`) or create them via the GitHub web interface:

```bash
# Priority Labels
gh label create "critical" --description "Must be fixed immediately" --color "d73a4a"
gh label create "high" --description "Important for MVP" --color "ff9800"
gh label create "medium" --description "Nice to have soon" --color "ffeb3b"
gh label create "low" --description "Future enhancement" --color "c5def5"

# Type Labels
gh label create "bug" --description "Something is broken" --color "d73a4a"
gh label create "enhancement" --description "New feature or improvement" --color "a2eeef"
gh label create "documentation" --description "Documentation improvements" --color "0075ca"
gh label create "testing" --description "Testing related" --color "d4c5f9"

# Status Labels
gh label create "in-progress" --description "Currently being worked on" --color "fbca04"
gh label create "blocked" --description "Blocked by dependencies" --color "b60205"
gh label create "needs-review" --description "Needs code review" --color "0e8a16"
gh label create "ready-for-testing" --description "Ready for testing" --color "c2e0c6"

# Category Labels - Core
gh label create "security" --description "Security related" --color "d73a4a"
gh label create "github-integration" --description "GitHub API integration" --color "000000"
gh label create "execution-engine" --description "Workflow execution" --color "7057ff"
gh label create "knowledge-base" --description "Knowledge management" --color "008672"
gh label create "validation" --description "Validation logic" --color "e99695"
gh label create "error-handling" --description "Error handling" --color "f9d0c4"

# Category Labels - Features
gh label create "execution-monitoring" --description "Real-time monitoring" --color "5319e7"
gh label create "websockets" --description "WebSocket features" --color "1d76db"
gh label create "visualization" --description "Data visualization" --color "0052cc"
gh label create "templates" --description "Template system" --color "c5def5"
gh label create "versioning" --description "Version control" --color "0075ca"
gh label create "workflow-builder" --description "Workflow editor" --color "5319e7"

# Category Labels - UX
gh label create "ux" --description "User experience" --color "d876e3"
gh label create "agent-config" --description "Agent configuration" --color "b4a7d6"
gh label create "ai-assistant" --description "AI chat assistant" --color "0e8a16"
gh label create "settings" --description "Settings page" --color "c2e0c6"
gh label create "execution-logs" --description "Log viewing" --color "bfd4f2"
gh label create "onboarding" --description "User onboarding" --color "d4c5f9"
gh label create "loading-states" --description "Loading indicators" --color "fbca04"

# Category Labels - Advanced
gh label create "search" --description "Search functionality" --color "006b75"
gh label create "ai-providers" --description "AI provider integration" --color "0e8a16"
gh label create "reliability" --description "System reliability" --color "84b6eb"
gh label create "marketplace" --description "Template/agent marketplace" --color "ff6b6b"
gh label create "webhooks" --description "Webhook system" --color "1d76db"
gh label create "automation" --description "Automation features" --color "0052cc"
gh label create "scheduling" --description "Scheduled execution" --color "5319e7"
gh label create "analytics" --description "Analytics and reporting" --color "006b75"
gh label create "cost-tracking" --description "Cost management" --color "fbca04"
gh label create "quality" --description "Code quality" --color "e99695"
gh label create "monitoring" --description "System monitoring" --color "0075ca"

# Category Labels - Future
gh label create "community" --description "Community features" --color "ff6b6b"
gh label create "developer-tools" --description "Developer tooling" --color "000000"
gh label create "import-export" --description "Import/export features" --color "bfd4f2"
gh label create "portability" --description "Cross-platform" --color "c2e0c6"
gh label create "integrations" --description "Third-party integrations" --color "1d76db"
gh label create "notifications" --description "Notification system" --color "fbca04"
gh label create "extensibility" --description "Plugin/extension system" --color "7057ff"
gh label create "collaboration" --description "Real-time collaboration" --color "d876e3"
gh label create "mobile" --description "Mobile application" --color "5319e7"

# Group Labels (for parallel processing)
gh label create "group-a-core" --description "Group A: Core Functionality" --color "0052cc"
gh label create "group-b-auth" --description "Group B: Authentication & Security" --color "d73a4a"
gh label create "group-c-monitoring" --description "Group C: Execution Monitoring" --color "5319e7"
gh label create "group-d-knowledge" --description "Group D: Knowledge & Templates" --color "008672"
gh label create "group-e-ux" --description "Group E: UX Improvements" --color "d876e3"
gh label create "group-f-advanced" --description "Group F: Advanced Features" --color "0075ca"
gh label create "group-g-future" --description "Group G: Future Enhancements" --color "c5def5"
```

## Label Categories

### Priority (Choose One)
- 🔴 **critical** - Must be fixed immediately
- 🟠 **high** - Important for MVP
- 🟡 **medium** - Nice to have soon
- ⚪ **low** - Future enhancement

### Type (Choose One or More)
- **bug** - Something is broken
- **enhancement** - New feature or improvement
- **documentation** - Documentation improvements
- **testing** - Testing related

### Status (Updated During Development)
- **in-progress** - Currently being worked on
- **blocked** - Blocked by dependencies
- **needs-review** - Needs code review
- **ready-for-testing** - Ready for testing

### Category (Choose Relevant Ones)
Apply relevant category labels based on the feature area.

### Group (For Parallel Processing)
- **group-a-core** - Core Functionality issues
- **group-b-auth** - Authentication & Security issues
- **group-c-monitoring** - Execution Monitoring issues
- **group-d-knowledge** - Knowledge & Templates issues
- **group-e-ux** - UX Improvements issues
- **group-f-advanced** - Advanced Features issues
- **group-g-future** - Future Enhancements issues

## Usage Guidelines

1. **Every issue should have:**
   - One priority label (critical, high, medium, or low)
   - One type label (bug or enhancement at minimum)
   - At least one category label
   - One group label for parallel processing

2. **Status labels are updated:**
   - When work starts: Add `in-progress`
   - When blocked: Add `blocked`
   - When ready for review: Add `needs-review`
   - When ready for testing: Add `ready-for-testing`

3. **Group labels enable:**
   - Parallel agent workflow execution
   - Better organization in project board
   - Automated workflow triggers

## Bulk Label Creation Script

If you want to create all labels at once, save this as `create-labels.sh`:

```bash
#!/bin/bash
# Create all SWARM project labels

# Priority
gh label create "critical" -d "Must be fixed immediately" -c "d73a4a" || true
gh label create "high" -d "Important for MVP" -c "ff9800" || true
gh label create "medium" -d "Nice to have soon" -c "ffeb3b" || true
gh label create "low" -d "Future enhancement" -c "c5def5" || true

# Type
gh label create "bug" -d "Something is broken" -c "d73a4a" || true
gh label create "enhancement" -d "New feature or improvement" -c "a2eeef" || true
gh label create "documentation" -d "Documentation improvements" -c "0075ca" || true
gh label create "testing" -d "Testing related" -c "d4c5f9" || true

# Status
gh label create "in-progress" -d "Currently being worked on" -c "fbca04" || true
gh label create "blocked" -d "Blocked by dependencies" -c "b60205" || true
gh label create "needs-review" -d "Needs code review" -c "0e8a16" || true
gh label create "ready-for-testing" -d "Ready for testing" -c "c2e0c6" || true

# Categories (add all the category labels here)
# ... (See commands above)

echo "All labels created successfully!"
```

Make it executable and run:
```bash
chmod +x create-labels.sh
./create-labels.sh
```
