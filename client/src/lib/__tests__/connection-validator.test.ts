// Unit tests for connection validation
// Note: This project may not have Jest configured. These are example tests.

import { validateConnection } from '../connection-validator';
import { Node, Edge, Connection } from '@xyflow/react';

describe('connection-validator', () => {
  const mockNodes: Node[] = [
    { id: '1', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
    { id: '2', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
    { id: '3', type: 'agent', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
  ];
  
  describe('validateConnection', () => {
    it('should reject self-connections', () => {
      const connection: Connection = {
        source: '1',
        target: '1',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, []);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('itself');
    });
    
    it('should reject duplicate connections', () => {
      const existingEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2', sourceHandle: null, targetHandle: null },
      ];
      
      const connection: Connection = {
        source: '1',
        target: '2',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, existingEdges);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('already exists');
    });
    
    it('should reject connections that create cycles', () => {
      const existingEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' },
      ];
      
      // Trying to connect 3 back to 1 would create a cycle
      const connection: Connection = {
        source: '3',
        target: '1',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, existingEdges);
      
      expect(result.valid).toBe(false);
      expect(result.message).toContain('cycle');
    });
    
    it('should allow valid connections', () => {
      const existingEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];
      
      const connection: Connection = {
        source: '2',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, existingEdges);
      
      expect(result.valid).toBe(true);
      expect(result.message).toBeUndefined();
    });
    
    it('should handle missing source or target', () => {
      const connection: Connection = {
        source: null as any,
        target: '2',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, []);
      
      expect(result.valid).toBe(false);
    });
    
    it('should allow multiple connections from same source to different targets', () => {
      const existingEdges: Edge[] = [
        { id: 'e1-2', source: '1', target: '2' },
      ];
      
      const connection: Connection = {
        source: '1',
        target: '3',
        sourceHandle: null,
        targetHandle: null,
      };
      
      const result = validateConnection(connection, mockNodes, existingEdges);
      
      expect(result.valid).toBe(true);
    });
  });
});
