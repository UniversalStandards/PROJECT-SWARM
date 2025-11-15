import { Node, Edge, Connection } from '@xyflow/react';

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Validate if a connection is allowed
 */
export function validateConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection;
  
  // Check if source and target exist
  if (!source || !target) {
    return {
      valid: false,
      message: 'Invalid connection: missing source or target',
    };
  }
  
  // Prevent connecting node to itself
  if (source === target) {
    return {
      valid: false,
      message: 'Cannot connect a node to itself',
    };
  }
  
  // Check for duplicate connections
  const isDuplicate = edges.some(
    edge =>
      edge.source === source &&
      edge.target === target &&
      edge.sourceHandle === sourceHandle &&
      edge.targetHandle === targetHandle
  );
  
  if (isDuplicate) {
    return {
      valid: false,
      message: 'Connection already exists',
    };
  }
  
  // Check for cycles (optional - comment out if cycles are allowed)
  if (wouldCreateCycle(source, target, edges)) {
    return {
      valid: false,
      message: 'Connection would create a cycle',
    };
  }
  
  return {
    valid: true,
  };
}

/**
 * Check if adding an edge would create a cycle
 * Uses DFS to detect cycles
 */
function wouldCreateCycle(source: string, target: string, edges: Edge[]): boolean {
  // Build adjacency map including the new edge
  const adjacency = new Map<string, string[]>();
  
  edges.forEach(edge => {
    if (!adjacency.has(edge.source)) {
      adjacency.set(edge.source, []);
    }
    adjacency.get(edge.source)!.push(edge.target);
  });
  
  // Add the new edge temporarily
  if (!adjacency.has(source)) {
    adjacency.set(source, []);
  }
  adjacency.get(source)!.push(target);
  
  // DFS from target to see if we can reach source
  const visited = new Set<string>();
  const stack = [target];
  
  while (stack.length > 0) {
    const current = stack.pop()!;
    
    if (current === source) {
      return true; // Cycle detected
    }
    
    if (visited.has(current)) {
      continue;
    }
    
    visited.add(current);
    const neighbors = adjacency.get(current) || [];
    stack.push(...neighbors);
  }
  
  return false;
}

/**
 * Get connection style based on validation result
 */
export function getConnectionStyle(isValid: boolean): React.CSSProperties {
  return {
    stroke: isValid ? '#10b981' : '#ef4444',
    strokeWidth: 2,
  };
}

/**
 * Get node highlight class based on validation
 */
export function getNodeHighlightClass(isValid: boolean): string {
  if (isValid) {
    return 'ring-2 ring-green-500 ring-offset-2';
  }
  return 'ring-2 ring-red-500 ring-offset-2';
}
