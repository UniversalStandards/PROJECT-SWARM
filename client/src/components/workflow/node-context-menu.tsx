import { memo } from 'react';
import { useState, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { 
  Copy, 
  Trash2, 
  Palette, 
  Lock, 
  Unlock,
  Play,
  FileText,
} from 'lucide-react';

interface NodeContextMenuProps {
  children: React.ReactNode;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onChangeColor?: () => void;
  onLockPosition?: () => void;
  onUnlockPosition?: () => void;
  onRunFromHere?: () => void;
  onAddNote?: () => void;
  isLocked?: boolean;
}

export const NodeContextMenu = memo(({
  children,
  onDuplicate,
  onDelete,
  onCopy,
  onChangeColor,
  onLockPosition,
  onUnlockPosition,
  onRunFromHere,
  onAddNote,
  isLocked = false,
}: NodeContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {onCopy && (
          <ContextMenuItem onClick={onCopy}>
            <Copy className="w-4 h-4 mr-2" />
            Copy
            <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        {onDuplicate && (
          <ContextMenuItem onClick={onDuplicate}>
            <Copy className="w-4 h-4 mr-2" />
            Duplicate
            <ContextMenuShortcut>⌘D</ContextMenuShortcut>
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onChangeColor && (
          <ContextMenuItem onClick={onChangeColor}>
            <Palette className="w-4 h-4 mr-2" />
            Change Color
          </ContextMenuItem>
        )}
        {onAddNote && (
          <ContextMenuItem onClick={onAddNote}>
            <FileText className="w-4 h-4 mr-2" />
            Add Note
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onRunFromHere && (
          <ContextMenuItem onClick={onRunFromHere}>
            <Play className="w-4 h-4 mr-2" />
            Run from here
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {!isLocked && onLockPosition && (
          <ContextMenuItem onClick={onLockPosition}>
            <Lock className="w-4 h-4 mr-2" />
            Lock Position
          </ContextMenuItem>
        )}
        {isLocked && onUnlockPosition && (
          <ContextMenuItem onClick={onUnlockPosition}>
            <Unlock className="w-4 h-4 mr-2" />
            Unlock Position
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        {onDelete && (
          <ContextMenuItem onClick={onDelete} className="text-destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
            <ContextMenuShortcut>⌫</ContextMenuShortcut>
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
});

NodeContextMenu.displayName = 'NodeContextMenu';

/**
 * Hook for managing clipboard operations
 */
interface ClipboardNode {
  id: string;
  position: { x: number; y: number };
  data?: any;
  [key: string]: any;
}

export function useNodeClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardNode[]>([]);

  const copy = useCallback((nodes: ClipboardNode[]) => {
    setClipboard(nodes);
  }, []);

  const paste = useCallback((offsetX: number = 50, offsetY: number = 50): ClipboardNode[] => {
    return clipboard.map(node => ({
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: {
        x: node.position.x + offsetX,
        y: node.position.y + offsetY,
      },
      data: {
        ...node.data,
        label: `${node.data?.label || 'Node'} (Copy)`,
      },
    }));
  }, [clipboard]);

  const canPaste = clipboard.length > 0;

  return { copy, paste, canPaste, clipboard };
}
