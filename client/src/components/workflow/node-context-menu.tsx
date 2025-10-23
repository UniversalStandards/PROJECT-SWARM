import { useState, useCallback } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import {
  Copy,
  Trash2,
  Lock,
  Unlock,
  ChevronsUp,
  ChevronsDown,
  Layers,
  MessageSquare,
  History,
  Files,
} from 'lucide-react';
import { Node } from '@xyflow/react';

interface NodeContextMenuProps {
  children: React.ReactNode;
  node?: Node;
  onDuplicate?: (node: Node) => void;
  onDelete?: (node: Node) => void;
  onCopy?: (node: Node) => void;
  onLock?: (node: Node, locked: boolean) => void;
  onBringToFront?: (node: Node) => void;
  onSendToBack?: (node: Node) => void;
  onGroup?: (nodes: Node[]) => void;
  onAddNote?: (node: Node) => void;
  onViewHistory?: (node: Node) => void;
}

export function NodeContextMenu({
  children,
  node,
  onDuplicate,
  onDelete,
  onCopy,
  onLock,
  onBringToFront,
  onSendToBack,
  onGroup,
  onAddNote,
  onViewHistory,
}: NodeContextMenuProps) {
  const isLocked = node?.data?.locked || false;

  if (!node) {
    return <>{children}</>;
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem onClick={() => onCopy?.(node)}>
          <Copy className="w-4 h-4 mr-2" />
          Copy
          <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onDuplicate?.(node)}>
          <Files className="w-4 h-4 mr-2" />
          Duplicate
          <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => onLock?.(node, !isLocked)}
          data-testid={`context-menu-${isLocked ? 'unlock' : 'lock'}`}
        >
          {isLocked ? (
            <>
              <Unlock className="w-4 h-4 mr-2" />
              Unlock Position
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Lock Position
            </>
          )}
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuSub>
          <ContextMenuSubTrigger>
            <Layers className="w-4 h-4 mr-2" />
            Arrange
          </ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem onClick={() => onBringToFront?.(node)}>
              <ChevronsUp className="w-4 h-4 mr-2" />
              Bring to Front
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onSendToBack?.(node)}>
              <ChevronsDown className="w-4 h-4 mr-2" />
              Send to Back
            </ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        
        <ContextMenuItem onClick={() => onAddNote?.(node)}>
          <MessageSquare className="w-4 h-4 mr-2" />
          Add Note
        </ContextMenuItem>
        
        <ContextMenuItem onClick={() => onViewHistory?.(node)}>
          <History className="w-4 h-4 mr-2" />
          View History
        </ContextMenuItem>
        
        <ContextMenuSeparator />
        
        <ContextMenuItem
          onClick={() => onDelete?.(node)}
          className="text-destructive focus:text-destructive"
          data-testid="context-menu-delete"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

/**
 * Hook for managing clipboard operations
 */
export function useNodeClipboard() {
  const [clipboard, setClipboard] = useState<Node[]>([]);

  const copy = useCallback((nodes: Node[]) => {
    setClipboard(nodes);
  }, []);

  const paste = useCallback((offsetX: number = 50, offsetY: number = 50): Node[] => {
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
