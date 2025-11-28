import { z } from 'zod';
import type { Workflow } from '@shared/schema';
import { ValidationError, WorkflowValidationError } from '@shared/errors';

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

// Schema for validating workflow export/import format
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

export const workflowExportSchema = z.object({
  version: z.string().default('1.0'),
  metadata: z.object({
    name: z.string(),
    description: z.string().optional(),
    category: z.string().optional(),
    author: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    exportedAt: z.string(),
  }),
  workflow: z.object({
    nodes: z.array(nodeSchema),
    edges: z.array(edgeSchema),
  }),
  agents: z.array(z.object({
    name: z.string(),
    role: z.string(),
    description: z.string().optional(),
    provider: z.string(),
    model: z.string(),
    systemPrompt: z.string().optional().nullable(),
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    capabilities: z.array(z.any()).optional(),
    nodeId: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
  })).optional(),
  inputSchema: z.record(z.any()).optional(),
  outputSchema: z.record(z.any()).optional(),
  includeHistory: z.boolean().optional(),
  includeKnowledge: z.boolean().optional(),
  executionHistory: z.array(z.any()).optional(),
  knowledgeBase: z.array(z.any()).optional(),
});

export type WorkflowExport = z.infer<typeof workflowExportSchema>;

export class WorkflowValidator {
  /**
   * Validate workflow export data
   */
  validateExport(data: unknown): { valid: boolean; errors?: string[]; data?: WorkflowExport } {
    try {
      const validated = workflowExportSchema.parse(data);
      return { valid: true, data: validated };
    } catch (error: any) {
      if (error.errors) {
        const errors = error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: [error.message] };
    }
  }

  /**
   * Check for duplicate node IDs
   */
  checkDuplicateIds(nodes: any[]): string[] {
    const ids = new Set<string>();
    const duplicates: string[] = [];

    for (const node of nodes) {
      if (ids.has(node.id)) {
        duplicates.push(node.id);
      }
      ids.add(node.id);
    }

    return duplicates;
  }

