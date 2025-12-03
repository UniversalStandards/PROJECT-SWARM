#!/usr/bin/env node

/**
 * Script to generate all GitHub issues for the SWARM project board
 * 
 * Usage:
 *   node scripts/generate-issues.js [--dry-run]
 * 
 * Requirements:
 *   - GitHub CLI (gh) must be installed and authenticated
 *   - Run from the root of the repository
 * 
 * Options:
 *   --dry-run    Show what would be created without actually creating issues
 */

import { execSync } from 'child_process';

// Issue definitions based on PROJECT_BOARD.md
const issues = [
  {
    number: 1,
    title: "Fix Per-User GitHub Authentication",
    priority: "critical",
    labels: ["bug", "security", "critical", "github-integration", "group-b-auth"],
    body: `## Description
GitHub integration currently uses workspace-level token shared across all users, creating a security vulnerability for multi-tenant deployments.

## Tasks
- [ ] Implement OAuth2 flow for per-user GitHub authentication
- [ ] Update GitHub API integration to use user-specific tokens
- [ ] Add token storage and refresh mechanism
- [ ] Implement token revocation and management UI
- [ ] Update all GitHub API calls to use per-user tokens
- [ ] Add migration script for existing users

## Estimated Effort
Large (5-8 hours)

## Priority
🔴 Critical`
  },
  {
    number: 2,
    title: "Test and Fix Workflow Execution Engine",
    priority: "critical",
    labels: ["bug", "critical", "execution-engine", "testing", "group-a-core"],
    body: `## Description
Orchestrator and executor exist but execution flow not verified end-to-end. Need to test topological sorting, agent coordination, and AI provider execution.

## Tasks
- [ ] Create comprehensive test suite for orchestrator
- [ ] Test topological sorting of workflow nodes
- [ ] Verify agent coordination and message passing
- [ ] Test execution with all AI providers (OpenAI, Anthropic, Gemini)
- [ ] Implement proper error handling and rollback
- [ ] Add execution state persistence
- [ ] Test concurrent execution handling

## Estimated Effort
Large (5-7 hours)

## Priority
🔴 Critical`
  },
  {
    number: 3,
    title: "Implement Knowledge Base Persistence",
    priority: "high",
    labels: ["bug", "critical", "knowledge-base", "ai", "group-d-knowledge"],
    body: `## Description
Knowledge extraction and retrieval during execution not verified. Database schema exists but integration with execution is untested.

## Tasks
- [ ] Implement knowledge extraction from AI responses
- [ ] Create knowledge retrieval system for execution context
- [ ] Test knowledge persistence across executions
- [ ] Implement knowledge search and filtering
- [ ] Add knowledge confidence scoring
- [ ] Create knowledge management UI

## Estimated Effort
Medium (3-5 hours)

## Dependencies
Issue #2

## Priority
🔴 High`
  },
  {
    number: 4,
    title: "Implement Workflow Validation",
    priority: "high",
    labels: ["enhancement", "critical", "validation", "workflow-builder", "group-a-core"],
    body: `## Description
No validation before execution (orphan nodes, cycles, required fields, etc.)

## Tasks
- [ ] Implement cycle detection in workflow graphs
- [ ] Validate node connections (no orphan nodes)
- [ ] Check required fields on all nodes
- [ ] Validate agent configurations
- [ ] Add pre-execution validation checks
- [ ] Create validation error UI feedback

## Estimated Effort
Medium (3-4 hours)

## Priority
🔴 High`
  },
  {
    number: 5,
    title: "Improve Error Handling System",
    priority: "high",
    labels: ["enhancement", "critical", "error-handling", "ux", "group-a-core"],
    body: `## Description
Generic error messages, no detailed validation feedback. Need field-level validation, better error boundaries, and retry logic.

## Tasks
- [ ] Implement field-level validation with specific error messages
- [ ] Add React Error Boundaries throughout the app
- [ ] Create retry logic for failed API calls
- [ ] Implement exponential backoff for AI provider failures
- [ ] Add user-friendly error messages
- [ ] Create error logging and tracking system

## Estimated Effort
Medium (3-5 hours)

## Priority
🔴 High`
  },
  {
    number: 6,
    title: "Complete Real-time Execution Monitoring",
    priority: "high",
    labels: ["enhancement", "high", "execution-monitoring", "websockets", "group-c-monitoring"],
    body: `## Description
Live execution tracking UI exists but WebSocket/polling not implemented. Execution monitor page needs real-time updates.

## Tasks
- [ ] Implement WebSocket server for real-time updates
- [ ] Create WebSocket client connection in frontend
- [ ] Add execution status broadcasting
- [ ] Implement real-time log streaming
- [ ] Add agent status indicators
- [ ] Create progress visualization
- [ ] Add execution cancellation capability

## Estimated Effort
Large (5-6 hours)

## Dependencies
Issue #2

## Priority
🟡 High`
  }
];

