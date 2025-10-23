import type { Express } from "express";
import { storage } from "./storage";
import { insertWorkflowSchema, insertAgentSchema, insertExecutionSchema, insertTemplateSchema } from "@shared/schema";
import { orchestrator } from "./ai/orchestrator";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import type { Request } from "express";
import { workflowValidator, workflowExportSchema } from "./lib/workflow-validator";
import { webhookHandler } from "./webhooks";
import crypto from "crypto";

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

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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

  // Create workflow from template
  app.post("/api/templates/:id/create-workflow", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const template = await storage.getTemplateById(req.params.id);
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }

      // Create workflow from template
      const workflowData = insertWorkflowSchema.parse({
        userId,
        name: `${template.name} (Copy)`,
        description: template.description,
        nodes: template.nodes,
        edges: template.edges,
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

  // GitHub integration routes
  app.get('/api/github/status', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { isGitHubConnected } = await import('./github.js');
      const connected = await isGitHubConnected(userId);
      res.json({ connected });
    } catch (error: any) {
      res.json({ connected: false, error: error.message });
    }
  });

  app.get('/api/github/repos', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { getGitHubClient } = await import('./github.js');
      const octokit = await getGitHubClient(userId);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: 100
      });
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/github/repos', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { name, description, private: isPrivate } = req.body;
      const { getGitHubClient } = await import('./github.js');
      const octokit = await getGitHubClient(userId);
      const { data } = await octokit.repos.createForAuthenticatedUser({
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

  app.get('/api/github/repos/:owner/:repo/contents', isAuthenticated, async (req: AuthRequest, res) => {
    try {
      const userId = getUserId(req);
      const { owner, repo } = req.params;
      const { path } = req.query;
      const { getGitHubClient } = await import('./github.js');
      const octokit = await getGitHubClient(userId);
      const { data } = await octokit.repos.getContent({
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

  // ==================== PHASE 3A ROUTES ====================

  // Workflow Versioning
  app.post("/api/workflows/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Get current version number
      const versions = await storage.getWorkflowVersions(req.params.id);
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

      const { commitMessage } = req.body;

      const version = await storage.createWorkflowVersion({
        workflowId: req.params.id,
        version: nextVersion,
        data: {
          nodes: workflow.nodes,
          edges: workflow.edges,
          name: workflow.name,
          description: workflow.description,
          category: workflow.category,
        },
        commitMessage: commitMessage || `Version ${nextVersion}`,
        userId,
        isActive: false,
      });

      res.json(version);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/versions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const versions = await storage.getWorkflowVersions(req.params.id);
      res.json(versions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/versions/:versionId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const version = await storage.getWorkflowVersionById(req.params.versionId);
      if (!version || version.workflowId !== req.params.id) {
        return res.status(404).json({ error: "Version not found" });
      }

      res.json(version);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/versions/:versionId/restore", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const version = await storage.getWorkflowVersionById(req.params.versionId);
      if (!version || version.workflowId !== req.params.id) {
        return res.status(404).json({ error: "Version not found" });
      }

      // Restore workflow from version data
      const versionData = version.data as any;
      await storage.updateWorkflow(req.params.id, {
        nodes: versionData.nodes,
        edges: versionData.edges,
        name: versionData.name,
        description: versionData.description,
        category: versionData.category,
      });

      // Sync agents
      await syncAgentsFromNodes(req.params.id, versionData.nodes);

      // Set as active version
      await storage.setActiveVersion(req.params.id, req.params.versionId);

      const updated = await storage.getWorkflowById(req.params.id);
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow Export/Import
  app.get("/api/workflows/:id/export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const agents = await storage.getAgentsByWorkflowId(req.params.id);
      const schema = await storage.getWorkflowSchema(req.params.id);
      const user = await storage.getUser(userId);

      const exportData = {
        version: '1.0',
        metadata: {
          name: workflow.name,
          description: workflow.description || '',
          category: workflow.category || '',
          author: user?.email || 'Unknown',
          createdAt: workflow.createdAt.toISOString(),
          updatedAt: workflow.updatedAt.toISOString(),
          exportedAt: new Date().toISOString(),
        },
        workflow: {
          nodes: workflow.nodes,
          edges: workflow.edges,
        },
        agents: agents.map(agent => ({
          name: agent.name,
          role: agent.role,
          description: agent.description || '',
          provider: agent.provider,
          model: agent.model,
          systemPrompt: agent.systemPrompt,
          temperature: agent.temperature,
          maxTokens: agent.maxTokens,
          capabilities: agent.capabilities,
          nodeId: agent.nodeId,
          position: agent.position,
        })),
        inputSchema: schema?.inputSchema || {},
        outputSchema: schema?.outputSchema || {},
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${workflow.name.replace(/[^a-z0-9]/gi, '_')}_export.json"`);
      res.json(exportData);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/import", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { workflowData, mode } = req.body;

      // Validate import data
      const validation = workflowValidator.validateExport(workflowData);
      if (!validation.valid) {
        return res.status(400).json({ error: 'Invalid workflow data', details: validation.errors });
      }

      const data = validation.data!;

      // Check for duplicate IDs if merging
      if (mode === 'merge') {
        const duplicates = workflowValidator.checkDuplicateIds(data.workflow.nodes);
        if (duplicates.length > 0) {
          return res.status(400).json({ 
            error: 'Duplicate node IDs found', 
            details: duplicates 
          });
        }
      }

      // Generate unique IDs if creating new workflow
      let nodes = data.workflow.nodes;
      let edges = data.workflow.edges;
      
      if (mode === 'new' || mode === 'replace') {
        const uniqueIds = workflowValidator.generateUniqueIds(nodes, edges);
        nodes = uniqueIds.nodes;
        edges = uniqueIds.edges;
      }

      // Validate workflow structure
      const structureValidation = workflowValidator.validateWorkflowStructure(nodes, edges);
      if (!structureValidation.valid) {
        return res.status(400).json({ 
          error: 'Invalid workflow structure', 
          warnings: structureValidation.errors 
        });
      }

      // Create or update workflow
      const workflow = await storage.createWorkflow({
        userId,
        name: `${data.metadata.name} (Imported)`,
        description: data.metadata.description || '',
        nodes,
        edges,
        category: data.metadata.category || null,
      });

      // Create agents
      await syncAgentsFromNodes(workflow.id, nodes);

      // Import schemas if provided
      if (data.inputSchema || data.outputSchema) {
        await storage.createWorkflowSchema({
          workflowId: workflow.id,
          inputSchema: data.inputSchema || {},
          outputSchema: data.outputSchema || {},
        });
      }

      res.json(workflow);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow Schedules
  app.post("/api/workflows/:id/schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { cronExpression, timezone, enabled } = req.body;

      const schedule = await storage.createWorkflowSchedule({
        workflowId: req.params.id,
        cronExpression,
        timezone: timezone || 'UTC',
        enabled: enabled !== undefined ? enabled : true,
        lastRun: null,
        nextRun: null,
      });

      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/schedules", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const schedules = await storage.getWorkflowSchedules(req.params.id);
      res.json(schedules);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put("/api/workflows/:id/schedules/:scheduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const schedule = await storage.getWorkflowScheduleById(req.params.scheduleId);
      if (!schedule || schedule.workflowId !== req.params.id) {
        return res.status(404).json({ error: "Schedule not found" });
      }

      const { cronExpression, timezone, enabled } = req.body;
      const updated = await storage.updateWorkflowSchedule(req.params.scheduleId, {
        cronExpression,
        timezone,
        enabled,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id/schedules/:scheduleId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteWorkflowSchedule(req.params.scheduleId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Workflow Webhooks
  app.post("/api/workflows/:id/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const url = webhookHandler.generateWebhookUrl();
      const secret = webhookHandler.generateWebhookSecret();

      const webhook = await storage.createWorkflowWebhook({
        workflowId: req.params.id,
        url,
        secret,
        enabled: true,
      });

      res.json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/webhooks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const webhooks = await storage.getWorkflowWebhooks(req.params.id);
      res.json(webhooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/webhooks/:webhookId/regenerate-secret", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const webhook = await storage.getWorkflowWebhookById(req.params.webhookId);
      if (!webhook || webhook.workflowId !== req.params.id) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const newSecret = webhookHandler.generateWebhookSecret();
      const updated = await storage.updateWorkflowWebhook(req.params.webhookId, {
        secret: newSecret,
      });

      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id/webhooks/:webhookId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.deleteWorkflowWebhook(req.params.webhookId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/webhooks/:webhookId/logs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const webhook = await storage.getWorkflowWebhookById(req.params.webhookId);
      if (!webhook || webhook.workflowId !== req.params.id) {
        return res.status(404).json({ error: "Webhook not found" });
      }

      const logs = await storage.getWebhookLogs(req.params.webhookId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Public webhook endpoint (no authentication required)
  app.post("/webhooks/:webhookUrl", async (req, res) => {
    try {
      const signature = req.headers['x-webhook-signature'] as string;
      const result = await webhookHandler.processWebhook(
        req.params.webhookUrl,
        req.body,
        req.headers as Record<string, string>,
        signature
      );

      if (result.success) {
        res.json({ success: true, executionId: result.executionId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Workflow Schemas
  app.post("/api/workflows/:id/schema", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { inputSchema, outputSchema } = req.body;

      // Check if schema already exists
      const existing = await storage.getWorkflowSchema(req.params.id);
      
      if (existing) {
        const updated = await storage.updateWorkflowSchema(req.params.id, {
          inputSchema,
          outputSchema,
        });
        return res.json(updated);
      }

      const schema = await storage.createWorkflowSchema({
        workflowId: req.params.id,
        inputSchema,
        outputSchema,
      });

      res.json(schema);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/schema", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const schema = await storage.getWorkflowSchema(req.params.id);
      res.json(schema || { inputSchema: {}, outputSchema: {} });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Cost Analytics
  app.get("/api/analytics/costs", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { workflowId, startDate, endDate } = req.query;

      let costs;
      if (workflowId) {
        // Verify workflow ownership
        const workflow = await storage.getWorkflowById(workflowId as string);
        if (!workflow || workflow.userId !== userId) {
          return res.status(403).json({ error: "Forbidden" });
        }
        costs = await storage.getWorkflowCosts(
          workflowId as string,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );
      } else {
        costs = await storage.getUserCosts(
          userId,
          startDate ? new Date(startDate as string) : undefined,
          endDate ? new Date(endDate as string) : undefined
        );
      }

      // Aggregate costs
      const totalCost = costs.reduce((sum, cost) => sum + cost.costUsd, 0);
      const totalTokens = costs.reduce((sum, cost) => sum + cost.totalTokens, 0);
      
      const byProvider = costs.reduce((acc: any, cost) => {
        if (!acc[cost.provider]) {
          acc[cost.provider] = { cost: 0, tokens: 0, count: 0 };
        }
        acc[cost.provider].cost += cost.costUsd;
        acc[cost.provider].tokens += cost.totalTokens;
        acc[cost.provider].count += 1;
        return acc;
      }, {});

      res.json({
        totalCost: totalCost / 1000000, // Convert micro-cents to dollars
        totalTokens,
        byProvider,
        details: costs,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Tags
  app.get("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/tags", isAuthenticated, async (req: any, res) => {
    try {
      const { name, color } = req.body;

      // Check if tag already exists
      const existing = await storage.getTagByName(name);
      if (existing) {
        return res.status(400).json({ error: "Tag already exists" });
      }

      const tag = await storage.createTag({
        name,
        color: color || '#3b82f6',
      });

      res.json(tag);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/tags/:id", isAuthenticated, async (req: any, res) => {
    try {
      await storage.deleteTag(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/workflows/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const { tagId } = req.body;
      await storage.addWorkflowTag({
        workflowId: req.params.id,
        tagId,
      });

      const tags = await storage.getWorkflowTags(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/workflows/:id/tags/:tagId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      await storage.removeWorkflowTag(req.params.id, req.params.tagId);
      const tags = await storage.getWorkflowTags(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/workflows/:id/tags", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const workflow = await storage.getWorkflowById(req.params.id);
      
      if (!workflow || workflow.userId !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const tags = await storage.getWorkflowTags(req.params.id);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
