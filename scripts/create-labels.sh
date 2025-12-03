#!/bin/bash
# Create all SWARM project labels
# Usage: ./scripts/create-labels.sh

echo "🏷️  Creating GitHub labels for SWARM project..."
echo ""

# Priority Labels
echo "Creating priority labels..."
gh label create "critical" -d "Must be fixed immediately" -c "d73a4a" -f || echo "  ✓ critical already exists"
gh label create "high" -d "Important for MVP" -c "ff9800" -f || echo "  ✓ high already exists"
gh label create "medium" -d "Nice to have soon" -c "ffeb3b" -f || echo "  ✓ medium already exists"
gh label create "low" -d "Future enhancement" -c "c5def5" -f || echo "  ✓ low already exists"

# Type Labels (bug already exists by default)
echo ""
echo "Creating type labels..."
gh label create "enhancement" -d "New feature or improvement" -c "a2eeef" -f || echo "  ✓ enhancement already exists"
gh label create "documentation" -d "Documentation improvements" -c "0075ca" -f || echo "  ✓ documentation already exists"
gh label create "testing" -d "Testing related" -c "d4c5f9" -f || echo "  ✓ testing already exists"

# Status Labels
echo ""
echo "Creating status labels..."
gh label create "in-progress" -d "Currently being worked on" -c "fbca04" -f || echo "  ✓ in-progress already exists"
gh label create "blocked" -d "Blocked by dependencies" -c "b60205" -f || echo "  ✓ blocked already exists"
gh label create "needs-review" -d "Needs code review" -c "0e8a16" -f || echo "  ✓ needs-review already exists"
gh label create "ready-for-testing" -d "Ready for testing" -c "c2e0c6" -f || echo "  ✓ ready-for-testing already exists"

# Category Labels - Core
echo ""
echo "Creating core category labels..."
gh label create "security" -d "Security related" -c "d73a4a" -f || echo "  ✓ security already exists"
gh label create "github-integration" -d "GitHub API integration" -c "000000" -f || echo "  ✓ github-integration already exists"
gh label create "execution-engine" -d "Workflow execution" -c "7057ff" -f || echo "  ✓ execution-engine already exists"
gh label create "knowledge-base" -d "Knowledge management" -c "008672" -f || echo "  ✓ knowledge-base already exists"
gh label create "validation" -d "Validation logic" -c "e99695" -f || echo "  ✓ validation already exists"
gh label create "error-handling" -d "Error handling" -c "f9d0c4" -f || echo "  ✓ error-handling already exists"

# Category Labels - Features
echo ""
echo "Creating feature category labels..."
gh label create "execution-monitoring" -d "Real-time monitoring" -c "5319e7" -f || echo "  ✓ execution-monitoring already exists"
gh label create "websockets" -d "WebSocket features" -c "1d76db" -f || echo "  ✓ websockets already exists"
gh label create "visualization" -d "Data visualization" -c "0052cc" -f || echo "  ✓ visualization already exists"
gh label create "templates" -d "Template system" -c "c5def5" -f || echo "  ✓ templates already exists"
gh label create "versioning" -d "Version control" -c "0075ca" -f || echo "  ✓ versioning already exists"
gh label create "workflow-builder" -d "Workflow editor" -c "5319e7" -f || echo "  ✓ workflow-builder already exists"

# Category Labels - UX
echo ""
echo "Creating UX category labels..."
gh label create "ux" -d "User experience" -c "d876e3" -f || echo "  ✓ ux already exists"
gh label create "agent-config" -d "Agent configuration" -c "b4a7d6" -f || echo "  ✓ agent-config already exists"
gh label create "ai-assistant" -d "AI chat assistant" -c "0e8a16" -f || echo "  ✓ ai-assistant already exists"
gh label create "ai" -d "AI features" -c "0e8a16" -f || echo "  ✓ ai already exists"
gh label create "settings" -d "Settings page" -c "c2e0c6" -f || echo "  ✓ settings already exists"
gh label create "execution-logs" -d "Log viewing" -c "bfd4f2" -f || echo "  ✓ execution-logs already exists"
gh label create "onboarding" -d "User onboarding" -c "d4c5f9" -f || echo "  ✓ onboarding already exists"
gh label create "loading-states" -d "Loading indicators" -c "fbca04" -f || echo "  ✓ loading-states already exists"

