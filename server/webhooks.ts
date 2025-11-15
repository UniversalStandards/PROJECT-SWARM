import crypto from 'crypto';
import { storage } from './storage';
import { orchestrator } from './ai/orchestrator';

export class WebhookHandler {
  /**
   * Generate a unique webhook URL path
   */
  generateWebhookUrl(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate a webhook secret for HMAC validation
   */
  generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Validate webhook signature using HMAC
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Process incoming webhook request
   */
  async processWebhook(
    webhookUrl: string,
    payload: any,
    headers: Record<string, string>,
    signature?: string
  ): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      // Find webhook by URL
      const webhook = await storage.getWorkflowWebhookByUrl(webhookUrl);
      
      if (!webhook) {
        await this.logWebhook(null, payload, headers, 'failed', 'Webhook not found');
        return { success: false, error: 'Webhook not found' };
      }

      if (!webhook.enabled) {
        await this.logWebhook(webhook.id, payload, headers, 'failed', 'Webhook disabled');
        return { success: false, error: 'Webhook disabled' };
      }

      // Validate signature if provided
      if (signature) {
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        
        if (!this.validateSignature(payloadString, signature, webhook.secret)) {
          await this.logWebhook(webhook.id, payload, headers, 'invalid', 'Invalid signature');
          return { success: false, error: 'Invalid signature' };
        }
      }

      // Get workflow to find userId
      const workflow = await storage.getWorkflowById(webhook.workflowId);
      if (!workflow) {
        await this.logWebhook(webhook.id, payload, headers, 'failed', 'Workflow not found');
        return { success: false, error: 'Workflow not found' };
      }

      // Execute workflow with webhook payload as input
      const execution = await orchestrator.executeWorkflow(webhook.workflowId, payload);

      // Log successful webhook
      await this.logWebhook(webhook.id, payload, headers, 'success', null);

      return { success: true, executionId: execution.id };
    } catch (error: any) {
      console.error('Error processing webhook:', error);
      await this.logWebhook(null, payload, headers, 'failed', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log webhook request
   */
  private async logWebhook(
    webhookId: string | null,
    payload: any,
    headers: Record<string, string>,
    status: string,
    error: string | null
  ) {
    if (!webhookId) return;

    try {
      await storage.createWebhookLog({
        webhookId,
        payload,
        headers,
        status,
        error,
      });
    } catch (logError) {
      console.error('Error logging webhook:', logError);
    }
  }

  /**
   * Test webhook with sample payload
   */
  async testWebhook(webhookId: string, testPayload: any): Promise<{ success: boolean; error?: string }> {
    const webhook = await storage.getWorkflowWebhookById(webhookId);
    
    if (!webhook) {
      return { success: false, error: 'Webhook not found' };
    }

    return this.processWebhook(
      webhook.url,
      testPayload,
      { 'content-type': 'application/json', 'user-agent': 'webhook-test' }
    );
  }
}

export const webhookHandler = new WebhookHandler();
