import { db } from "../db";
import { workflows, agents, executions, executionLogs, workflowSchedules, workflowWebhooks, knowledgeEntries } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ExportOptions {
  includeExecutionHistory?: boolean;
  includeKnowledgeBase?: boolean;
  includeSchedules?: boolean;
  includeWebhooks?: boolean;
  anonymize?: boolean;
}

interface WorkflowExport {
  version: string;
  exportedAt: string;
  workflow: any;
  agents: any[];
  executions?: any[];
  schedules?: any[];
  webhooks?: any[];
  knowledgeBase?: any[];
}

export class WorkflowExporter {
  private readonly EXPORT_VERSION = "1.0";

  /**
   * Export workflow as JSON
   */
  async exportWorkflow(
    workflowId: string,
    options: ExportOptions = {}
  ): Promise<WorkflowExport> {
    // Get workflow
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    // Get agents
    const workflowAgents = await db.query.agents.findMany({
      where: eq(agents.workflowId, workflowId),
    });

    const exportData: WorkflowExport = {
      version: this.EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      workflow: this.sanitizeWorkflow(workflow, options.anonymize),
      agents: workflowAgents.map(agent => this.sanitizeAgent(agent, options.anonymize)),
    };

    // Include execution history if requested
    if (options.includeExecutionHistory) {
      const workflowExecutions = await db.query.executions.findMany({
        where: eq(executions.workflowId, workflowId),
      });
      exportData.executions = workflowExecutions.map(exec => 
        this.sanitizeExecution(exec, options.anonymize)
      );
    }

    // Include schedules if requested
    if (options.includeSchedules) {
      const schedules = await db.query.workflowSchedules.findMany({
        where: eq(workflowSchedules.workflowId, workflowId),
      });
      exportData.schedules = schedules.map(sched => 
        this.sanitizeSchedule(sched, options.anonymize)
      );
    }

    // Include webhooks if requested
    if (options.includeWebhooks) {
      const webhooks = await db.query.workflowWebhooks.findMany({
        where: eq(workflowWebhooks.workflowId, workflowId),
      });
      exportData.webhooks = webhooks.map(webhook => 
        this.sanitizeWebhook(webhook, options.anonymize)
      );
    }

    // Include knowledge base if requested
    if (options.includeKnowledgeBase) {
      const knowledge = await db.query.knowledgeEntries.findMany({
        where: eq(knowledgeEntries.sourceAgentId, workflowAgents[0]?.id || ""),
      });
      exportData.knowledgeBase = knowledge.map(entry => 
        this.sanitizeKnowledge(entry, options.anonymize)
      );
    }

    return exportData;
  }

  /**
   * Export workflow as template (anonymized)
   */
  async exportAsTemplate(workflowId: string): Promise<WorkflowExport> {
    return await this.exportWorkflow(workflowId, {
      includeExecutionHistory: false,
      includeKnowledgeBase: false,
      includeSchedules: false,
      includeWebhooks: false,
      anonymize: true,
    });
  }

  /**
   * Export multiple workflows as batch
   */
  async exportMultipleWorkflows(
    workflowIds: string[],
    options: ExportOptions = {}
  ): Promise<{ workflows: WorkflowExport[] }> {
    const exports = await Promise.all(
      workflowIds.map(id => this.exportWorkflow(id, options))
    );

    return { workflows: exports };
  }

  /**
   * Export all workflows for a user
   */
  async exportAllUserWorkflows(
    userId: string,
    options: ExportOptions = {}
  ): Promise<{ workflows: WorkflowExport[] }> {
    const userWorkflows = await db.query.workflows.findMany({
      where: eq(workflows.userId, userId),
    });

    return await this.exportMultipleWorkflows(
      userWorkflows.map(wf => wf.id),
      options
    );
  }

