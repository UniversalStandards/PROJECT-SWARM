#!/bin/bash
# Create all SWARM project labels
# Usage: ./scripts/create-labels.sh

echo "🏷️  Creating GitHub labels for SWARM project..."
echo ""

# Priority Labels
echo "Creating priority labels..."
gh label create "critical" -d "Must be fixed immediately" -c "d73a4a" -f 2>/dev/null || echo "  ✓ critical exists"
gh label create "high" -d "Important for MVP" -c "ff9800" -f 2>/dev/null || echo "  ✓ high exists"
gh label create "medium" -d "Nice to have soon" -c "ffeb3b" -f 2>/dev/null || echo "  ✓ medium exists"
gh label create "low" -d "Future enhancement" -c "c5def5" -f 2>/dev/null || echo "  ✓ low exists"

# Type Labels (bug already exists by default)
echo ""
echo "Creating type labels..."
gh label create "enhancement" -d "New feature or improvement" -c "a2eeef" -f 2>/dev/null || echo "  ✓ enhancement exists"
gh label create "documentation" -d "Documentation improvements" -c "0075ca" -f 2>/dev/null || echo "  ✓ documentation exists"
gh label create "testing" -d "Testing related" -c "d4c5f9" -f 2>/dev/null || echo "  ✓ testing exists"

# Status Labels
echo ""
echo "Creating status labels..."
gh label create "in-progress" -d "Currently being worked on" -c "fbca04" -f 2>/dev/null || echo "  ✓ in-progress exists"
gh label create "blocked" -d "Blocked by dependencies" -c "b60205" -f 2>/dev/null || echo "  ✓ blocked exists"
gh label create "needs-review" -d "Needs code review" -c "0e8a16" -f 2>/dev/null || echo "  ✓ needs-review exists"
gh label create "ready-for-testing" -d "Ready for testing" -c "c2e0c6" -f 2>/dev/null || echo "  ✓ ready-for-testing exists"

# Category Labels - Core
echo ""
echo "Creating core category labels..."
gh label create "security" -d "Security related" -c "d73a4a" -f 2>/dev/null || echo "  ✓ security exists"
gh label create "github-integration" -d "GitHub API integration" -c "000000" -f 2>/dev/null || echo "  ✓ github-integration exists"
gh label create "execution-engine" -d "Workflow execution" -c "7057ff" -f 2>/dev/null || echo "  ✓ execution-engine exists"
gh label create "knowledge-base" -d "Knowledge management" -c "008672" -f 2>/dev/null || echo "  ✓ knowledge-base exists"
gh label create "validation" -d "Validation logic" -c "e99695" -f 2>/dev/null || echo "  ✓ validation exists"
gh label create "error-handling" -d "Error handling" -c "f9d0c4" -f 2>/dev/null || echo "  ✓ error-handling exists"

# Category Labels - Features
echo ""
echo "Creating feature category labels..."
gh label create "execution-monitoring" -d "Real-time monitoring" -c "5319e7" -f 2>/dev/null || echo "  ✓ execution-monitoring exists"
gh label create "websockets" -d "WebSocket features" -c "1d76db" -f 2>/dev/null || echo "  ✓ websockets exists"
gh label create "visualization" -d "Data visualization" -c "0052cc" -f 2>/dev/null || echo "  ✓ visualization exists"
gh label create "templates" -d "Template system" -c "c5def5" -f 2>/dev/null || echo "  ✓ templates exists"
gh label create "versioning" -d "Version control" -c "0075ca" -f 2>/dev/null || echo "  ✓ versioning exists"
gh label create "workflow-builder" -d "Workflow editor" -c "5319e7" -f 2>/dev/null || echo "  ✓ workflow-builder exists"

# Category Labels - UX
echo ""
echo "Creating UX category labels..."
gh label create "ux" -d "User experience" -c "d876e3" -f 2>/dev/null || echo "  ✓ ux exists"
gh label create "agent-config" -d "Agent configuration" -c "b4a7d6" -f 2>/dev/null || echo "  ✓ agent-config exists"
gh label create "ai-assistant" -d "AI chat assistant" -c "0e8a16" -f 2>/dev/null || echo "  ✓ ai-assistant exists"
gh label create "ai" -d "AI features" -c "0e8a16" -f 2>/dev/null || echo "  ✓ ai exists"
gh label create "settings" -d "Settings page" -c "c2e0c6" -f 2>/dev/null || echo "  ✓ settings exists"
gh label create "execution-logs" -d "Log viewing" -c "bfd4f2" -f 2>/dev/null || echo "  ✓ execution-logs exists"
gh label create "onboarding" -d "User onboarding" -c "d4c5f9" -f 2>/dev/null || echo "  ✓ onboarding exists"
gh label create "loading-states" -d "Loading indicators" -c "fbca04" -f 2>/dev/null || echo "  ✓ loading-states exists"