// Abbreviated list - add more as needed from PROJECT_BOARD.md
const moreIssues = [
  { number: 7, title: "Implement Agent Message Visualization", priority: "high", labels: ["enhancement", "high", "visualization", "execution-monitoring", "group-c-monitoring"] },
  { number: 8, title: "Complete Template System", priority: "high", labels: ["enhancement", "high", "templates", "group-d-knowledge"] },
  { number: 9, title: "Implement Deep GitHub Repository Integration", priority: "high", labels: ["enhancement", "high", "github-integration", "group-b-auth"] },
  { number: 10, title: "Implement Workflow Versioning", priority: "high", labels: ["enhancement", "high", "versioning", "workflow-builder", "group-f-advanced"] },
  { number: 11, title: "Enhance Workflow Builder UX", priority: "medium", labels: ["enhancement", "medium", "ux", "workflow-builder", "group-e-ux"] },
  { number: 12, title: "Improve Agent Configuration Panel", priority: "medium", labels: ["enhancement", "medium", "ux", "agent-config", "group-e-ux"] },
  { number: 13, title: "Test and Complete AI Assistant Chat", priority: "medium", labels: ["enhancement", "medium", "ai-assistant", "testing", "group-e-ux"] },
  { number: 14, title: "Populate Settings Page", priority: "medium", labels: ["enhancement", "medium", "settings", "group-e-ux"] },
  { number: 15, title: "Enhance Execution Logs Detail View", priority: "medium", labels: ["enhancement", "medium", "execution-logs", "group-e-ux"] },
  { number: 16, title: "Implement Onboarding Flow", priority: "medium", labels: ["enhancement", "medium", "onboarding", "ux", "group-e-ux"] },
  { number: 17, title: "Improve Loading States", priority: "low", labels: ["enhancement", "low", "ux", "loading-states", "group-e-ux"] },
  { number: 18, title: "Implement Enhanced Knowledge Base Features", priority: "medium", labels: ["enhancement", "medium", "knowledge-base", "search", "group-f-advanced"] },
  { number: 19, title: "Implement Multi-Provider Fallback", priority: "medium", labels: ["enhancement", "medium", "ai-providers", "reliability", "group-f-advanced"] },
  { number: 20, title: "Implement Advanced Templates", priority: "medium", labels: ["enhancement", "medium", "templates", "marketplace", "group-f-advanced"] }
];

const allIssues = [...issues, ...moreIssues];

console.log('🚀 SWARM Project - GitHub Issues Generator\n');
console.log(`Total issues to create: ${allIssues.length}\n`);

// Function to create a single issue
function createIssue(issue) {
  const labels = issue.labels.join(',');
  const title = issue.title;
  const body = issue.body || `See PROJECT_BOARD.md for full details on issue #${issue.number}`;
  
  try {
    console.log(`Creating issue: ${title}`);
    // Escape shell arguments to prevent command injection
    // Must escape backslashes first, then other special characters
    const escapedTitle = title.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const escapedBody = body.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/`/g, '\\`').replace(/\$/g, '\\$');
    const escapedLabels = labels.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    
    const result = execSync(`gh issue create --title "${escapedTitle}" --body "${escapedBody}" --label "${escapedLabels}"`, 
      { encoding: 'utf-8', stdio: 'pipe' });
    console.log(`✅ Created: ${result.trim()}\n`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to create issue: ${title}`);
    console.error(`   Error: ${error.message}\n`);
    return false;
  }
}

// Check if gh CLI is available
try {
  execSync('gh --version', { stdio: 'pipe' });
  console.log('✓ GitHub CLI detected\n');
} catch (error) {
  console.error('❌ GitHub CLI (gh) is not installed or not in PATH');
  console.error('   Please install it from: https://cli.github.com/');
  process.exit(1);
}

// Dry run option
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
  console.log('🔍 DRY RUN MODE - No issues will be created\n');
  allIssues.forEach(issue => {
    console.log(`Would create: #${issue.number} - ${issue.title}`);
    console.log(`  Labels: ${issue.labels.join(', ')}`);
    console.log(`  Priority: ${issue.priority}\n`);
  });
  console.log('\nRun without --dry-run to actually create the issues.');
  process.exit(0);
}

// Create issues
console.log('Creating issues...\n');
let created = 0;
let failed = 0;

allIssues.forEach(issue => {
  if (createIssue(issue)) {
    created++;
  } else {
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`✅ Successfully created: ${created} issues`);
if (failed > 0) {
  console.log(`❌ Failed to create: ${failed} issues`);
}
console.log('='.repeat(60));
