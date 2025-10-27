import crypto from "crypto";
import { db } from "../db";
import { workflowWebhooks, executions, workflows, type WorkflowWebhook, type InsertWorkflowWebhook } from "@shared/schema";
import { eq } from "drizzle-orm";
import { orchestrator } from "../ai/orchestrator";

interface WebhookCallLog {
  timestamp: Date;
  payload: any;
  success: boolean;
  executionId?: string;
  error?: string;
}

export class WebhookManager {
  private callLogs: Map<string, WebhookCallLog[]> = new Map();
  private rateLimitMap: Map<string, number[]> = new Map();
  private readonly MAX_CALLS_PER_HOUR = 100;

  /**
   * Generate a unique webhook URL
   */
  generateWebhookUrl(workflowId: string, baseUrl: string = ""): { url: string; secretKey: string } {
    const secretKey = crypto.randomBytes(32).toString("hex");
    const url = `${baseUrl}/api/webhooks/trigger/${workflowId}/${secretKey}`;
    return { url, secretKey };
  }

  /**
   * Create a new webhook
   */
  async createWebhook(workflowId: string, baseUrl: string = ""): Promise<WorkflowWebhook> {
    const { url, secretKey } = this.generateWebhookUrl(workflowId, baseUrl);

    const [webhook] = await db
      .insert(workflowWebhooks)
      .values({
        workflowId,
        webhookUrl: url,
        secretKey,
        enabled: true,
      })
      .returning();

    return webhook;
  }

  /**
   * Get webhook by workflow ID
   */
  async getWebhook(workflowId: string): Promise<WorkflowWebhook | undefined> {
    return await db.query.workflowWebhooks.findFirst({
      where: eq(workflowWebhooks.workflowId, workflowId),
    });
  }

  /**
   * Get webhook by secret key
   */
  async getWebhookBySecret(workflowId: string, secretKey: string): Promise<WorkflowWebhook | undefined> {
    const webhooks = await db.query.workflowWebhooks.findMany({
      where: eq(workflowWebhooks.secretKey, secretKey),
    });
    return webhooks[0];
  }