# Category Labels - Advanced
echo ""
echo "Creating advanced category labels..."
gh label create "search" -d "Search functionality" -c "006b75" -f 2>/dev/null || echo "  ✓ search exists"
gh label create "ai-providers" -d "AI provider integration" -c "0e8a16" -f 2>/dev/null || echo "  ✓ ai-providers exists"
gh label create "reliability" -d "System reliability" -c "84b6eb" -f 2>/dev/null || echo "  ✓ reliability exists"
gh label create "marketplace" -d "Template/agent marketplace" -c "ff6b6b" -f 2>/dev/null || echo "  ✓ marketplace exists"
gh label create "webhooks" -d "Webhook system" -c "1d76db" -f 2>/dev/null || echo "  ✓ webhooks exists"
gh label create "automation" -d "Automation features" -c "0052cc" -f 2>/dev/null || echo "  ✓ automation exists"
gh label create "scheduling" -d "Scheduled execution" -c "5319e7" -f 2>/dev/null || echo "  ✓ scheduling exists"
gh label create "analytics" -d "Analytics and reporting" -c "006b75" -f 2>/dev/null || echo "  ✓ analytics exists"
gh label create "cost-tracking" -d "Cost management" -c "fbca04" -f 2>/dev/null || echo "  ✓ cost-tracking exists"
gh label create "quality" -d "Code quality" -c "e99695" -f 2>/dev/null || echo "  ✓ quality exists"
gh label create "monitoring" -d "System monitoring" -c "0075ca" -f 2>/dev/null || echo "  ✓ monitoring exists"

# Category Labels - Future
echo ""
echo "Creating future category labels..."
gh label create "community" -d "Community features" -c "ff6b6b" -f 2>/dev/null || echo "  ✓ community exists"
gh label create "developer-tools" -d "Developer tooling" -c "000000" -f 2>/dev/null || echo "  ✓ developer-tools exists"
gh label create "import-export" -d "Import/export features" -c "bfd4f2" -f 2>/dev/null || echo "  ✓ import-export exists"
gh label create "portability" -d "Cross-platform" -c "c2e0c6" -f 2>/dev/null || echo "  ✓ portability exists"
gh label create "integrations" -d "Third-party integrations" -c "1d76db" -f 2>/dev/null || echo "  ✓ integrations exists"
gh label create "notifications" -d "Notification system" -c "fbca04" -f 2>/dev/null || echo "  ✓ notifications exists"
gh label create "extensibility" -d "Plugin/extension system" -c "7057ff" -f 2>/dev/null || echo "  ✓ extensibility exists"
gh label create "collaboration" -d "Real-time collaboration" -c "d876e3" -f 2>/dev/null || echo "  ✓ collaboration exists"
gh label create "mobile" -d "Mobile application" -c "5319e7" -f 2>/dev/null || echo "  ✓ mobile exists"
gh label create "debugging" -d "Debugging tools" -c "000000" -f 2>/dev/null || echo "  ✓ debugging exists"

# Group Labels (for parallel processing)
echo ""
echo "Creating group labels for parallel processing..."
gh label create "group-a-core" -d "Group A: Core Functionality" -c "0052cc" -f 2>/dev/null || echo "  ✓ group-a-core exists"
gh label create "group-b-auth" -d "Group B: Authentication & Security" -c "d73a4a" -f 2>/dev/null || echo "  ✓ group-b-auth exists"
gh label create "group-c-monitoring" -d "Group C: Execution Monitoring" -c "5319e7" -f 2>/dev/null || echo "  ✓ group-c-monitoring exists"
gh label create "group-d-knowledge" -d "Group D: Knowledge & Templates" -c "008672" -f 2>/dev/null || echo "  ✓ group-d-knowledge exists"
gh label create "group-e-ux" -d "Group E: UX Improvements" -c "d876e3" -f 2>/dev/null || echo "  ✓ group-e-ux exists"
gh label create "group-f-advanced" -d "Group F: Advanced Features" -c "0075ca" -f 2>/dev/null || echo "  ✓ group-f-advanced exists"
gh label create "group-g-future" -d "Group G: Future Enhancements" -c "c5def5" -f 2>/dev/null || echo "  ✓ group-g-future exists"

echo ""
echo "✅ All labels created successfully!"
echo ""
echo "Next steps:"
echo "  1. Run: node scripts/generate-issues.js --dry-run"
echo "  2. Review the issues that would be created"
echo "  3. Run: node scripts/generate-issues.js"
echo "  4. Create a GitHub Project board"
echo "  5. Add issues to the project board"
