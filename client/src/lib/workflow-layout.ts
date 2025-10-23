import { Node, Edge } from '@xyflow/react';

export type LayoutAlgorithm = 'hierarchical' | 'force' | 'grid';
export type LayoutDirection = 'TB' | 'BT' | 'LR' | 'RL';

interface LayoutOptions {
  algorithm?: LayoutAlgorithm;
  direction?: LayoutDirection;
  nodeSpacing?: number;
  rankSpacing?: number;
}

/**
 * Calculate hierarchical layout (top-to-bottom flow)
 * Uses a simple topological sort approach with level assignment
 */
function calculateHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB',
  nodeSpacing: number = 150,
  rankSpacing: number = 200
): Node[] {
  // Build adjacency map for topological sorting
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  });
  
  edges.forEach(edge => {
    const source = edge.source;
    const target = edge.target;
    adjacency.get(source)?.push(target);
    inDegree.set(target, (inDegree.get(target) || 0) + 1);
  });
  
  // Assign nodes to levels using BFS
  const levels: string[][] = [];
  const nodeLevel = new Map<string, number>();
  const queue: string[] = [];
  
  // Start with nodes that have no incoming edges
  nodes.forEach(node => {
    if (inDegree.get(node.id) === 0) {
      queue.push(node.id);
      nodeLevel.set(node.id, 0);
    }
  });
  
  // BFS to assign levels
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const level = nodeLevel.get(nodeId)!;
    
    if (!levels[level]) {
      levels[level] = [];
    }
    levels[level].push(nodeId);
    
    const neighbors = adjacency.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      const currentLevel = nodeLevel.get(neighbor);
      const newLevel = level + 1;
      
      if (currentLevel === undefined || newLevel > currentLevel) {
        nodeLevel.set(neighbor, newLevel);
        if (!queue.includes(neighbor)) {
          queue.push(neighbor);
        }
      }
    });
  }
  
  // Handle nodes not in any level (cycles or disconnected)
  nodes.forEach(node => {
    if (!nodeLevel.has(node.id)) {
      const lastLevel = levels.length;
      nodeLevel.set(node.id, lastLevel);
      if (!levels[lastLevel]) {
        levels[lastLevel] = [];
      }
      levels[lastLevel].push(node.id);
    }
  });
  
  // Position nodes based on levels
  return nodes.map(node => {
    const level = nodeLevel.get(node.id) || 0;
    const nodesInLevel = levels[level] || [];
    const indexInLevel = nodesInLevel.indexOf(node.id);
    const totalInLevel = nodesInLevel.length;
    
    let x, y;
    
    switch (direction) {
      case 'TB': // Top to Bottom
        x = (indexInLevel - (totalInLevel - 1) / 2) * nodeSpacing + 400;
        y = level * rankSpacing + 100;
        break;
      case 'BT': // Bottom to Top
        x = (indexInLevel - (totalInLevel - 1) / 2) * nodeSpacing + 400;
        y = (levels.length - level - 1) * rankSpacing + 100;
        break;
      case 'LR': // Left to Right
        x = level * rankSpacing + 100;
        y = (indexInLevel - (totalInLevel - 1) / 2) * nodeSpacing + 300;
        break;
      case 'RL': // Right to Left
        x = (levels.length - level - 1) * rankSpacing + 100;
        y = (indexInLevel - (totalInLevel - 1) / 2) * nodeSpacing + 300;
        break;
      default:
        x = (indexInLevel - (totalInLevel - 1) / 2) * nodeSpacing + 400;
        y = level * rankSpacing + 100;
    }
    
    return {
      ...node,
      position: { x, y },
    };
  });
}

/**
 * Calculate force-directed layout (organic spacing)
 * Simple force simulation for node positioning
 */
function calculateForceLayout(
  nodes: Node[],
  edges: Edge[],
  nodeSpacing: number = 200
): Node[] {
  const iterations = 50;
  const repulsionStrength = 10000;
  const attractionStrength = 0.01;
  const damping = 0.8;
  
  // Initialize positions if not set
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  nodes.forEach((node, i) => {
    positions.set(node.id, {
      x: node.position?.x ?? Math.cos(i * 2 * Math.PI / nodes.length) * 300 + 400,
      y: node.position?.y ?? Math.sin(i * 2 * Math.PI / nodes.length) * 300 + 300,
      vx: 0,
      vy: 0,
    });
  });
  
  // Run simulation
  for (let iter = 0; iter < iterations; iter++) {
    // Calculate repulsion forces (all pairs)
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const p1 = positions.get(nodes[i].id)!;
        const p2 = positions.get(nodes[j].id)!;
        
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy + 0.01; // Avoid division by zero
        const dist = Math.sqrt(distSq);
        
        const force = repulsionStrength / distSq;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        p1.vx -= fx;
        p1.vy -= fy;
        p2.vx += fx;
        p2.vy += fy;
      }
    }
    
    // Calculate attraction forces (connected nodes)
    edges.forEach(edge => {
      const p1 = positions.get(edge.source);
      const p2 = positions.get(edge.target);
      if (!p1 || !p2) return;
      
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const force = attractionStrength * dist;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      p1.vx += fx;
      p1.vy += fy;
      p2.vx -= fx;
      p2.vy -= fy;
    });
    
    // Update positions
    positions.forEach(pos => {
      pos.x += pos.vx;
      pos.y += pos.vy;
      pos.vx *= damping;
      pos.vy *= damping;
    });
  }
  
  // Center the layout
  let minX = Infinity, minY = Infinity;
  positions.forEach(pos => {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
  });
  
  return nodes.map(node => {
    const pos = positions.get(node.id)!;
    return {
      ...node,
      position: {
        x: pos.x - minX + 100,
        y: pos.y - minY + 100,
      },
    };
  });
}

/**
 * Calculate grid layout (aligned rows/columns)
 */
function calculateGridLayout(
  nodes: Node[],
  nodeSpacing: number = 200
): Node[] {
  const columns = Math.ceil(Math.sqrt(nodes.length));
  
  return nodes.map((node, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    
    return {
      ...node,
      position: {
        x: col * nodeSpacing + 100,
        y: row * nodeSpacing + 100,
      },
    };
  });
}

/**
 * Apply layout algorithm to nodes
 */
export function applyLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    algorithm = 'hierarchical',
    direction = 'TB',
    nodeSpacing = 150,
    rankSpacing = 200,
  } = options;
  
  if (nodes.length === 0) return nodes;
  
  switch (algorithm) {
    case 'hierarchical':
      return calculateHierarchicalLayout(nodes, edges, direction, nodeSpacing, rankSpacing);
    case 'force':
      return calculateForceLayout(nodes, edges, nodeSpacing);
    case 'grid':
      return calculateGridLayout(nodes, nodeSpacing);
    default:
      return nodes;
  }
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: { x: number; y: number }, gridSize: number): { x: number; y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}
