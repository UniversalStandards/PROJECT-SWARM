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
        });

        await storage.createAgentMessage({
          executionId: execution.id,
          agentId: agent.id,
          role: 'assistant',
          content: result.content,
          tokenCount: result.tokenCount,
        });

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
