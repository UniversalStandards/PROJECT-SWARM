import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Save,
  Upload,
  Download,
  Undo2,
  Redo2,
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3x3,
  Eye,
  Play,
  Calendar,
  StopCircle,
  FileJson,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface BuilderToolbarProps {
  workflowName: string;
  workflowStatus?: 'draft' | 'saved' | 'running';
  canUndo?: boolean;
  canRedo?: boolean;
  canCopy?: boolean;
  canPaste?: boolean;
  canDelete?: boolean;
  showGrid?: boolean;
  showMinimap?: boolean;
  showValidation?: boolean;
  validationErrors?: number;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onToggleGrid?: () => void;
  onToggleMinimap?: () => void;
  onToggleValidation?: () => void;
  onExecute?: () => void;
  onSchedule?: () => void;
  onStop?: () => void;
}

export function BuilderToolbar({
  workflowName,
  workflowStatus = 'draft',
  canUndo = false,
  canRedo = false,
  canCopy = false,
  canPaste = false,
  canDelete = false,
  showGrid = true,
  showMinimap = true,
  showValidation = false,
  validationErrors = 0,
  onSave,
  onSaveAs,
  onExport,
  onImport,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  onToggleMinimap,
  onToggleValidation,
  onExecute,
  onSchedule,
  onStop,
}: BuilderToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 px-4 py-2 border-b bg-card">
        {/* Breadcrumb / Status */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-sm truncate">{workflowName}</span>
          <Badge
            variant={
              workflowStatus === 'running'
                ? 'default'
                : workflowStatus === 'saved'
                ? 'secondary'
                : 'outline'
            }
            className="text-xs"
          >
            {workflowStatus}
          </Badge>
        </div>

        <Separator orientation="vertical" className="h-6 mx-2" />

        {/* File Section */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onSave}>
                <Save className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Save (Ctrl+S)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onImport}>
                <Upload className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Import Workflow</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onExport}>
                <Download className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Export Workflow</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Edit Section */}
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
            <TooltipContent>
              <p>Undo (Ctrl+Z)</p>
            </TooltipContent>
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
            <TooltipContent>
              <p>Redo (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCut}
                disabled={!canCopy}
              >
                <Scissors className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Cut (Ctrl+X)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                disabled={!canCopy}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Copy (Ctrl+C)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onPaste}
                disabled={!canPaste}
              >
                <ClipboardPaste className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Paste (Ctrl+V)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={!canDelete}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete (Del)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View Section */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onZoomIn}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In (Ctrl++)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onZoomOut}>
                <ZoomOut className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out (Ctrl+-)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={onFitView}>
                <Maximize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Fit to Screen (F)</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showGrid ? 'secondary' : 'ghost'}
                size="sm"
                onClick={onToggleGrid}
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Grid (G)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showMinimap ? 'secondary' : 'ghost'}
                size="sm"
                onClick={onToggleMinimap}
              >
                <Eye className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle Minimap (M)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showValidation ? 'secondary' : 'ghost'}
                size="sm"
                onClick={onToggleValidation}
                className="relative"
              >
                <FileJson className="w-4 h-4" />
                {validationErrors > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px]"
                  >
                    {validationErrors}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Validation Panel (V)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex-1" />

        {/* Run Section */}
        <div className="flex items-center gap-1">
          {workflowStatus === 'running' ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="destructive" size="sm" onClick={onStop}>
                  <StopCircle className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Stop Execution</p>
              </TooltipContent>
            </Tooltip>
          ) : (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    onClick={onExecute}
                    disabled={validationErrors > 0}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Execute
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Execute Workflow (Ctrl+Enter)</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSchedule}
                    disabled={validationErrors > 0}
                  >
                    <Calendar className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Schedule Workflow</p>
                </TooltipContent>
              </Tooltip>
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
