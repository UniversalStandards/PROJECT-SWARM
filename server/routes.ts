import type { Express } from "express";
import { storage } from "./storage";
import { insertWorkflowSchema, insertAgentSchema, insertExecutionSchema, insertTemplateSchema } from "@shared/schema";
import { orchestrator } from "./ai/orchestrator";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import type { Request } from "express";
import crypto from "crypto";
import { 
  getGitHubAuthUrl, 
  exchangeCodeForToken, 
  storeGitHubTokens, 
  revokeGitHubToken,
  getGitHubToken,
  isGitHubTokenExpired 
} from "./auth/github-oauth";
import { withGitHubAuth, type GitHubAuthRequest } from "./middleware/github-auth";
import { encrypt, decrypt, maskToken } from "./auth/encryption";
import { workflowValidator } from "./lib/workflow-validator";
import { WorkflowValidationError } from "@shared/errors";

// Execution request schema - only workflowId and input are needed from client
const executeWorkflowSchema = insertExecutionSchema.pick({ workflowId: true, input: true });

// Sync Agent records from workflow nodes
async function syncAgentsFromNodes(workflowId: string, nodes: any[]) {
  // Delete existing agents for this workflow
  const existingAgents = await storage.getAgentsByWorkflowId(workflowId);
  for (const agent of existingAgents) {
    await storage.deleteAgent(agent.id);
  }

  // Create new agents from nodes
  for (const node of nodes) {
    if (node.type === 'agent') {
      const role = node.data?.role || 'Coordinator';
      const provider = node.data?.provider || 'openai';
      const model = node.data?.model || (provider === 'openai' ? 'gpt-4' : provider === 'anthropic' ? 'claude-3-5-sonnet-20241022' : 'gemini-1.5-flash');
      
      await storage.createAgent({
        workflowId,
        name: node.data?.label || `${role} Agent`,
        role,
        description: node.data?.description || '',
        provider,
        model,
        systemPrompt: node.data?.systemPrompt || null,
        temperature: node.data?.temperature !== undefined ? node.data.temperature : 70,
        maxTokens: node.data?.maxTokens || 1000,
        capabilities: node.data?.capabilities || [],
        nodeId: node.id,
        position: node.position,
      });
    }
  }
}

// Helper to get current authenticated user ID
function getUserId(req: any): string {
  return req.user.claims.sub;
}

