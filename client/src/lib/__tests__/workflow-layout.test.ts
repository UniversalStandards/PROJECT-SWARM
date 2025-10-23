// Unit tests for workflow layout algorithms
// Note: This project may not have Jest configured. These are example tests.

import { applyLayout, snapToGrid } from '../workflow-layout';
import { Node, Edge } from '@xyflow/react';

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
  });
});
