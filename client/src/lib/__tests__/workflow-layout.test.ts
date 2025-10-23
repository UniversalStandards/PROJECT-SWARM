import { describe, it, expect } from 'vitest';
import { 
  snapToGrid, 
  checkAlignment, 
  alignNodes, 
  distributeNodes,
  getAlignmentGuides 
} from '../workflow-layout';
import { Node } from '@xyflow/react';

describe('workflow-layout', () => {
  describe('snapToGrid', () => {
    it('should snap position to grid', () => {
      expect(snapToGrid({ x: 12, y: 18 }, 20)).toEqual({ x: 20, y: 20 });
      expect(snapToGrid({ x: 45, y: 55 }, 20)).toEqual({ x: 40, y: 60 });
      expect(snapToGrid({ x: 100, y: 100 }, 50)).toEqual({ x: 100, y: 100 });
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