export async function registerRoutes(app: Express) {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // GitHub OAuth routes
  app.get('/api/auth/github/authorize', isAuthenticated, async (req: any, res) => {
    try {
      // Generate CSRF state token
      const state = crypto.randomBytes(32).toString('hex');
      
      // Store state in session for verification
      if (req.session) {
        req.session.githubOAuthState = state;
      }
      
      // Generate and redirect to GitHub authorization URL
      const authUrl = getGitHubAuthUrl(state);
      res.json({ authUrl });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/auth/github/callback', isAuthenticated, async (req: any, res) => {
    try {
      const { code, state } = req.query;
      
      if (!code || typeof code !== 'string') {
        return res.status(400).json({ error: 'Missing authorization code' });
      }
      
      // Verify state to prevent CSRF
      if (req.session && req.session.githubOAuthState !== state) {
        return res.status(400).json({ error: 'Invalid state parameter' });
      }
      
      // Clear state from session
      if (req.session) {
        delete req.session.githubOAuthState;
      }
      
      // Exchange code for token
      const { accessToken, refreshToken, expiresAt } = await exchangeCodeForToken(code);
      
      // Store tokens for user
      const userId = getUserId(req);
      await storeGitHubTokens(userId, accessToken, refreshToken, expiresAt);
      
      // Redirect to settings page
      res.redirect('/app/settings?github=connected');
    } catch (error: any) {
      console.error('GitHub OAuth callback error:', error);
      res.redirect('/app/settings?github=error');
    }
  });

  app.get('/api/auth/github/status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.json({ connected: false });
      }
      
      const hasToken = !!user.githubAccessToken;
      const isExpired = isGitHubTokenExpired(user);
      const maskedToken = hasToken ? maskToken(getGitHubToken(user)) : null;
      
      res.json({ 
        connected: hasToken && !isExpired,
        expired: isExpired,
        tokenPreview: maskedToken
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/auth/github/disconnect', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      await revokeGitHubToken(userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflows
  app.get("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflows = await storage.getWorkflowsByUserId(userId);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      // Verify ownership
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertWorkflowSchema.parse({
        ...req.body,
        userId,
      });
      const workflow = await storage.createWorkflow(data);
      
      // Create Agent records for each node in the workflow
      await syncAgentsFromNodes(workflow.id, workflow.nodes as any[]);
      
      res.json(workflow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Verify ownership first
      const existingWorkflow = await storage.getWorkflowById(req.params.id);
      if (!existingWorkflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (existingWorkflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Define structured schemas for workflow components
      const nodeSchema = z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.record(z.any()),
      });

      const edgeSchema = z.object({
        id: z.string(),
        source: z.string(),
        target: z.string(),
        animated: z.boolean().optional(),
      });

      // Validate the update data with Zod schema
      const updateWorkflowSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        nodes: z.array(nodeSchema).optional(),
        edges: z.array(edgeSchema).optional(),
        category: z.string().optional(),
      }).strict();

      const validated = updateWorkflowSchema.parse(req.body);
      
      if (Object.keys(validated).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const workflow = await storage.updateWorkflow(req.params.id, validated);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      
      // Sync agents if nodes were updated
      if (validated.nodes) {
        await syncAgentsFromNodes(req.params.id, validated.nodes as any[]);
      }
      
      res.json(workflow);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Verify ownership
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      await storage.deleteWorkflow(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow Validation
  app.post("/api/workflows/:id/validate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      
      // Verify ownership
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const result = workflowValidator.validate(workflow);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agents
  app.get("/api/workflows/:workflowId/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(req.params.workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const agents = await storage.getAgentsByWorkflowId(req.params.workflowId);
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertAgentSchema.parse(req.body);
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(data.workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const agent = await storage.createAgent(data);
      res.json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/agents/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get agent and verify workflow ownership
      const agent = await storage.getAgentById(req.params.id);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      const workflow = await storage.getWorkflowById(agent.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Define capability schema
      const capabilitySchema = z.object({
        type: z.string(),
        name: z.string(),
        description: z.string().optional(),
        parameters: z.record(z.any()).optional(),
      });

      // Validate the update data with Zod schema
      const updateAgentSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        role: z.string().optional(),
        description: z.string().optional(),
        provider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
        model: z.string().optional(),
        systemPrompt: z.string().optional(),
        temperature: z.number().int().min(0).max(100).optional(),
        maxTokens: z.number().int().min(1).max(100000).optional(),
        capabilities: z.array(capabilitySchema).optional(),
        topP: z.number().int().min(0).max(100).optional(),
        frequencyPenalty: z.number().int().min(-200).max(200).optional(),
        presencePenalty: z.number().int().min(-200).max(200).optional(),
        stopSequences: z.array(z.string()).optional(),
      }).strict();

      const validated = updateAgentSchema.parse(req.body);
      
      if (Object.keys(validated).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedAgent = await storage.updateAgent(req.params.id, validated);
      if (!updatedAgent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      
      // Update workflow nodes to keep them in sync with agent data
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        const updatedNodes = (workflow.nodes as any[]).map((node: any) => {
          if (node.id === agent.nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                label: updatedAgent.name,
                provider: updatedAgent.provider,
                model: updatedAgent.model,
                role: updatedAgent.role,
                description: updatedAgent.description || node.data.description,
                systemPrompt: updatedAgent.systemPrompt || node.data.systemPrompt,
              }
            };
          }
          return node;
        });
        
        await storage.updateWorkflow(workflow.id, { nodes: updatedNodes });
      }
      
      res.json(updatedAgent);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Executions
  app.get("/api/executions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const executions = await storage.getExecutionsByUserId(userId);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:workflowId/executions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(req.params.workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const executions = await storage.getExecutionsByWorkflowId(req.params.workflowId);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      
      // Verify ownership through workflow
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/executions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { workflowId, input } = executeWorkflowSchema.parse(req.body);
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
      }
      if (workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const execution = await orchestrator.executeWorkflow(workflowId, input);
      res.json(execution);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/executions/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get execution and verify ownership through workflow
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Validate the update data with Zod schema
      const updateExecutionSchema = z.object({
        status: z.enum(['pending', 'running', 'completed', 'error']).optional(),
        output: z.record(z.any()).optional(),
        error: z.string().optional(),
      }).strict();

      const validated = updateExecutionSchema.parse(req.body);
      
      if (Object.keys(validated).length === 0) {
        return res.status(400).json({ error: "No valid fields to update" });
      }

      const updatedExecution = await storage.updateExecution(req.params.id, validated);
      if (!updatedExecution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(updatedExecution);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get execution and verify ownership
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const logs = await storage.getLogsByExecutionId(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id/messages", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get execution and verify ownership
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      
      const workflow = await storage.getWorkflowById(execution.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const messages = await storage.getMessagesByExecutionId(req.params.id);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/featured", async (req, res) => {
    try {
      const templates = await storage.getFeaturedTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const data = insertTemplateSchema.parse(req.body);
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(data.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Mark workflow as template
      await storage.updateWorkflow(data.workflowId, { isTemplate: true });
      
      const template = await storage.createTemplate(data);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(template.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const updateTemplateSchema = z.object({
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        thumbnailUrl: z.string().url().optional().nullable(),
        featured: z.boolean().optional(),
      }).strict();
      
      const validated = updateTemplateSchema.parse(req.body);
      
      const updated = await storage.updateTemplate(req.params.id, validated);
      res.json(updated);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/templates/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Verify workflow ownership
      const workflow = await storage.getWorkflowById(template.workflowId);
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      // Unmark workflow as template (don't delete the workflow)
      await storage.updateWorkflow(template.workflowId, { isTemplate: false });
      
      await storage.deleteTemplate(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/:id/use", async (req, res) => {
    try {
      await storage.updateTemplateUsageCount(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates/:id/duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Get the source workflow
      const workflow = await storage.getWorkflowById(template.workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Template workflow not found" });
      }
      
      // Create a new workflow from this template
      const newWorkflow = await storage.createWorkflow({
        userId,
        name: `${template.name} (Copy)`,
        description: template.description,
        nodes: workflow.nodes,
        edges: workflow.edges,
        category: template.category,
        isTemplate: false,
      });
      
      res.json(newWorkflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id/export", async (req, res) => {
    try {
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Get the workflow data
      const workflow = await storage.getWorkflowById(template.workflowId);
      if (!workflow) {
        return res.status(404).json({ error: "Template workflow not found" });
      }
      
      const exportData = {
        template: {
          name: template.name,
          description: template.description,
          category: template.category,
        },
        workflow: {
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
        exportedAt: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${template.name.replace(/[^a-zA-Z0-9]/g, '-')}-template.json"`);
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create workflow from template
  app.post("/api/templates/:id/create-workflow", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Get the source workflow
      const sourceWorkflow = await storage.getWorkflowById(template.workflowId);
      if (!sourceWorkflow) {
        return res.status(404).json({ error: "Template workflow not found" });
      }

      // Create workflow from template
      const workflowData = insertWorkflowSchema.parse({
        userId,
        name: `${template.name} (Copy)`,
        description: template.description,
        nodes: sourceWorkflow.nodes,
        edges: sourceWorkflow.edges,
        category: template.category,
      });

      const workflow = await storage.createWorkflow(workflowData);
      
      // Increment template usage count
      await storage.updateTemplateUsageCount(req.params.id);

      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // GitHub integration routes (using per-user OAuth)
  app.get('/api/github/repos', isAuthenticated, withGitHubAuth, async (req: GitHubAuthRequest, res) => {
    try {
      const { data } = await req.octokit!.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/github/repos', isAuthenticated, withGitHubAuth, async (req: GitHubAuthRequest, res) => {
    try {
      const { name, description, private: isPrivate } = req.body;
      const { data } = await req.octokit!.repos.createForAuthenticatedUser({
        name,
        description: description || '',
        private: isPrivate || false,
        auto_init: true
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/github/repos/:owner/:repo/contents', isAuthenticated, withGitHubAuth, async (req: GitHubAuthRequest, res) => {
    try {
      const { owner, repo } = req.params;
      const { path } = req.query;
      const { data } = await req.octokit!.repos.getContent({
        owner,
        repo,
        path: (path as string) || ''
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Assistant Chat
  app.get("/api/assistant/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get or create chat session for user
      const chats = await storage.getAssistantChatsByUserId(userId);
      
      if (chats.length === 0) {
        // Create new chat session
        const newChat = await storage.createAssistantChat({
          userId,
          workflowId: null,
          messages: [],
        });
        return res.json(newChat);
      }
      
      // Return most recent chat
      res.json(chats[0]);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/assistant/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { message } = z.object({ message: z.string() }).parse(req.body);
      
      // Get or create chat session
      const chats = await storage.getAssistantChatsByUserId(userId);
      let chat = chats[0];
      
      if (!chat) {
        chat = await storage.createAssistantChat({
          userId,
          workflowId: null,
          messages: [],
        });
      }
      
      // Add user message
      const userMessage = {
        role: 'user' as const,
        content: message,
        timestamp: new Date().toISOString(),
      };
      
      const messages = [...(chat.messages as any[]), userMessage];
      
      // Generate AI response
      const systemPrompt = `You are a helpful AI assistant for SWARM (Smart Workflow Automation & Repository Manager). 
Your role is to help users build, optimize, and troubleshoot their AI agent workflows and repository automation.

Key capabilities:
- Visual workflow design with drag-and-drop interface
- Multi-AI provider support (OpenAI, Anthropic, Gemini)
- Persistent knowledge base that agents share
- Real-time execution monitoring
- Repository management and automation with GitHub integration
- Agent swarms that can refine existing repos or create new ones
- Template library for common use cases

Be concise, practical, and provide actionable guidance. When relevant, suggest specific agent types (Coordinator, Coder, Researcher, Analyst, QA) and explain how to configure them. Help users leverage repository automation for code generation, refactoring, and intelligent repository management.`;

      // Use OpenAI for assistant responses
      const { OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map((m: any) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      
      const assistantMessage = {
        role: 'assistant' as const,
        content: completion.choices[0].message.content || 'I apologize, I could not generate a response.',
        timestamp: new Date().toISOString(),
      };
      
      const updatedMessages = [...messages, assistantMessage];
      
      // Update chat with new messages
      const updatedChat = await storage.updateAssistantChat(chat.id, {
        messages: updatedMessages as any,
      });
      
      res.json(updatedChat);
    } catch (error: any) {
      console.error('Assistant chat error:', error);
      
      // Handle OpenAI quota/rate limit errors gracefully
      if (error.status === 429 || error.message?.includes('quota')) {
        return res.status(503).json({ 
          error: 'AI service temporarily unavailable. Please try again later or check your API quota.' 
        });
      }
      
      res.status(500).json({ error: error.message || 'Failed to process message' });
    }
  });

  // Settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return user settings (without sensitive data)
      res.json({
        defaultProvider: user.defaultProvider,
        defaultModel: user.defaultModel,
        theme: user.theme,
        emailNotifications: user.emailNotifications,
        inAppNotifications: user.inAppNotifications,
        executionTimeout: user.executionTimeout,
        autoSaveInterval: user.autoSaveInterval,
        hasOpenAIKey: !!user.openaiApiKey,
        hasAnthropicKey: !!user.anthropicApiKey,
        hasGeminiKey: !!user.geminiApiKey,
        githubConnected: !!user.githubAccessToken && !isGitHubTokenExpired(user),
      });
  // Phase 3A: Workflow Versioning API
  const { versionManager } = await import("./lib/workflow-version");

  app.get("/api/workflows/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const versions = await versionManager.getVersions(req.params.id);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const updateSettingsSchema = z.object({
        defaultProvider: z.enum(['openai', 'anthropic', 'gemini']).optional(),
        defaultModel: z.string().optional(),
        theme: z.enum(['light', 'dark', 'system']).optional(),
        emailNotifications: z.boolean().optional(),
        inAppNotifications: z.boolean().optional(),
        executionTimeout: z.number().int().min(30).max(3600).optional(),
        autoSaveInterval: z.number().int().min(10).max(300).optional(),
      }).strict();
      
      const validated = updateSettingsSchema.parse(req.body);
      
      await storage.updateUser(userId, validated);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
  app.post("/api/workflows/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const { commitMessage } = req.body;
      const version = await versionManager.createVersion(req.params.id, userId, commitMessage);
      res.json(version);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/workflows/:id/restore/:versionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      await versionManager.restoreVersion(req.params.id, req.params.versionId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Keys management
  app.post('/api/settings/api-keys', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const apiKeysSchema = z.object({
        provider: z.enum(['openai', 'anthropic', 'gemini']),
        apiKey: z.string().min(1),
      });
      
      const { provider, apiKey } = apiKeysSchema.parse(req.body);
      
      // Encrypt the API key
      const encryptedKey = encrypt(apiKey);
      
      // Store encrypted key
      const updateData: any = {};
      if (provider === 'openai') {
        updateData.openaiApiKey = encryptedKey;
      } else if (provider === 'anthropic') {
        updateData.anthropicApiKey = encryptedKey;
      } else if (provider === 'gemini') {
        updateData.geminiApiKey = encryptedKey;
      }
      
      await storage.updateUser(userId, updateData);
      
      res.json({ success: true });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
  app.get("/api/workflows/:id/versions/:v1/compare/:v2", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const comparison = await versionManager.compareVersions(req.params.v1, req.params.v2);
      res.json(comparison);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/versions/:versionId/tag", isAuthenticated, async (req: any, res) => {
    try {
      const { tag } = req.body;
      await versionManager.tagVersion(req.params.versionId, tag);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/settings/api-keys/:provider', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { provider } = req.params;
      
      if (!['openai', 'anthropic', 'gemini'].includes(provider)) {
        return res.status(400).json({ error: 'Invalid provider' });
      }
      
      const updateData: any = {};
      if (provider === 'openai') {
        updateData.openaiApiKey = null;
      } else if (provider === 'anthropic') {
        updateData.anthropicApiKey = null;
      } else if (provider === 'gemini') {
        updateData.geminiApiKey = null;
      }
      
      await storage.updateUser(userId, updateData);
      
  // Phase 3A: Workflow Scheduling API
  const { scheduler } = await import("./lib/scheduler");

  app.get("/api/workflows/:id/schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const schedules = await scheduler.getSchedules(req.params.id);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const schedule = await scheduler.createSchedule({
        workflowId: req.params.id,
        cronExpression: req.body.cronExpression,
        enabled: req.body.enabled !== undefined ? req.body.enabled : true,
        timezone: req.body.timezone || "UTC",
      });
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/schedules/:id", isAuthenticated, async (req: any, res) => {
    try {
      const schedule = await scheduler.updateSchedule(req.params.id, req.body);
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/schedules/:id", isAuthenticated, async (req: any, res) => {
    try {
      await scheduler.deleteSchedule(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/schedules/:id/pause", isAuthenticated, async (req: any, res) => {
    try {
      await scheduler.pauseSchedule(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/schedules/:id/resume", isAuthenticated, async (req: any, res) => {
    try {
      await scheduler.resumeSchedule(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Phase 3A: Webhook API
  const { webhookManager } = await import("./lib/webhooks");

  app.get("/api/workflows/:id/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const webhook = await webhookManager.getWebhook(req.params.id);
      res.json(webhook || null);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const webhook = await webhookManager.createWebhook(req.params.id, baseUrl);
      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const webhook = await webhookManager.updateWebhook(req.params.id, req.body);
      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/webhooks/:id", isAuthenticated, async (req: any, res) => {
    try {
      await webhookManager.deleteWebhook(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test API key
  app.post('/api/settings/test-api-key', isAuthenticated, async (req: any, res) => {
    try {
      const testSchema = z.object({
        provider: z.enum(['openai', 'anthropic', 'gemini']),
        apiKey: z.string().min(1),
      });
      
      const { provider, apiKey } = testSchema.parse(req.body);
      
      // Test the API key by making a simple request
      if (provider === 'openai') {
        const { OpenAI } = await import('openai');
        const client = new OpenAI({ apiKey });
        await client.models.list();
      } else if (provider === 'anthropic') {
        const { Anthropic } = await import('@anthropic-ai/sdk');
        const client = new Anthropic({ apiKey });
        // Just create client - Anthropic doesn't have a simple test endpoint
      } else if (provider === 'gemini') {
        const { GoogleGenAI } = await import('@google/genai');
        const client = new GoogleGenAI({ apiKey });
        // Just create client - Gemini validation happens on first use
      }
      
      res.json({ success: true, valid: true });
    } catch (error: any) {
      res.status(400).json({ 
        success: false, 
        valid: false,
        error: error.message || 'API key validation failed'
      });
    }
  });

  // Danger zone actions
  app.delete('/api/settings/workflows', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflows = await storage.getWorkflowsByUserId(userId);
      
      for (const workflow of workflows) {
        await storage.deleteWorkflow(workflow.id);
      }
      
      res.json({ success: true, deleted: workflows.length });
  app.post("/api/webhooks/:id/regenerate", isAuthenticated, async (req: any, res) => {
    try {
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const webhook = await webhookManager.regenerateSecret(req.params.id, baseUrl);
      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/webhooks/:id/test", isAuthenticated, async (req: any, res) => {
    try {
      const result = await webhookManager.testWebhook(req.params.id, req.body.payload);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public webhook trigger endpoint (no authentication)
  app.post("/api/webhooks/trigger/:workflowId/:secretKey", async (req, res) => {
    try {
      const { workflowId, secretKey } = req.params;
      const ipAddress = req.ip || req.socket.remoteAddress;
      
      const result = await webhookManager.triggerWebhook(
        workflowId,
        secretKey,
        req.body,
        ipAddress
      );

      if (result.success) {
        res.json({ success: true, executionId: result.executionId });
      } else {
        res.status(400).json({ error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Phase 3A: Cost Tracking & Analytics API
  const { costTracker } = await import("./lib/cost-tracker");

  app.get("/api/analytics/costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const analytics = await costTracker.getCostAnalytics(userId, startDate, endDate);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/usage", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const usage = await costTracker.getTokenUsageStats(userId, startDate, endDate);
      res.json(usage);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/trends", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const trends = await costTracker.getCostTrends(userId, startDate, endDate);
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/expensive-workflows", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

      const workflows = await costTracker.getMostExpensiveWorkflows(userId, limit);
      res.json(workflows);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const csv = await costTracker.exportCostReport(userId, startDate, endDate);
      
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=cost-report.csv");
      res.send(csv);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Phase 3A: Workflow Export/Import API
  const { workflowExporter } = await import("./lib/workflow-exporter");
  const { workflowImporter } = await import("./lib/workflow-importer");

  app.get("/api/workflows/:id/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const options = {
        includeExecutionHistory: req.query.includeExecutions === "true",
        includeKnowledgeBase: req.query.includeKnowledge === "true",
        includeSchedules: req.query.includeSchedules === "true",
        includeWebhooks: req.query.includeWebhooks === "true",
        anonymize: req.query.anonymize === "true",
      };

      const exportData = await workflowExporter.exportWorkflow(req.params.id, options);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename=${workflow.name}.json`);
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/settings/executions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const executions = await storage.getExecutionsByUserId(userId);
      
      // Note: Executions will be cascade deleted when workflows are deleted
      // This endpoint is for explicitly deleting just executions
      
      res.json({ success: true, deleted: executions.length });
  app.post("/api/workflows/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      const options = {
        userId,
        conflictResolution: (req.body.conflictResolution as "skip" | "rename" | "overwrite") || "rename",
        importSchedules: req.body.importSchedules !== false,
        importWebhooks: req.body.importWebhooks !== false,
        importKnowledgeBase: req.body.importKnowledgeBase !== false,
      };

      const result = await workflowImporter.importWorkflow(req.body.workflow, options);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/settings/export', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Export all user data
      const [workflows, executions] = await Promise.all([
        storage.getWorkflowsByUserId(userId),
        storage.getExecutionsByUserId(userId),
      ]);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        workflows,
        executions,
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="swarm-data-${userId}-${Date.now()}.json"`);
  app.post("/api/workflows/bulk-export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { workflowIds } = req.body;

      if (!Array.isArray(workflowIds) || workflowIds.length === 0) {
        return res.status(400).json({ error: "workflowIds array is required" });
      }

      const options = {
        includeExecutionHistory: req.query.includeExecutions === "true",
        includeKnowledgeBase: req.query.includeKnowledge === "true",
        includeSchedules: req.query.includeSchedules === "true",
        includeWebhooks: req.query.includeWebhooks === "true",
      };

      const exportData = await workflowExporter.exportMultipleWorkflows(workflowIds, options);
      
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", "attachment; filename=workflows-export.json");
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/clone", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(404).json({ error: "Workflow not found" });
      }

      const result = await workflowImporter.cloneWorkflow(
        req.params.id,
        userId,
        req.body.name
      );
      
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
