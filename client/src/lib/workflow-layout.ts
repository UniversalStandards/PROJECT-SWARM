import ELK from 'elkjs/lib/elk.bundled.js';
import { Node, Edge } from '@xyflow/react';

const elk = new ELK();

export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';
export type LayoutType = 'hierarchical' | 'force' | 'circular' | 'grid';

export interface LayoutOptions {
  type: LayoutType;
  direction?: LayoutDirection;
  spacing?: number;
  padding?: number;
}

const DEFAULT_NODE_WIDTH = 250;
const DEFAULT_NODE_HEIGHT = 150;

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
        x: col * spacing + 50,
        y: row * spacing + 50,
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

  const { type, direction = 'TB', spacing = 100 } = options;

  switch (type) {
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
