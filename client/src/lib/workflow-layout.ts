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
 * Apply hierarchical layout using ELK
 */
async function applyHierarchicalLayout(
  nodes: Node[],
  edges: Edge[],
  direction: LayoutDirection = 'TB',
  spacing: number = 80
): Promise<Node[]> {
  const isHorizontal = direction === 'LR' || direction === 'RL';
  
  const graph = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': direction,
      'elk.spacing.nodeNode': String(spacing),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(spacing),
      'elk.spacing.edgeNode': String(spacing / 2),
    },
    children: nodes.map(node => ({
      id: node.id,
      width: node.width || DEFAULT_NODE_WIDTH,
      height: node.height || DEFAULT_NODE_HEIGHT,
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  const layout = await elk.layout(graph);
  
  const layoutedNodes = nodes.map(node => {
    const layoutNode = layout.children?.find(n => n.id === node.id);
    if (layoutNode) {
      return {
        ...node,
        position: {
          x: layoutNode.x || 0,
          y: layoutNode.y || 0,
        },
      };
    }
    return node;
  });

  return layoutedNodes;
}

/**
 * Apply force-directed layout (spring model)
 */
function applyForceLayout(
  nodes: Node[],
  edges: Edge[],
  spacing: number = 100
): Node[] {
  // Simple force-directed layout implementation
  const layoutNodes = nodes.map(node => ({
    ...node,
    position: node.position,
    velocity: { x: 0, y: 0 },
  }));

  const iterations = 50;
  const repulsionStrength = 5000;
  const attractionStrength = 0.1;
  const damping = 0.85;

  for (let iter = 0; iter < iterations; iter++) {
    // Apply repulsion between all nodes
    for (let i = 0; i < layoutNodes.length; i++) {
      for (let j = i + 1; j < layoutNodes.length; j++) {
        const dx = layoutNodes[j].position.x - layoutNodes[i].position.x;
        const dy = layoutNodes[j].position.y - layoutNodes[i].position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsionStrength / (distance * distance);
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        layoutNodes[i].velocity.x -= fx;
        layoutNodes[i].velocity.y -= fy;
        layoutNodes[j].velocity.x += fx;
        layoutNodes[j].velocity.y += fy;
      }
    }

    // Apply attraction along edges
    edges.forEach(edge => {
      const sourceNode = layoutNodes.find(n => n.id === edge.source);
      const targetNode = layoutNodes.find(n => n.id === edge.target);
      
      if (sourceNode && targetNode) {
        const dx = targetNode.position.x - sourceNode.position.x;
        const dy = targetNode.position.y - sourceNode.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - spacing) * attractionStrength;
        
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        sourceNode.velocity.x += fx;
        sourceNode.velocity.y += fy;
        targetNode.velocity.x -= fx;
        targetNode.velocity.y -= fy;
      }
    });

    // Apply velocity and damping
    layoutNodes.forEach(node => {
      node.position.x += node.velocity.x;
      node.position.y += node.velocity.y;
      node.velocity.x *= damping;
      node.velocity.y *= damping;
    });
  }

  return layoutNodes.map(({ velocity, ...node }) => node);
}

/**
 * Apply circular layout
 */
function applyCircularLayout(nodes: Node[], spacing: number = 200): Node[] {
  const radius = Math.max(spacing, (nodes.length * 80) / (2 * Math.PI));
  const centerX = radius + 100;
  const centerY = radius + 100;
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: centerX + radius * Math.cos(index * angleStep - Math.PI / 2),
      y: centerY + radius * Math.sin(index * angleStep - Math.PI / 2),
    },
  }));
}

/**
 * Apply grid layout
 */
function applyGridLayout(nodes: Node[], spacing: number = 250): Node[] {
  const cols = Math.ceil(Math.sqrt(nodes.length));
  
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      ...node,
      position: {
        x: col * spacing + 100,
        y: row * spacing + 100,
      },
    };
  });
}

/**
 * Main layout function
 */
