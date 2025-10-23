import { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  ReactFlowInstance,
  useReactFlow,
} from '@xyflow/react';
import { snapToGrid, getAlignmentGuides } from '@/lib/workflow-layout';

interface WorkflowCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick?: (event: React.MouseEvent, node: Node) => void;
  nodeTypes: any;
  showGrid?: boolean;
  gridSize?: number;
  snapToGridEnabled?: boolean;
  children?: React.ReactNode;
}

interface AlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
}

export function WorkflowCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  nodeTypes,
  showGrid = true,
  gridSize = 20,
  snapToGridEnabled = true,
  children,
}: WorkflowCanvasProps) {
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const modifiedChanges = changes.map(change => {
        // Check if node is being dragged
        if (change.type === 'position' && change.dragging) {
          setIsDragging(true);
          setDraggedNodeId(change.id);

          if (snapToGridEnabled && change.position) {
            const snapped = snapToGrid(change.position, gridSize);
            return { ...change, position: snapped };
          }

          // Calculate alignment guides
          if (change.position) {
            const draggedNode = nodes.find(n => n.id === change.id);
            if (draggedNode) {
              const tempNode = { ...draggedNode, position: change.position };
              const guides = getAlignmentGuides(tempNode, nodes, 10);
              setAlignmentGuides(guides);
            }
          }
        } else if (change.type === 'position' && !change.dragging) {
          setIsDragging(false);
          setDraggedNodeId(null);
          setAlignmentGuides([]);
        }

        return change;
      });

      onNodesChange(modifiedChanges);
    },
    [nodes, onNodesChange, snapToGridEnabled, gridSize]
  );

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        snapToGrid={snapToGridEnabled}
        snapGrid={[gridSize, gridSize]}
        data-testid="workflow-canvas"
      >
        <Background
          variant={showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines}
          gap={gridSize}
          size={1}
          style={{ opacity: showGrid ? 0.5 : 0 }}
        />
        
        {children}

        {/* Alignment Guides Overlay */}
        {isDragging && alignmentGuides.length > 0 && (
          <svg
            className="absolute inset-0 pointer-events-none z-50"
            style={{ width: '100%', height: '100%' }}
          >
            {alignmentGuides.map((guide, index) => {
              if (guide.type === 'horizontal') {
                return (
                  <line
                    key={`h-${index}`}
                    x1="0"
                    y1={guide.position}
                    x2="100%"
                    y2={guide.position}
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              } else {
                return (
                  <line
                    key={`v-${index}`}
                    x1={guide.position}
                    y1="0"
                    x2={guide.position}
                    y2="100%"
                    stroke="#06b6d4"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />
                );
              }
            })}
          </svg>
        )}
      </ReactFlow>
    </div>
  );
}

/**
 * Hook for zoom controls
 */
export function useZoomControls() {
  const reactFlowInstance = useReactFlow();

  const zoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);

  const zoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);

  const fitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);

  const resetView = useCallback(() => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  }, [reactFlowInstance]);

  const zoomTo = useCallback(
    (zoom: number) => {
      reactFlowInstance.zoomTo(zoom, { duration: 300 });
    },
    [reactFlowInstance]
  );

  return {
    zoomIn,
    zoomOut,
    fitView,
    resetView,
    zoomTo,
    getZoom: () => reactFlowInstance.getZoom(),
  };
}

/**
 * Zoom level indicator
 */
export function ZoomIndicator() {
  const reactFlowInstance = useReactFlow();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const handleZoom = () => {
      setZoom(reactFlowInstance.getZoom());
    };

    // Update zoom on initial mount
    handleZoom();
    
    // Set up interval to periodically check zoom
    const interval = setInterval(handleZoom, 100);
    
    return () => {
      clearInterval(interval);
    };
  }, [reactFlowInstance]);

  return (
    <div className="absolute bottom-4 left-4 z-10 bg-card border rounded-lg shadow-lg px-3 py-1.5">
      <span className="text-xs font-mono">{Math.round(zoom * 100)}%</span>
    </div>
  );
}
