import type { Express } from "express";
import { storage } from "./storage";
import { insertWorkflowSchema, insertAgentSchema, insertExecutionSchema, insertTemplateSchema } from "@shared/schema";
import { orchestrator } from "./ai/orchestrator";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";
import type { Request } from "express";

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

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflowById(req.params.id);
      if (!workflow) {
        return res.status(404).json({ error: "Workflow not found" });
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

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
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

  app.delete("/api/workflows/:id", async (req, res) => {
    try {
      await storage.deleteWorkflow(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Agents
  app.get("/api/workflows/:workflowId/agents", async (req, res) => {
    try {
      const agents = await storage.getAgentsByWorkflowId(req.params.workflowId);
      res.json(agents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/agents", async (req, res) => {
    try {
      const data = insertAgentSchema.parse(req.body);
      const agent = await storage.createAgent(data);
      res.json(agent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/agents/:id", async (req, res) => {
    try {
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

      const agent = await storage.updateAgent(req.params.id, validated);
      if (!agent) {
        return res.status(404).json({ error: "Agent not found" });
      }
      res.json(agent);
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

  app.get("/api/workflows/:workflowId/executions", async (req, res) => {
    try {
      const executions = await storage.getExecutionsByWorkflowId(req.params.workflowId);
      res.json(executions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id", async (req, res) => {
    try {
      const execution = await storage.getExecutionById(req.params.id);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/executions", async (req, res) => {
    try {
      const { workflowId, input } = executeWorkflowSchema.parse(req.body);
      const execution = await orchestrator.executeWorkflow(workflowId, input);
      res.json(execution);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/executions/:id", async (req, res) => {
    try {
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

      const execution = await storage.updateExecution(req.params.id, validated);
      if (!execution) {
        return res.status(404).json({ error: "Execution not found" });
      }
      res.json(execution);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: "Invalid input", details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id/logs", async (req, res) => {
    try {
      const logs = await storage.getLogsByExecutionId(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/executions/:id/messages", async (req, res) => {
    try {
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
}
