import type { Workflow, Agent, Execution } from '@shared/schema';
import { storage } from '../storage';
import { aiExecutor } from './executor';
import { costTracker } from '../lib/cost-tracker';
import { versionManager } from '../lib/workflow-version';
import { wsManager } from '../websocket';
import { workflowValidator } from '../lib/workflow-validator';

interface WorkflowNode {
  id: string;
  type: string;
  data: any;
  position: { x: number; y: number };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export class WorkflowOrchestrator {
  async executeWorkflow(workflowId: string, input: any): Promise<Execution> {
    const workflow = await storage.getWorkflowById(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Validate workflow before execution
    const validationResult = workflowValidator.validate(workflow);
    if (!validationResult.valid) {
      const errorMessages = validationResult.errors.map(e => e.message).join('; ');
      throw new Error(`Workflow validation failed: ${errorMessages}`);
    }

    const agents = await storage.getAgentsByWorkflowId(workflowId);
    
    const execution = await storage.createExecution({
      workflowId,
      userId: workflow.userId,
      status: 'running',
      input,
    });

    try {
      // Emit execution started event
      wsManager.emitExecutionStarted(execution.id, workflow.name);
      
      await this.logExecution(execution.id, 'info', 'Workflow execution started');
      await this.logExecution(execution.id, 'info', `Fetched ${agents.length} agents from database`);
      
      const nodes = workflow.nodes as WorkflowNode[];
      const edges = workflow.edges as WorkflowEdge[];
      
      const agentMap = new Map<string, Agent>();
      agents.forEach(agent => agentMap.set(agent.nodeId, agent));

      const nodeResults = new Map<string, any>();
      const executionOrder = this.topologicalSort(nodes, edges);

      for (let stepIndex = 0; stepIndex < executionOrder.length; stepIndex++) {
        const nodeId = executionOrder[stepIndex];
        const node = nodes.find(n => n.id === nodeId);
        const agent = agentMap.get(nodeId);
        
        if (!node || !agent) continue;

        const stepStartTime = Date.now();
        // Emit agent started event
        wsManager.emitAgentStarted(execution.id, agent.id, agent.name);

        await this.logExecution(
          execution.id, 
          'info', 
          `Step ${stepIndex + 1}/${executionOrder.length}: Starting agent ${agent.name} (Provider: ${agent.provider}, Model: ${agent.model})`,
          agent.id,
          stepIndex
        );

        // Fetch relevant knowledge for this agent
        const agentType = agent.role.toLowerCase();
        const categories = this.getCategoriesForAgent(agentType);
        const relevantKnowledge = await storage.getRelevantKnowledge(
          workflow.userId,
          agentType,
          categories
        );

        if (relevantKnowledge.length > 0) {
          await this.logExecution(
            execution.id,
            'info',
            `Retrieved ${relevantKnowledge.length} knowledge entries for agent`,
            agent.id
          );
        }

        const predecessorEdges = edges.filter(e => e.target === nodeId);
        const contextMessages: Array<{ role: string; content: string }> = [];

        if (predecessorEdges.length === 0) {
          contextMessages.push({
            role: 'user',
            content: typeof input === 'string' ? input : JSON.stringify(input),
          });
        } else {
          for (const edge of predecessorEdges) {
            const predecessorResult = nodeResults.get(edge.source);
            if (predecessorResult) {
              contextMessages.push({
                role: 'user',
                content: predecessorResult.content,
              });
            }
          }
        }

        try {
          // Debug: Log agent details
          await this.logExecution(
            execution.id,
            'info',
            `Agent details: provider=${agent.provider}, model=${agent.model}`,
            agent.id
          );

          // Execute agent with retry logic for transient failures
          const result = await this.executeAgentWithRetry(
            execution.id,
            agent,
            {
              agentId: agent.id,
              messages: contextMessages,
              temperature: agent.temperature || 70,
              maxTokens: agent.maxTokens || 1000,
              knowledgeContext: relevantKnowledge,
            },
            3 // max retries
          );

        // Track cost for this execution
        const providerUsed = result.provider || agent.provider;
        const modelUsed = result.model || agent.model;
        if (result.tokenCount > 0) {
          try {
            await costTracker.trackExecutionCost(
              execution.id,
              agent.id,
              providerUsed,
              modelUsed,
              {
                inputTokens: Math.round(result.tokenCount * 0.4), // Rough estimate
                outputTokens: Math.round(result.tokenCount * 0.6),
                totalTokens: result.tokenCount,
              }
            );
          } catch (costError: any) {
            console.error('Error tracking cost:', costError);
            // Don't fail execution if cost tracking fails
          }
        }

          await storage.createAgentMessage({
            executionId: execution.id,
            agentId: agent.id,
            role: 'assistant',
            content: result.content,
            tokenCount: result.tokenCount,
          });

          // Extract and store new knowledge from agent response
          await this.extractAndStoreKnowledge(
            workflow.userId,
            agent,
            result.content,
            execution.id
          );
        // Log if fallback was used
        if (result.fallbackUsed) {
          await this.logExecution(
            execution.id,
            'info',
            `Fallback used: switched from ${agent.provider} to ${providerUsed}`,
            agent.id
          );
        }
        // Emit agent message
        wsManager.emitMessage(execution.id, agent.id, agent.name, 'assistant', result.content);

        // Track execution costs
        if (result.promptTokens !== undefined && result.completionTokens !== undefined && result.costUsd !== undefined) {
          await storage.createExecutionCost({
            executionId: execution.id,
            agentId: agent.id,
            provider: agent.provider,
            model: agent.model,
            promptTokens: result.promptTokens,
            completionTokens: result.completionTokens,
            totalTokens: result.tokenCount,
            costUsd: result.costUsd,
          });
        }

        // Extract and store new knowledge from agent response
        await this.extractAndStoreKnowledge(
          workflow.userId,
          agent,
          result.content,
          execution.id
        );

          nodeResults.set(nodeId, result);

          const stepDuration = Date.now() - stepStartTime;
          await this.logExecution(
            execution.id,
            'info',
            `Step ${stepIndex + 1} completed: ${agent.name} finished in ${stepDuration}ms with ${result.tokenCount} tokens`,
            agent.id,
            stepIndex
          );
        } catch (stepError: any) {
          await this.logExecution(
            execution.id,
            'error',
            `Step ${stepIndex + 1} failed: ${stepError.message}`,
            agent.id,
            stepIndex
          );
          throw stepError;
        }
        // Emit agent completed event
        wsManager.emitAgentCompleted(execution.id, agent.id, agent.name, result);

        await this.logExecution(
          execution.id,
          'info',
          `Agent ${agent.name} completed with ${result.tokenCount} tokens`,
          agent.id
        );
      }

      const lastNodeId = executionOrder[executionOrder.length - 1];
      const finalResult = nodeResults.get(lastNodeId);

      const duration = Date.now() - new Date(execution.startedAt).getTime();
      const completedExecution = await storage.updateExecution(execution.id, {
        status: 'completed',
        output: { result: finalResult?.content || '' },
      });

      // Update version statistics
      try {
        await versionManager.updateVersionStats(workflowId, true, duration);
      } catch (versionError: any) {
        console.error('Error updating version stats:', versionError);
      }

      await this.logExecution(execution.id, 'info', 'Workflow execution completed');

      // Emit execution completed event
      wsManager.emitExecutionCompleted(execution.id, { result: finalResult?.content || '' });

      return completedExecution!;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      try {
        const duration = Date.now() - new Date(execution.startedAt).getTime();
        await storage.updateExecution(execution.id, {
          status: 'error',
          error: errorMessage,
        });

        // Update version statistics with failure
        try {
          await versionManager.updateVersionStats(workflowId, false, duration);
        } catch (versionError: any) {
          console.error('Error updating version stats:', versionError);
        }

        await this.logExecution(
          execution.id,
          'error',
          `Workflow execution failed: ${errorMessage}`
        );

        // Emit execution failed event
        wsManager.emitExecutionFailed(execution.id, errorMessage);
      } catch (updateError: any) {
        console.error('Failed to update execution with error status:', updateError);
      }

      throw error;
    }
  }

  private async executeAgentWithRetry(
    executionId: string,
    agent: Agent,
    context: any,
    maxRetries: number
  ): Promise<any> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await aiExecutor.executeAgent(agent, context);
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable (rate limits, transient network errors)
        const isRetryable = 
          error.message?.includes('429') || 
          error.message?.includes('rate limit') ||
          error.message?.includes('timeout') ||
          error.message?.includes('network') ||
          error.status === 429 ||
          error.status === 503;

        if (!isRetryable || attempt === maxRetries) {
          // Not retryable or max retries reached
          throw error;
        }

        // Log retry attempt
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
        await this.logExecution(
          executionId,
          'warning',
          `Agent execution failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${delay}ms...`,
          agent.id
        );

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError || new Error('Agent execution failed after retries');
  }

  private getCategoriesForAgent(agentType: string): string[] {
    // Map agent types to relevant knowledge categories
    const categoryMap: Record<string, string[]> = {
      coordinator: ['general', 'workflow', 'coordination', 'planning', 'coding'],
      coder: ['general', 'coding', 'programming', 'algorithms', 'debugging'],
      researcher: ['general', 'research', 'analysis', 'data', 'insights'],
      database: ['general', 'database', 'sql', 'data-modeling', 'coding'],
      security: ['general', 'security', 'authentication', 'encryption', 'coding'],
      custom: ['general', 'custom', 'coding'],
    };

    return categoryMap[agentType] || ['general'];
  }

  private async extractAndStoreKnowledge(
    userId: string,
    agent: Agent,
    response: string,
    executionId: string
  ): Promise<void> {
    try {
      // Extract key learnings from the response
      const learnings = this.extractLearnings(response);
      
      if (learnings.length === 0) return;

      const agentType = agent.role.toLowerCase();
      
      for (const learning of learnings) {
        await storage.createKnowledgeEntry({
          userId,
          agentType,
          category: learning.category,
          content: learning.content,
          context: learning.context,
          sourceExecutionId: executionId,
          sourceAgentId: agent.id,
          confidence: learning.confidence || 80,
        });
      }

      await this.logExecution(
        executionId,
        'info',
        `Stored ${learnings.length} new knowledge entries`,
        agent.id
      );
    } catch (error: any) {
      console.error('Failed to extract and store knowledge:', error);
      // Don't fail the workflow if knowledge extraction fails
    }
  }

  private extractLearnings(response: string): Array<{
    category: string;
    content: string;
    context?: string;
    confidence?: number;
  }> {
    const learnings: Array<{
      category: string;
      content: string;
      context?: string;
      confidence?: number;
    }> = [];

    // Pattern 1: Look for explicit learning markers
    const learningPatterns = [
      /(?:learned|discovered|found|realized):\s*(.+?)(?:\n|$)/gi,
      /(?:key insight|important):\s*(.+?)(?:\n|$)/gi,
      /(?:best practice|tip|recommendation):\s*(.+?)(?:\n|$)/gi,
    ];

    for (const pattern of learningPatterns) {
      const matches = response.matchAll(pattern);
      for (const match of matches) {
        if (match[1] && match[1].length > 10) {
          learnings.push({
            category: 'general',
            content: match[1].trim(),
            confidence: 75,
          });
        }
      }
    }

    // Pattern 2: Extract code snippets as coding knowledge
    const codePattern = /```[\w]*\n([\s\S]+?)```/g;
    const codeMatches = response.matchAll(codePattern);
    for (const match of codeMatches) {
      if (match[1] && match[1].length > 20) {
        learnings.push({
          category: 'coding',
          content: match[1].trim(),
          context: 'Code example from execution',
          confidence: 85,
        });
      }
    }

    // Pattern 3: Extract important conclusions or summaries
    const conclusionPattern = /(?:in conclusion|summary|to summarize|overall):\s*(.+?)(?:\n\n|$)/gis;
    const conclusionMatches = response.matchAll(conclusionPattern);
    for (const match of conclusionMatches) {
      if (match[1] && match[1].length > 20) {
        learnings.push({
          category: 'general',
          content: match[1].trim(),
          confidence: 80,
        });
      }
    }

    return learnings;
  }

  private topologicalSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();
    
    nodes.forEach(node => {
      inDegree.set(node.id, 0);
      adjList.set(node.id, []);
    });

    edges.forEach(edge => {
      adjList.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    const result: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      const neighbors = adjList.get(current) || [];
      neighbors.forEach(neighbor => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    // Check if all nodes were processed (cycle detection)
    if (result.length !== nodes.length) {
      throw new Error(
        `Workflow has a circular dependency. Only ${result.length} of ${nodes.length} nodes could be processed.`
      );
    }

    return result;
  }

  private async logExecution(
    executionId: string,
    level: string,
    message: string,
    agentId?: string,
    stepIndex?: number,
    metadata?: any
  ): Promise<void> {
    await storage.createExecutionLog({
      executionId,
      agentId: agentId || null,
      level,
      message,
      stepIndex: stepIndex !== undefined ? stepIndex : null,
      metadata: metadata || null,
    });

    // Emit log via WebSocket
    wsManager.emitLog(executionId, level, message, agentId);
  }
}

export const orchestrator = new WorkflowOrchestrator();