# Category Labels - Advanced
echo ""
echo "Creating advanced category labels..."
gh label create "search" -d "Search functionality" -c "006b75" -f || echo "  ✓ search already exists"
gh label create "ai-providers" -d "AI provider integration" -c "0e8a16" -f || echo "  ✓ ai-providers already exists"
gh label create "reliability" -d "System reliability" -c "84b6eb" -f || echo "  ✓ reliability already exists"
gh label create "marketplace" -d "Template/agent marketplace" -c "ff6b6b" -f || echo "  ✓ marketplace already exists"
gh label create "webhooks" -d "Webhook system" -c "1d76db" -f || echo "  ✓ webhooks already exists"
gh label create "automation" -d "Automation features" -c "0052cc" -f || echo "  ✓ automation already exists"
gh label create "scheduling" -d "Scheduled execution" -c "5319e7" -f || echo "  ✓ scheduling already exists"
gh label create "analytics" -d "Analytics and reporting" -c "006b75" -f || echo "  ✓ analytics already exists"
gh label create "cost-tracking" -d "Cost management" -c "fbca04" -f || echo "  ✓ cost-tracking already exists"
gh label create "quality" -d "Code quality" -c "e99695" -f || echo "  ✓ quality already exists"
gh label create "monitoring" -d "System monitoring" -c "0075ca" -f || echo "  ✓ monitoring already exists"

# Category Labels - Future
echo ""
echo "Creating future category labels..."
gh label create "community" -d "Community features" -c "ff6b6b" -f || echo "  ✓ community already exists"
gh label create "developer-tools" -d "Developer tooling" -c "000000" -f || echo "  ✓ developer-tools already exists"
gh label create "import-export" -d "Import/export features" -c "bfd4f2" -f || echo "  ✓ import-export already exists"
gh label create "portability" -d "Cross-platform" -c "c2e0c6" -f || echo "  ✓ portability already exists"
gh label create "integrations" -d "Third-party integrations" -c "1d76db" -f || echo "  ✓ integrations already exists"
gh label create "notifications" -d "Notification system" -c "fbca04" -f || echo "  ✓ notifications already exists"
gh label create "extensibility" -d "Plugin/extension system" -c "7057ff" -f || echo "  ✓ extensibility already exists"
gh label create "collaboration" -d "Real-time collaboration" -c "d876e3" -f || echo "  ✓ collaboration already exists"
gh label create "mobile" -d "Mobile application" -c "5319e7" -f || echo "  ✓ mobile already exists"
gh label create "debugging" -d "Debugging tools" -c "000000" -f || echo "  ✓ debugging already exists"

# Group Labels (for parallel processing)
echo ""
echo "Creating group labels for parallel processing..."
gh label create "group-a-core" -d "Group A: Core Functionality" -c "0052cc" -f || echo "  ✓ group-a-core already exists"
gh label create "group-b-auth" -d "Group B: Authentication & Security" -c "d73a4a" -f || echo "  ✓ group-b-auth already exists"
gh label create "group-c-monitoring" -d "Group C: Execution Monitoring" -c "5319e7" -f || echo "  ✓ group-c-monitoring already exists"
gh label create "group-d-knowledge" -d "Group D: Knowledge & Templates" -c "008672" -f || echo "  ✓ group-d-knowledge already exists"
gh label create "group-e-ux" -d "Group E: UX Improvements" -c "d876e3" -f || echo "  ✓ group-e-ux already exists"
gh label create "group-f-advanced" -d "Group F: Advanced Features" -c "0075ca" -f || echo "  ✓ group-f-advanced already exists"
gh label create "group-g-future" -d "Group G: Future Enhancements" -c "c5def5" -f || echo "  ✓ group-g-future already exists"

echo ""
echo "✅ All labels created successfully!"
echo ""
echo "Next steps:"
echo "  1. Run: node scripts/generate-issues.js --dry-run"
echo "  2. Review the issues that would be created"
echo "  3. Run: node scripts/generate-issues.js"
echo "  4. Create a GitHub Project board"
echo "  5. Add issues to the project board"