  /**
   * Regenerate webhook secret key
   */
  async regenerateSecret(webhookId: string, baseUrl: string = ""): Promise<WorkflowWebhook> {
    const webhook = await db.query.workflowWebhooks.findFirst({
      where: eq(workflowWebhooks.id, webhookId),
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    const { url, secretKey } = this.generateWebhookUrl(webhook.workflowId, baseUrl);

    const [updated] = await db
      .update(workflowWebhooks)
      .set({
        webhookUrl: url,
        secretKey,
        updatedAt: new Date(),
      })
      .where(eq(workflowWebhooks.id, webhookId))
      .returning();

    return updated;
  }

  /**
   * Update webhook configuration
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<InsertWorkflowWebhook>
  ): Promise<WorkflowWebhook> {
    const [updated] = await db
      .update(workflowWebhooks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(workflowWebhooks.id, webhookId))
      .returning();

    return updated;
  }

  /**
   * Delete a webhook
   */
  async deleteWebhook(webhookId: string): Promise<void> {
    await db.delete(workflowWebhooks).where(eq(workflowWebhooks.id, webhookId));
    this.callLogs.delete(webhookId);
    this.rateLimitMap.delete(webhookId);
  }

  /**
   * Validate webhook request
   */
  validateWebhook(
    webhook: WorkflowWebhook,
    secretKey: string,
    ipAddress?: string
  ): { valid: boolean; error?: string } {
    // Check if webhook is enabled
    if (!webhook.enabled) {
      return { valid: false, error: "Webhook is disabled" };
    }

    // Validate secret key
    if (webhook.secretKey !== secretKey) {
      return { valid: false, error: "Invalid secret key" };
    }

    // Check IP whitelist if configured
    if (webhook.ipWhitelist && Array.isArray(webhook.ipWhitelist)) {
      const whitelist = webhook.ipWhitelist as string[];
      if (whitelist.length > 0 && ipAddress && !whitelist.includes(ipAddress)) {
        return { valid: false, error: "IP address not whitelisted" };
      }
    }

    // Check rate limit
    if (!this.checkRateLimit(webhook.id)) {
      return { valid: false, error: "Rate limit exceeded (max 100 calls per hour)" };
    }

    return { valid: true };
  }

  /**
   * Check rate limit for a webhook
   */
  private checkRateLimit(webhookId: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Get recent calls
    let calls = this.rateLimitMap.get(webhookId) || [];
    
    // Remove calls older than 1 hour
    calls = calls.filter(timestamp => timestamp > oneHourAgo);
    
    // Check if limit exceeded
    if (calls.length >= this.MAX_CALLS_PER_HOUR) {
      return false;
    }

    // Add current call
    calls.push(now);
    this.rateLimitMap.set(webhookId, calls);

    return true;
  }

  /**
   * Transform webhook payload to workflow input
   */
  transformPayload(webhook: WorkflowWebhook, payload: any): any {
    // If no transformer configured, pass payload as-is
    if (!webhook.payloadTransformer) {
      return payload;
    }

    const transformer = webhook.payloadTransformer as Record<string, string>;
    const input: Record<string, any> = {};

    // Apply transformations
    for (const [key, path] of Object.entries(transformer)) {
      // Simple path resolution (e.g., "user.email" -> payload.user.email)
      const value = this.getValueByPath(payload, path);
      input[key] = value;
    }

    return input;
  }

  /**
   * Get value from object by dot notation path
   */
  private getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Trigger webhook and execute workflow
   */
  async triggerWebhook(
    workflowId: string,
    secretKey: string,
    payload: any,
    ipAddress?: string
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      // Get webhook
      const webhook = await this.getWebhookBySecret(workflowId, secretKey);
      
      if (!webhook) {
        return { success: false, error: "Webhook not found" };
      }

      // Validate webhook
      const validation = this.validateWebhook(webhook, secretKey, ipAddress);
      if (!validation.valid) {
        this.logWebhookCall(webhook.id, payload, false, undefined, validation.error);
        return { success: false, error: validation.error };
      }

      // Get workflow
      const workflow = await db.query.workflows.findFirst({
        where: eq(workflows.id, workflowId),
      });

      if (!workflow) {
        return { success: false, error: "Workflow not found" };
      }

      // Transform payload
      const input = this.transformPayload(webhook, payload);

      // Create execution
      const [execution] = await db
        .insert(executions)
        .values({
          workflowId,
          userId: workflow.userId,
          status: "pending",
          input: { ...input, webhook: true, webhookId: webhook.id },
        })
        .returning();

      // Queue workflow execution (async)
      orchestrator.executeWorkflow(execution.id).catch(error => {
        console.error(`[Webhook] Error executing workflow ${workflowId}:`, error);
      });

      // Update webhook statistics
      await db
        .update(workflowWebhooks)
        .set({
          triggerCount: (webhook.triggerCount || 0) + 1,
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(workflowWebhooks.id, webhook.id));

      // Log successful call
      this.logWebhookCall(webhook.id, payload, true, execution.id);

      return { success: true, executionId: execution.id };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[Webhook] Error triggering webhook:`, error);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Log webhook call for debugging
   */
  private logWebhookCall(
    webhookId: string,
    payload: any,
    success: boolean,
    executionId?: string,
    error?: string
  ): void {
    const logs = this.callLogs.get(webhookId) || [];
    
    logs.unshift({
      timestamp: new Date(),
      payload,
      success,
      executionId,
      error,
    });

    // Keep only last 10 calls
    if (logs.length > 10) {
      logs.splice(10);
    }

    this.callLogs.set(webhookId, logs);
  }

  /**
   * Get recent webhook calls
   */
  getRecentCalls(webhookId: string, limit: number = 10): WebhookCallLog[] {
    const logs = this.callLogs.get(webhookId) || [];
    return logs.slice(0, limit);
  }

  /**
   * Verify HMAC signature (for enhanced security)
   */
  verifyHmacSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest("hex");
    return signature === expectedSignature;
  }

  /**
   * Test webhook with sample payload
   */
  async testWebhook(
    webhookId: string,
    samplePayload: any
  ): Promise<{ success: boolean; transformedInput?: any; error?: string }> {
    try {
      const webhook = await db.query.workflowWebhooks.findFirst({
        where: eq(workflowWebhooks.id, webhookId),
      });

      if (!webhook) {
        return { success: false, error: "Webhook not found" };
      }

      const transformedInput = this.transformPayload(webhook, samplePayload);

      return { success: true, transformedInput };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

export const webhookManager = new WebhookManager();
