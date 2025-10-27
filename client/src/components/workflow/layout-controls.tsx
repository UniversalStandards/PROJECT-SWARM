import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Layout, 
  GitBranch, 
  Circle, 
  Grid3x3, 
  Zap,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  RotateCcw,
} from 'lucide-react';
import { Node, Edge } from '@xyflow/react';
import { applyLayout, LayoutType, LayoutDirection, alignNodes, distributeNodes } from '@/lib/workflow-layout';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface LayoutControlsProps {
  nodes: Node[];
  edges: Edge[];
  selectedNodes: Node[];
  onNodesChange: (nodes: Node[]) => void;
  onReset: () => void;
}

export function LayoutControls({
  nodes,
  edges,
  selectedNodes,
  onNodesChange,
  onReset,
}: LayoutControlsProps) {
  const [isApplying, setIsApplying] = useState(false);

  const handleAutoArrange = async (type: LayoutType, direction?: LayoutDirection) => {
    setIsApplying(true);
    try {
      const layoutedNodes = await applyLayout(nodes, edges, { type, direction });
      onNodesChange(layoutedNodes);
    } catch (error) {
      console.error('Layout failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleAlign = (alignment: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
    if (selectedNodes.length < 2) return;
    
    const alignedNodes = alignNodes(selectedNodes, alignment);
    const updatedNodes = nodes.map(n => {
      const aligned = alignedNodes.find(an => an.id === n.id);
      return aligned || n;
    });
    
    onNodesChange(updatedNodes);
  };

  const handleDistribute = (direction: 'horizontal' | 'vertical') => {
    if (selectedNodes.length < 3) return;
    
    const distributedNodes = distributeNodes(selectedNodes, direction);
    const updatedNodes = nodes.map(n => {
      const distributed = distributedNodes.find(dn => dn.id === n.id);
      return distributed || n;
    });
    
    onNodesChange(updatedNodes);
  };

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        {/* Auto-Arrange */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isApplying || nodes.length === 0}
                  className="gap-2"
                  data-testid="button-auto-arrange"
                >
                  <Layout className="w-4 h-4" />
                  {isApplying ? 'Arranging...' : 'Auto-Arrange'}
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>Apply automatic layout to workflow</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleAutoArrange('hierarchical', 'TB')}>
              <GitBranch className="w-4 h-4 mr-2" />
              Vertical Flow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAutoArrange('hierarchical', 'LR')}>
              <GitBranch className="w-4 h-4 mr-2 rotate-90" />
              Horizontal Flow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAutoArrange('force')}>
              <Zap className="w-4 h-4 mr-2" />
              Force-Directed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAutoArrange('circular')}>
              <Circle className="w-4 h-4 mr-2" />
              Radial
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAutoArrange('grid')}>
              <Grid3x3 className="w-4 h-4 mr-2" />
              Grid
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Align (only show when multiple nodes selected) */}
        {selectedNodes.length >= 2 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <AlignHorizontalJustifyCenter className="w-4 h-4" />
                    Align
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Align selected nodes</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleAlign('left')}>
                Align Left
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('right')}>
                Align Right
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('top')}>
                Align Top
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('bottom')}>
                Align Bottom
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAlign('center-h')}>
                Center Horizontally
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('center-v')}>
                Center Vertically
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Distribute (only show when 3+ nodes selected) */}
        {selectedNodes.length >= 3 && (
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <AlignHorizontalSpaceAround className="w-4 h-4" />
                    Distribute
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>Distribute selected nodes evenly</p>
              </TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => handleDistribute('horizontal')}>
                <AlignHorizontalSpaceAround className="w-4 h-4 mr-2" />
                Horizontally
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDistribute('vertical')}>
                <AlignVerticalSpaceAround className="w-4 h-4 mr-2" />
                Vertically
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Reset Layout */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="gap-2"
              data-testid="button-reset-layout"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset to original layout</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
