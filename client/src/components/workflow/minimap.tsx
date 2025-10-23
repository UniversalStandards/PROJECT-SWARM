import { useState } from 'react';
import { MiniMap as ReactFlowMiniMap } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MinimapProps {
  nodeColor?: (node: any) => string;
}

const roleColors: Record<string, string> = {
  Coordinator: '#06b6d4',
  Coder: '#a855f7',
  Researcher: '#f59e0b',
  Database: '#3b82f6',
  Security: '#10b981',
  Custom: '#64748b',
};

export function Minimap({ nodeColor }: MinimapProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');

  const getNodeColor = (node: any) => {
    if (nodeColor) return nodeColor(node);
    return roleColors[node.data?.role] || roleColors.Custom;
  };

  const sizeConfig = {
    small: { width: 150, height: 100 },
    medium: { width: 200, height: 150 },
    large: { width: 300, height: 200 },
  };

  const { width, height } = sizeConfig[size];

  if (isCollapsed) {
    return (
      <div className="absolute bottom-4 right-4 z-10">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsCollapsed(false)}
          className="gap-2 shadow-lg"
          data-testid="button-expand-minimap"
        >
          <ChevronUp className="w-4 h-4" />
          Show Minimap
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="absolute bottom-4 right-4 z-10 bg-card border rounded-lg shadow-xl overflow-hidden"
      style={{ width: width + 40, height: height + 60 }}
      data-testid="minimap-container"
    >
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium">Minimap</span>
          <div className="flex gap-1">
            <Badge
              variant={size === 'small' ? 'default' : 'outline'}
              className="text-xs cursor-pointer h-5 px-2"
              onClick={() => setSize('small')}
            >
              S
            </Badge>
            <Badge
              variant={size === 'medium' ? 'default' : 'outline'}
              className="text-xs cursor-pointer h-5 px-2"
              onClick={() => setSize('medium')}
            >
              M
            </Badge>
            <Badge
              variant={size === 'large' ? 'default' : 'outline'}
              className="text-xs cursor-pointer h-5 px-2"
              onClick={() => setSize('large')}
            >
              L
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(true)}
          className="h-6 w-6 p-0"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2">
        <ReactFlowMiniMap
          nodeColor={getNodeColor}
          style={{
            width,
            height,
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          maskColor="rgba(0, 0, 0, 0.2)"
          pannable
          zoomable
          data-testid="minimap"
        />
      </div>
      <div className="px-2 pb-2 text-xs text-muted-foreground">
        Press <kbd className="px-1 py-0.5 bg-muted rounded border">M</kbd> to toggle
      </div>
    </div>
  );
}