  /**
   * Sanitize workflow data
   */
  private sanitizeWorkflow(workflow: any, anonymize?: boolean): any {
    const sanitized = { ...workflow };

    if (anonymize) {
      delete sanitized.userId;
      delete sanitized.id;
      sanitized.name = `Template: ${sanitized.name}`;
      sanitized.isTemplate = true;
    }

    return sanitized;
  }

  /**
   * Sanitize agent data
   */
  private sanitizeAgent(agent: any, anonymize?: boolean): any {
    const sanitized = { ...agent };

    if (anonymize) {
      delete sanitized.id;
      delete sanitized.workflowId;
    }

    return sanitized;
  }

  /**
   * Sanitize execution data
   */
  private sanitizeExecution(execution: any, anonymize?: boolean): any {
    const sanitized = { ...execution };

    if (anonymize) {
      delete sanitized.id;
      delete sanitized.userId;
      delete sanitized.workflowId;
      // Remove sensitive input/output data
      if (sanitized.input) {
        sanitized.input = { anonymized: true };
      }
      if (sanitized.output) {
        sanitized.output = { anonymized: true };
      }
    }

    return sanitized;
  }

  /**
   * Sanitize schedule data
   */
  private sanitizeSchedule(schedule: any, anonymize?: boolean): any {
    const sanitized = { ...schedule };

    if (anonymize) {
      delete sanitized.id;
      delete sanitized.workflowId;
    }

    return sanitized;
  }

  /**
   * Sanitize webhook data
   */
  private sanitizeWebhook(webhook: any, anonymize?: boolean): any {
    const sanitized = { ...webhook };

    if (anonymize) {
      delete sanitized.id;
      delete sanitized.workflowId;
      delete sanitized.secretKey;
      sanitized.webhookUrl = "REGENERATE_ON_IMPORT";
    }

    return sanitized;
  }

  /**
   * Sanitize knowledge entry
   */
  private sanitizeKnowledge(entry: any, anonymize?: boolean): any {
    const sanitized = { ...entry };

    if (anonymize) {
      delete sanitized.id;
      delete sanitized.userId;
      delete sanitized.sourceExecutionId;
      delete sanitized.sourceAgentId;
    }

    return sanitized;
  }

  /**
   * Generate ZIP file containing workflow and assets
   * (This would require additional libraries like archiver)
   */
  async exportAsZip(
    workflowId: string,
    options: ExportOptions = {}
  ): Promise<Buffer> {
    const exportData = await this.exportWorkflow(workflowId, options);
    
    // In a real implementation, use archiver to create ZIP
    // For now, just return JSON as buffer
    const jsonString = JSON.stringify(exportData, null, 2);
    return Buffer.from(jsonString, "utf-8");
  }

  /**
   * Generate human-readable workflow documentation
   */
  async generateDocumentation(workflowId: string): Promise<string> {
    const workflow = await db.query.workflows.findFirst({
      where: eq(workflows.id, workflowId),
    });

    if (!workflow) {
      throw new Error("Workflow not found");
    }

    const workflowAgents = await db.query.agents.findMany({
      where: eq(agents.workflowId, workflowId),
    });

    let doc = `# Workflow: ${workflow.name}\n\n`;
    
    if (workflow.description) {
      doc += `## Description\n${workflow.description}\n\n`;
    }

    doc += `## Agents (${workflowAgents.length})\n\n`;
    
    for (const agent of workflowAgents) {
      doc += `### ${agent.name} (${agent.role})\n`;
      doc += `- **Provider**: ${agent.provider}\n`;
      doc += `- **Model**: ${agent.model}\n`;
      if (agent.description) {
        doc += `- **Description**: ${agent.description}\n`;
      }
      if (agent.systemPrompt) {
        doc += `- **System Prompt**: ${agent.systemPrompt}\n`;
      }
      doc += `\n`;
    }

    doc += `## Workflow Structure\n`;
    doc += `- **Nodes**: ${(workflow.nodes as any[]).length}\n`;
    doc += `- **Edges**: ${(workflow.edges as any[]).length}\n`;

    return doc;
  }
}

export const workflowExporter = new WorkflowExporter();
