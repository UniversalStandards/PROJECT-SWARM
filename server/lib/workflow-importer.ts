import { db } from "../db";
import { workflows, agents, workflowSchedules, workflowWebhooks, knowledgeEntries, type InsertWorkflow, type InsertAgent } from "@shared/schema";
import { eq } from "drizzle-orm";
import { webhookManager } from "./webhooks";

interface ImportOptions {
  userId: string;
  conflictResolution?: "skip" | "rename" | "overwrite";
  importSchedules?: boolean;
  importWebhooks?: boolean;
  importKnowledgeBase?: boolean;
}

interface ImportResult {
  success: boolean;
  workflowId?: string;
  error?: string;
  warnings?: string[];
}

export class WorkflowImporter {
  /**
   * Validate workflow export structure
   */
  validateExport(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.version) {
      errors.push("Missing export version");
    }

    if (!data.workflow) {
      errors.push("Missing workflow data");
    }

    if (!data.agents || !Array.isArray(data.agents)) {
      errors.push("Missing or invalid agents data");
    }

    if (data.workflow) {
      if (!data.workflow.name) {
        errors.push("Workflow name is required");
      }

      if (!data.workflow.nodes || !Array.isArray(data.workflow.nodes)) {
        errors.push("Workflow nodes are required");
      }

      if (!data.workflow.edges || !Array.isArray(data.workflow.edges)) {
        errors.push("Workflow edges are required");
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Import workflow from export data
   */
  async importWorkflow(
    exportData: any,
    options: ImportOptions
  ): Promise<ImportResult> {
    const warnings: string[] = [];

    // Validate export structure
    const validation = this.validateExport(exportData);
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid export data: ${validation.errors.join(", ")}`,
      };
    }

    try {
      const workflowData = exportData.workflow;

      // Check for name conflicts
      const existingWorkflow = await db.query.workflows.findFirst({
        where: eq(workflows.name, workflowData.name),
      });

      let workflowName = workflowData.name;

      if (existingWorkflow) {
        if (options.conflictResolution === "skip") {
          return {
            success: false,
            error: `Workflow with name "${workflowName}" already exists`,
          };
        } else if (options.conflictResolution === "rename") {
          workflowName = `${workflowName} (imported ${new Date().toISOString()})`;
          warnings.push(`Workflow renamed to "${workflowName}" to avoid conflict`);
        } else if (options.conflictResolution === "overwrite") {
          // Delete existing workflow
          await db.delete(workflows).where(eq(workflows.id, existingWorkflow.id));
          warnings.push(`Existing workflow "${workflowName}" was overwritten`);
        }
      }

      // Create new workflow
      const [newWorkflow] = await db
        .insert(workflows)
        .values({
          userId: options.userId,
          name: workflowName,
          description: workflowData.description || null,
          nodes: workflowData.nodes || [],
          edges: workflowData.edges || [],
          isTemplate: workflowData.isTemplate || false,
          category: workflowData.category || null,
        })
        .returning();

      // Map old node IDs to new node IDs if needed
      const nodeIdMap = new Map<string, string>();
      
      // Import agents
      const agentIdMap = new Map<string, string>();
      
      for (const agentData of exportData.agents) {
        const [newAgent] = await db
          .insert(agents)
          .values({
            workflowId: newWorkflow.id,
            name: agentData.name,
            role: agentData.role,
            description: agentData.description || null,
            provider: agentData.provider,
            model: agentData.model,
            systemPrompt: agentData.systemPrompt || null,
            temperature: agentData.temperature || 70,
            maxTokens: agentData.maxTokens || 1000,
            capabilities: agentData.capabilities || [],
            nodeId: agentData.nodeId,
            position: agentData.position || { x: 0, y: 0 },
          })
          .returning();

        if (agentData.id) {
          agentIdMap.set(agentData.id, newAgent.id);
        }
      }

      // Import schedules if requested
      if (options.importSchedules && exportData.schedules) {
        for (const scheduleData of exportData.schedules) {
          try {
            await db.insert(workflowSchedules).values({
              workflowId: newWorkflow.id,
              cronExpression: scheduleData.cronExpression,
              enabled: false, // Start disabled for safety
              timezone: scheduleData.timezone || "UTC",
            });
          } catch (error) {
            warnings.push(`Failed to import schedule: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      // Import webhooks if requested
      if (options.importWebhooks && exportData.webhooks) {
        for (const webhookData of exportData.webhooks) {
          try {
            // Generate new webhook with new secret
            // Note: baseUrl will be empty string, webhook URL will be generated when accessed through API
            await webhookManager.createWebhook(newWorkflow.id, "");
            warnings.push("Webhook imported with new secret key (old key not preserved for security)");
          } catch (error) {
            warnings.push(`Failed to import webhook: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      // Import knowledge base if requested
      if (options.importKnowledgeBase && exportData.knowledgeBase) {
        for (const knowledgeData of exportData.knowledgeBase) {
          try {
            await db.insert(knowledgeEntries).values({
              userId: options.userId,
              agentType: knowledgeData.agentType,
              category: knowledgeData.category,
              content: knowledgeData.content,
              context: knowledgeData.context || null,
              confidence: knowledgeData.confidence || 80,
            });
          } catch (error) {
            warnings.push(`Failed to import knowledge entry: ${error instanceof Error ? error.message : "Unknown error"}`);
          }
        }
      }

      return {
        success: true,
        workflowId: newWorkflow.id,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during import",
      };
    }
  }

  /**
   * Import multiple workflows from batch export
   */
  async importMultipleWorkflows(
    exportData: { workflows: any[] },
    options: ImportOptions
  ): Promise<{
    success: boolean;
    results: ImportResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  }> {
    const results: ImportResult[] = [];

    for (const workflowExport of exportData.workflows) {
      const result = await this.importWorkflow(workflowExport, options);
      results.push(result);
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: failed === 0,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
      },
    };
  }

  /**
   * Import workflow from JSON string
   */
  async importFromJson(
    jsonString: string,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      const data = JSON.parse(jsonString);
      return await this.importWorkflow(data, options);
    } catch (error) {
      return {
        success: false,
        error: `Invalid JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Import workflow from ZIP file
   * (This would require additional libraries like unzipper)
   */
  async importFromZip(
    zipBuffer: Buffer,
    options: ImportOptions
  ): Promise<ImportResult> {
    try {
      // In a real implementation, extract and parse ZIP
      // For now, assume it's JSON
      const jsonString = zipBuffer.toString("utf-8");
      return await this.importFromJson(jsonString, options);
    } catch (error) {
      return {
        success: false,
        error: `Failed to import from ZIP: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Clone an existing workflow
   */
  async cloneWorkflow(
    workflowId: string,
    userId: string,
    newName?: string
  ): Promise<ImportResult> {
    try {
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (!workflow) {
        return { success: false, error: "Workflow not found" };
      }

      const workflowAgents = await db.query.agents.findMany({
        where: eq(agents.workflowId, workflowId),
      });

      // Create export data
      const exportData = {
        version: "1.0",
        workflow: {
          ...workflow,
          name: newName || `${workflow.name} (copy)`,
        },
        agents: workflowAgents,
      };

      // Import as new workflow
      return await this.importWorkflow(exportData, {
        userId,
        conflictResolution: "rename",
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to clone workflow: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }
}

export const workflowImporter = new WorkflowImporter();
