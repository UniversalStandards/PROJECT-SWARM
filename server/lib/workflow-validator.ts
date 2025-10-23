import { z } from 'zod';

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
}

export const workflowValidator = new WorkflowValidator();
