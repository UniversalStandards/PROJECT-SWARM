import { MiniMap as ReactFlowMinimap } from '@xyflow/react';
import { memo } from 'react';

interface WorkflowMinimapProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  visible?: boolean;
}

export const WorkflowMinimap = memo(({ 
  position = 'bottom-right',
  visible = true 
}: WorkflowMinimapProps) => {
  if (!visible) return null;
  
  const positionStyles = {
    'top-left': { top: 10, left: 10, bottom: 'auto', right: 'auto' },
    'top-right': { top: 10, right: 10, bottom: 'auto', left: 'auto' },
    'bottom-left': { bottom: 10, left: 10, top: 'auto', right: 'auto' },
    'bottom-right': { bottom: 10, right: 10, top: 'auto', left: 'auto' },
  };
  
  return (
    <ReactFlowMinimap
      nodeColor={(node) => {
        const role = node.data?.role as string;
        const colorMap: Record<string, string> = {
          Coordinator: '#8b5cf6',
          Coder: '#a855f7',
          Researcher: '#f59e0b',
          Database: '#3b82f6',
          Security: '#10b981',
          Custom: '#64748b',
        };
        return colorMap[role] || '#64748b';
      }}
      nodeStrokeWidth={3}
      maskColor="rgba(0, 0, 0, 0.6)"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        ...positionStyles[position],
      }}
      pannable
      zoomable
    />
  );
});

WorkflowMinimap.displayName = 'WorkflowMinimap';