  /**
   * Validate workflow structure
   */
  validateWorkflowStructure(nodes: any[], edges: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for orphaned nodes (nodes with no connections)
    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const orphanedNodes = nodes.filter(node => 
      node.type === 'agent' && !connectedNodes.has(node.id)
    );

    if (orphanedNodes.length > 0) {
      errors.push(`Found ${orphanedNodes.length} orphaned node(s): ${orphanedNodes.map(n => n.id).join(', ')}`);
    }

    // Check for invalid edge references
    const nodeIds = new Set(nodes.map(n => n.id));
    edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });

    // Check for cycles (simple detection)
    const hasCycle = this.detectCycle(nodes, edges);
    if (hasCycle) {
      errors.push('Workflow contains a cycle - this may cause infinite loops');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Simple cycle detection using DFS
   */
  private detectCycle(nodes: any[], edges: any[]): boolean {
    const graph = new Map<string, string[]>();
    
    // Build adjacency list
    nodes.forEach(node => graph.set(node.id, []));
    edges.forEach(edge => {
      const neighbors = graph.get(edge.source) || [];
      neighbors.push(edge.target);
      graph.set(edge.source, neighbors);
    });

    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const neighbors = graph.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Generate unique IDs for imported workflow to avoid conflicts
   */
  generateUniqueIds(nodes: any[], edges: any[]): { nodes: any[]; edges: any[] } {
    const idMap = new Map<string, string>();

    // Generate new IDs for all nodes
    const newNodes = nodes.map(node => {
      const newId = `${node.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      idMap.set(node.id, newId);
      return { ...node, id: newId };
    });

    // Update edge references
    const newEdges = edges.map(edge => ({
      ...edge,
      id: `${edge.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: idMap.get(edge.source) || edge.source,
      target: idMap.get(edge.target) || edge.target,
    }));

    return { nodes: newNodes, edges: newEdges };
  }

  /**
   * Validates a workflow for common issues
   */
  validate(workflow: Workflow): { valid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];
    const nodes = workflow.nodes as WorkflowNode[];
    const edges = workflow.edges as WorkflowEdge[];

    // Check if workflow has nodes
    if (!nodes || nodes.length === 0) {
      errors.push({
        field: 'nodes',
        message: 'Workflow must have at least one node',
        code: 'EMPTY_WORKFLOW',
      });
      return { valid: false, errors };
    }

    // Validate nodes have required fields
    const nodeFieldErrors = this.validateNodeFields(nodes);
    errors.push(...nodeFieldErrors);

    // Detect cycles in the workflow
    const cycleErrors = this.detectCycles(nodes, edges);
    errors.push(...cycleErrors);

    // Detect orphan nodes (nodes with no connections)
    const orphanErrors = this.detectOrphanNodes(nodes, edges);
    errors.push(...orphanErrors);

    // Detect disconnected workflow segments
    const disconnectedErrors = this.detectDisconnectedSegments(nodes, edges);
    errors.push(...disconnectedErrors);

    // Validate edge connections
    const edgeErrors = this.validateEdges(nodes, edges);
    errors.push(...edgeErrors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates that nodes have all required fields
   */
  private validateNodeFields(nodes: WorkflowNode[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const node of nodes) {
      if (!node.id) {
        errors.push({
          field: `nodes`,
          message: 'Node is missing required field: id',
          code: 'MISSING_NODE_ID',
        });
      }

      if (!node.type) {
        errors.push({
          field: `nodes[${node.id}].type`,
          message: `Node "${node.id}" is missing required field: type`,
          code: 'MISSING_NODE_TYPE',
        });
      }

      // For agent nodes, validate essential data fields
      if (node.type === 'agent') {
        if (!node.data) {
          errors.push({
            field: `nodes[${node.id}].data`,
            message: `Agent node "${node.id}" is missing data`,
            code: 'MISSING_NODE_DATA',
          });
        } else {
          if (!node.data.role) {
            errors.push({
              field: `nodes[${node.id}].data.role`,
              message: `Agent node "${node.id}" is missing role`,
              code: 'MISSING_AGENT_ROLE',
            });
          }

          if (!node.data.provider) {
            errors.push({
              field: `nodes[${node.id}].data.provider`,
              message: `Agent node "${node.id}" is missing provider`,
              code: 'MISSING_AGENT_PROVIDER',
            });
          }

          if (!node.data.model) {
            errors.push({
              field: `nodes[${node.id}].data.model`,
              message: `Agent node "${node.id}" is missing model`,
              code: 'MISSING_AGENT_MODEL',
            });
          }
        }
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push({
          field: `nodes[${node.id}].position`,
          message: `Node "${node.id}" has invalid position`,
          code: 'INVALID_NODE_POSITION',
        });
      }
    }

    return errors;
  }

  /**
   * Detects cycles in the workflow graph using DFS
   */
  private detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const adjList = new Map<string, string[]>();
    const visited = new Set<string>();
    const recStack = new Set<string>();

    // Build adjacency list
    nodes.forEach(node => adjList.set(node.id, []));
    edges.forEach(edge => {
      const neighbors = adjList.get(edge.source) || [];
      neighbors.push(edge.target);
      adjList.set(edge.source, neighbors);
    });

    // DFS to detect cycles
    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);
      path.push(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor, [...path])) {
            return true;
          }
        } else if (recStack.has(neighbor)) {
          // Cycle detected
          const cycleStartIndex = path.indexOf(neighbor);
          const cycle = [...path.slice(cycleStartIndex), neighbor];
          errors.push({
            field: 'edges',
            message: `Circular dependency detected: ${cycle.join(' → ')}`,
            code: 'CIRCULAR_DEPENDENCY',
          });
          return true;
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    // Check all nodes for cycles
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        dfs(node.id, []);
      }
    }

    return errors;
  }

  /**
   * Detects orphan nodes (nodes with no incoming or outgoing connections)
   */
  private detectOrphanNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Skip orphan detection if there's only one node (it's the entire workflow)
    if (nodes.length <= 1) {
      return errors;
    }

    const connectedNodes = new Set<string>();
    edges.forEach(edge => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    for (const node of nodes) {
      if (!connectedNodes.has(node.id)) {
        errors.push({
          field: `nodes[${node.id}]`,
          message: `Node "${node.id}" (${node.data?.label || node.type}) has no connections`,
          code: 'ORPHAN_NODE',
        });
      }
    }

    return errors;
  }

  /**
   * Detects disconnected segments in the workflow
   */
  private detectDisconnectedSegments(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];

    // Skip if only one node or no nodes
    if (nodes.length <= 1) {
      return errors;
    }

    // Build adjacency list (undirected for connectivity check)
    const adjList = new Map<string, Set<string>>();
    nodes.forEach(node => adjList.set(node.id, new Set()));
    edges.forEach(edge => {
      adjList.get(edge.source)?.add(edge.target);
      adjList.get(edge.target)?.add(edge.source);
    });

    // BFS to find connected components
    const visited = new Set<string>();
    const components: string[][] = [];

    const bfs = (startNode: string): string[] => {
      const queue = [startNode];
      const component: string[] = [];
      visited.add(startNode);

      while (queue.length > 0) {
        const current = queue.shift()!;
        component.push(current);

        const neighbors = adjList.get(current) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }

      return component;
    };

    // Find all connected components
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const component = bfs(node.id);
        components.push(component);
      }
    }

    // If there's more than one component, workflow is disconnected
    if (components.length > 1) {
      errors.push({
        field: 'workflow',
        message: `Workflow has ${components.length} disconnected segments. All nodes must be connected.`,
        code: 'DISCONNECTED_WORKFLOW',
      });
    }

    return errors;
  }

  /**
   * Validates that edges reference existing nodes
   */
  private validateEdges(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationError[] {
    const errors: ValidationError[] = [];
    const nodeIds = new Set(nodes.map(n => n.id));

    for (const edge of edges) {
      if (!edge.id) {
        errors.push({
          field: 'edges',
          message: 'Edge is missing required field: id',
          code: 'MISSING_EDGE_ID',
        });
      }

      if (!edge.source) {
        errors.push({
          field: `edges[${edge.id}].source`,
          message: `Edge "${edge.id}" is missing source`,
          code: 'MISSING_EDGE_SOURCE',
        });
      } else if (!nodeIds.has(edge.source)) {
        errors.push({
          field: `edges[${edge.id}].source`,
          message: `Edge "${edge.id}" references non-existent source node "${edge.source}"`,
          code: 'INVALID_EDGE_SOURCE',
        });
      }

      if (!edge.target) {
        errors.push({
          field: `edges[${edge.id}].target`,
          message: `Edge "${edge.id}" is missing target`,
          code: 'MISSING_EDGE_TARGET',
        });
      } else if (!nodeIds.has(edge.target)) {
        errors.push({
          field: `edges[${edge.id}].target`,
          message: `Edge "${edge.id}" references non-existent target node "${edge.target}"`,
          code: 'INVALID_EDGE_TARGET',
        });
      }
    }

    return errors;
  }

  /**
   * Throws a WorkflowValidationError if validation fails
   */
  validateOrThrow(workflow: Workflow): void {
    const result = this.validate(workflow);
    if (!result.valid) {
      throw new WorkflowValidationError(result.errors);
    }
  }
}

export const workflowValidator = new WorkflowValidator();
