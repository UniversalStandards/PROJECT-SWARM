// Unit tests for workflow layout algorithms
// Note: This project may not have Jest configured. These are example tests.

import { applyLayout, snapToGrid, checkAlignment, alignNodes, distributeNodes, getAlignmentGuides } from '../workflow-layout';
import { Node, Edge } from '@xyflow/react';
import { describe, it, expect } from 'vitest';
describe('workflow-layout', () => {
  describe('snapToGrid', () => {
    it('should snap position to grid', () => {
      expect(snapToGrid({ x: 15, y: 27 }, 10)).toEqual({ x: 20, y: 30 });
      expect(snapToGrid({ x: 42, y: 58 }, 20)).toEqual({ x: 40, y: 60 });
      expect(snapToGrid({ x: 123, y: 87 }, 50)).toEqual({ x: 100, y: 100 });
    });
    
    it('should handle negative coordinates', () => {
      expect(snapToGrid({ x: -15, y: -27 }, 10)).toEqual({ x: -20, y: -30 });
    });
    
    it('should handle zero', () => {
      expect(snapToGrid({ x: 0, y: 0 }, 20)).toEqual({ x: 0, y: 0 });
    });
  });
  
  describe('applyLayout', () => {
    const mockNodes: Node[] = [
      { id: '1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
      { id: '2', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
      { id: '3', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
    ];
    
    const mockEdges: Edge[] = [
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
    ];
    
    it('should apply hierarchical layout', () => {
      const result = applyLayout(mockNodes, mockEdges, { algorithm: 'hierarchical' });
      
      // Check that all nodes have positions
      expect(result.every(node => node.position.x !== undefined && node.position.y !== undefined)).toBe(true);
      
      // Check that nodes are in different levels (different y positions)
      expect(result[0].position.y).toBeLessThan(result[1].position.y);
      expect(result[1].position.y).toBeLessThan(result[2].position.y);
    });
    
    it('should apply force-directed layout', () => {
      const result = applyLayout(mockNodes, mockEdges, { algorithm: 'force' });
      
      // Check that all nodes have positions
      expect(result.every(node => node.position.x !== undefined && node.position.y !== undefined)).toBe(true);
      
      // Check that positions are non-negative
      expect(result.every(node => node.position.x >= 0 && node.position.y >= 0)).toBe(true);
    });
    
    it('should apply grid layout', () => {
      const result = applyLayout(mockNodes, mockEdges, { algorithm: 'grid' });
      
      // Check that all nodes have positions
      expect(result.every(node => node.position.x !== undefined && node.position.y !== undefined)).toBe(true);
      
      // Grid layout should have consistent spacing
      const spacing = result[1].position.x - result[0].position.x;
      expect(spacing).toBeGreaterThan(0);
    });
    
    it('should handle empty nodes array', () => {
      const result = applyLayout([], [], { algorithm: 'hierarchical' });
      expect(result).toEqual([]);
    });
    
    it('should handle disconnected nodes', () => {
      const disconnectedNodes: Node[] = [
        { id: '1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
        { id: '2', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
      ];
      
      const result = applyLayout(disconnectedNodes, [], { algorithm: 'hierarchical' });
      
      // Both should have positions
      expect(result.every(node => node.position.x !== undefined && node.position.y !== undefined)).toBe(true);
    });

    it('should handle negative coordinates', () => {
      expect(snapToGrid({ x: -12, y: -18 }, 20)).toEqual({ x: 0, y: 0 });
    });
  });

  describe('checkAlignment', () => {
    it('should detect horizontal alignment', () => {
      const result = checkAlignment({ x: 10, y: 100 }, { x: 50, y: 102 }, 5);
      expect(result.horizontal).toBe(true);
      expect(result.vertical).toBe(false);
    });

    it('should detect vertical alignment', () => {
      const result = checkAlignment({ x: 100, y: 10 }, { x: 102, y: 50 }, 5);
      expect(result.horizontal).toBe(false);
      expect(result.vertical).toBe(true);
    });

    it('should not detect alignment when threshold exceeded', () => {
      const result = checkAlignment({ x: 10, y: 100 }, { x: 50, y: 110 }, 5);
      expect(result.horizontal).toBe(false);
      expect(result.vertical).toBe(false);
    });
  });

  describe('alignNodes', () => {
    const createNode = (id: string, x: number, y: number): Node => ({
      id,
      position: { x, y },
      data: {},
      type: 'default',
    });

    it('should align nodes to the left', () => {
      const nodes = [
        createNode('1', 100, 50),
        createNode('2', 200, 100),
        createNode('3', 150, 150),
      ];

      const aligned = alignNodes(nodes, 'left');
      expect(aligned[0].position.x).toBe(100);
      expect(aligned[1].position.x).toBe(100);
      expect(aligned[2].position.x).toBe(100);
    });

    it('should align nodes to the right', () => {
      const nodes = [
        createNode('1', 100, 50),
        createNode('2', 200, 100),
        createNode('3', 150, 150),
      ];

      const aligned = alignNodes(nodes, 'right');
      expect(aligned[0].position.x).toBe(200);
      expect(aligned[1].position.x).toBe(200);
      expect(aligned[2].position.x).toBe(200);
    });

    it('should align nodes to the top', () => {
      const nodes = [
        createNode('1', 100, 50),
        createNode('2', 200, 100),
        createNode('3', 150, 150),
      ];

      const aligned = alignNodes(nodes, 'top');
      expect(aligned[0].position.y).toBe(50);
      expect(aligned[1].position.y).toBe(50);
      expect(aligned[2].position.y).toBe(50);
    });

    it('should center nodes horizontally', () => {
      const nodes = [
        createNode('1', 100, 0),
        createNode('2', 200, 100),
        createNode('3', 150, 200),
      ];

      const aligned = alignNodes(nodes, 'center-h');
      const avgY = (0 + 100 + 200) / 3;
      expect(aligned[0].position.y).toBe(avgY);
      expect(aligned[1].position.y).toBe(avgY);
      expect(aligned[2].position.y).toBe(avgY);
    });
  });

  describe('distributeNodes', () => {
    const createNode = (id: string, x: number, y: number): Node => ({
      id,
      position: { x, y },
      data: {},
      type: 'default',
    });

    it('should distribute nodes horizontally', () => {
      const nodes = [
        createNode('1', 0, 100),
        createNode('2', 50, 100),
        createNode('3', 100, 100),
      ];

      const distributed = distributeNodes(nodes, 'horizontal');
      expect(distributed[0].position.x).toBe(0);
      expect(distributed[1].position.x).toBe(50);
      expect(distributed[2].position.x).toBe(100);
    });

    it('should distribute nodes vertically', () => {
      const nodes = [
        createNode('1', 100, 0),
        createNode('2', 100, 50),
        createNode('3', 100, 100),
      ];

      const distributed = distributeNodes(nodes, 'vertical');
      expect(distributed[0].position.y).toBe(0);
      expect(distributed[1].position.y).toBe(50);
      expect(distributed[2].position.y).toBe(100);
    });

    it('should return nodes unchanged if less than 2 nodes', () => {
      const nodes = [createNode('1', 100, 100)];
      const distributed = distributeNodes(nodes, 'horizontal');
      expect(distributed).toEqual(nodes);
    });
  });

  describe('getAlignmentGuides', () => {
    const createNode = (id: string, x: number, y: number): Node => ({
      id,
      position: { x, y },
      data: {},
      type: 'default',
    });

    it('should return alignment guides for aligned nodes', () => {
      const draggedNode = createNode('1', 100, 100);
      const allNodes = [
        draggedNode,
        createNode('2', 200, 102), // Horizontally aligned
        createNode('3', 102, 200), // Vertically aligned
      ];

      const guides = getAlignmentGuides(draggedNode, allNodes, 5);
      expect(guides.length).toBeGreaterThan(0);
      
      const hasHorizontal = guides.some(g => g.type === 'horizontal');
      const hasVertical = guides.some(g => g.type === 'vertical');
      expect(hasHorizontal).toBe(true);
      expect(hasVertical).toBe(true);
    });

    it('should not include guides for the dragged node itself', () => {
      const draggedNode = createNode('1', 100, 100);
      const allNodes = [draggedNode];

      const guides = getAlignmentGuides(draggedNode, allNodes, 5);
      expect(guides.length).toBe(0);
    });
  });
});
