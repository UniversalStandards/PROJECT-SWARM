import { useCallback, useState } from 'react';
import { NodeChange, Node } from '@xyflow/react';
import { snapToGrid } from '@/lib/workflow-layout';

export interface GridSnappingOptions {
  enabled: boolean;
  gridSize: number;
  showGrid: boolean;
}

export function useGridSnapping(initialOptions: Partial<GridSnappingOptions> = {}) {
  const [options, setOptions] = useState<GridSnappingOptions>({
    enabled: initialOptions.enabled ?? true,
    gridSize: initialOptions.gridSize ?? 20,
    showGrid: initialOptions.showGrid ?? true,
  });
  
  const [shiftPressed, setShiftPressed] = useState(false);
  
  // Handle keyboard events for shift key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftPressed(true);
    }
  }, []);
  
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      setShiftPressed(false);
    }
  }, []);
  
  // Apply snapping to node changes
  const applySnapping = useCallback(
    (changes: NodeChange[]): NodeChange[] => {
      // Only snap if enabled and shift is not pressed
      if (!options.enabled || shiftPressed) {
        return changes;
      }
      
      return changes.map(change => {
        if (change.type === 'position' && change.position && !change.dragging) {
          // Snap to grid when drag ends
          const snapped = snapToGrid(change.position, options.gridSize);
          return {
            ...change,
            position: snapped,
          };
        }
        return change;
      });
    },
    [options.enabled, options.gridSize, shiftPressed]
  );
  
  // Snap all nodes to grid
  const snapAllNodesToGrid = useCallback(
    (nodes: Node[]): Node[] => {
      return nodes.map(node => ({
        ...node,
        position: snapToGrid(node.position, options.gridSize),
      }));
    },
    [options.gridSize]
  );
  
  const updateOptions = useCallback((newOptions: Partial<GridSnappingOptions>) => {
    setOptions(prev => ({ ...prev, ...newOptions }));
  }, []);
  
  return {
    options,
    updateOptions,
    applySnapping,
    snapAllNodesToGrid,
    handleKeyDown,
    handleKeyUp,
    isShiftPressed: shiftPressed,
  };
}
