import type { Workflow, Agent, Execution } from '@shared/schema';
import { storage } from '../storage';
import { aiExecutor } from './executor';

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

    const agents = await storage.getAgentsByWorkflowId(workflowId);
    const execution = await storage.createExecution({
      workflowId,
      userId: workflow.userId,
      status: 'running',
      input,
    });

    try {
      await this.logExecution(execution.id, 'info', 'Workflow execution started');
      
      const nodes = workflow.nodes as WorkflowNode[];
      const edges = workflow.edges as WorkflowEdge[];
      
      const agentMap = new Map<string, Agent>();
      agents.forEach(agent => agentMap.set(agent.nodeId, agent));

      const nodeResults = new Map<string, any>();
      const executionOrder = this.topologicalSort(nodes, edges);

      for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        const agent = agentMap.get(nodeId);
        
        if (!node || !agent) continue;

        await this.logExecution(
          execution.id, 
          'info', 
          `Executing agent: ${agent.name}`,
          agent.id
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

        const result = await aiExecutor.executeAgent(agent, {
          agentId: agent.id,
          messages: contextMessages,
          temperature: agent.temperature || 70,
          maxTokens: agent.maxTokens || 1000,
          knowledgeContext: relevantKnowledge,
        });

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

        nodeResults.set(nodeId, result);

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

      await this.logExecution(execution.id, 'info', 'Workflow execution completed');

      return completedExecution!;
    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      try {
        await storage.updateExecution(execution.id, {
          status: 'error',
          error: errorMessage,
        });

        await this.logExecution(
          execution.id,
          'error',
          `Workflow execution failed: ${errorMessage}`
        );
      } catch (updateError: any) {
        console.error('Failed to update execution with error status:', updateError);
      }

      throw error;
    }
  }

  private getCategoriesForAgent(agentType: string): string[] {
    // Map agent types to relevant knowledge categories
    const categoryMap: Record<string, string[]> = {
      coordinator: ['general', 'workflow', 'coordination', 'planning'],
      coder: ['general', 'coding', 'programming', 'algorithms', 'debugging'],
      researcher: ['general', 'research', 'analysis', 'data', 'insights'],
      database: ['general', 'database', 'sql', 'data-modeling'],
      security: ['general', 'security', 'authentication', 'encryption'],
      custom: ['general', 'custom'],
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

    return result;
  }

  private async logExecution(
    executionId: string,
    level: string,
    message: string,
    agentId?: string
  ): Promise<void> {
    await storage.createExecutionLog({
      executionId,
      agentId: agentId || null,
      level,
      message,
    });
  }
}

export const orchestrator = new WorkflowOrchestrator();
