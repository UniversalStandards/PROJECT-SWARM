import { memo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Grid3x3,
  Map,
  Undo2,
  Redo2,
  Download,
  Maximize2,
  GitBranch,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { LayoutAlgorithm } from '@/lib/workflow-layout';

interface WorkflowToolbarProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onZoomToActual?: () => void;
  onAutoLayout?: (algorithm: LayoutAlgorithm) => void;
  onToggleGrid?: () => void;
  onToggleMinimap?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onExportImage?: () => void;
  onFullscreen?: () => void;
  gridEnabled?: boolean;
  minimapEnabled?: boolean;
  gridSize?: number;
  onGridSizeChange?: (size: number) => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const WorkflowToolbar = memo(({
  onZoomIn,
  onZoomOut,
  onFitView,
  onZoomToActual,
  onAutoLayout,
  onToggleGrid,
  onToggleMinimap,
  onUndo,
  onRedo,
  onExportImage,
  onFullscreen,
  gridEnabled = true,
  minimapEnabled = true,
  gridSize = 20,
  onGridSizeChange,
  canUndo = false,
  canRedo = false,
}: WorkflowToolbarProps) => {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg">
        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onZoomIn}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom In (⌘+)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onZoomOut}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom Out (⌘-)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onZoomToActual}
              >
                <Badge variant="secondary" className="h-6 px-2">100%</Badge>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Zoom to 100% (⌘0)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onFitView}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fit to View (⌘F)</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Layout Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Select 
                onValueChange={(value) => onAutoLayout?.(value as LayoutAlgorithm)}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <GitBranch className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Auto-Layout" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hierarchical">Hierarchical</SelectItem>
                  <SelectItem value="force">Force-Directed</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                </SelectContent>
              </Select>
            </TooltipTrigger>
            <TooltipContent>Apply Auto-Layout Algorithm</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Grid Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={gridEnabled ? "default" : "ghost"}
                size="sm"
                onClick={onToggleGrid}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Grid (⌘G)</TooltipContent>
          </Tooltip>
          
          {gridEnabled && (
            <Select 
              value={gridSize.toString()}
              onValueChange={(value) => onGridSizeChange?.(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10px</SelectItem>
                <SelectItem value="20">20px</SelectItem>
                <SelectItem value="50">50px</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* View Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant={minimapEnabled ? "default" : "ghost"}
                size="sm"
                onClick={onToggleMinimap}
              >
                <Map className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Toggle Minimap (⌘M)</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* History Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
              >
                <Undo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Undo (⌘Z)</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
              >
                <Redo2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Redo (⌘⇧Z)</TooltipContent>
          </Tooltip>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        {/* Export Controls */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onExportImage}
              >
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Export as Image</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onFullscreen}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fullscreen (F11)</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
});

WorkflowToolbar.displayName = 'WorkflowToolbar';