export async function applyLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions
): Promise<Node[]> {
  if (nodes.length === 0) return nodes;

  const { algorithm, direction = 'TB', spacing = 100 } = options;

  switch (algorithm) {
    case 'hierarchical':
      return applyHierarchicalLayout(nodes, edges, direction, spacing);
    case 'force':
      return applyForceLayout(nodes, edges, spacing);
    case 'circular':
      return applyCircularLayout(nodes, spacing);
    case 'grid':
      return applyGridLayout(nodes, spacing);
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

/**
 * Check if two nodes are aligned
 */
export function checkAlignment(
  pos1: { x: number; y: number },
  pos2: { x: number; y: number },
  threshold: number = 5
): { horizontal: boolean; vertical: boolean } {
  return {
    horizontal: Math.abs(pos1.y - pos2.y) < threshold,
    vertical: Math.abs(pos1.x - pos2.x) < threshold,
  };
}

/**
 * Get alignment guides for a node being dragged
 */
export function getAlignmentGuides(
  draggedNode: Node,
  allNodes: Node[],
  threshold: number = 5
): Array<{ type: 'horizontal' | 'vertical'; position: number }> {
  const guides: Array<{ type: 'horizontal' | 'vertical'; position: number }> = [];
  
  allNodes.forEach(node => {
    if (node.id === draggedNode.id) return;
    
    const alignment = checkAlignment(draggedNode.position, node.position, threshold);
    
    if (alignment.horizontal) {
      guides.push({ type: 'horizontal', position: node.position.y });
    }
    if (alignment.vertical) {
      guides.push({ type: 'vertical', position: node.position.x });
    }
  });

  return guides;
}

/**
 * Align nodes to a common edge
 */
export function alignNodes(
  nodes: Node[],
  alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v'
): Node[] {
  if (nodes.length === 0) return nodes;

  const positions = nodes.map(n => n.position);
  
  switch (alignment) {
    case 'left': {
      const minX = Math.min(...positions.map(p => p.x));
      return nodes.map(n => ({ ...n, position: { ...n.position, x: minX } }));
    }
    case 'right': {
      const maxX = Math.max(...positions.map(p => p.x));
      return nodes.map(n => ({ ...n, position: { ...n.position, x: maxX } }));
    }
    case 'top': {
      const minY = Math.min(...positions.map(p => p.y));
      return nodes.map(n => ({ ...n, position: { ...n.position, y: minY } }));
    }
    case 'bottom': {
      const maxY = Math.max(...positions.map(p => p.y));
      return nodes.map(n => ({ ...n, position: { ...n.position, y: maxY } }));
    }
    case 'center-h': {
      const avgY = positions.reduce((sum, p) => sum + p.y, 0) / positions.length;
      return nodes.map(n => ({ ...n, position: { ...n.position, y: avgY } }));
    }
    case 'center-v': {
      const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      return nodes.map(n => ({ ...n, position: { ...n.position, x: avgX } }));
    }
    default:
      return nodes;
  }
}

/**
 * Distribute nodes evenly
 */
export function distributeNodes(
  nodes: Node[],
  direction: 'horizontal' | 'vertical',
  spacing?: number
): Node[] {
  if (nodes.length < 2) return nodes;

  const sortedNodes = [...nodes].sort((a, b) =>
    direction === 'horizontal'
      ? a.position.x - b.position.x
      : a.position.y - b.position.y
  );

  if (spacing !== undefined) {
    // Distribute with fixed spacing
    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        [direction === 'horizontal' ? 'x' : 'y']:
          sortedNodes[0].position[direction === 'horizontal' ? 'x' : 'y'] + index * spacing,
      },
    }));
  } else {
    // Distribute evenly between first and last
    const first = sortedNodes[0];
    const last = sortedNodes[sortedNodes.length - 1];
    const totalDistance =
      direction === 'horizontal'
        ? last.position.x - first.position.x
        : last.position.y - first.position.y;
    const step = totalDistance / (sortedNodes.length - 1);

    return sortedNodes.map((node, index) => ({
      ...node,
      position: {
        ...node.position,
        [direction === 'horizontal' ? 'x' : 'y']:
          first.position[direction === 'horizontal' ? 'x' : 'y'] + index * step,
      },
    }));
  }
}
