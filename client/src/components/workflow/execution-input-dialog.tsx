import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Play, Loader2 } from 'lucide-react';

interface ExecutionInputDialogProps {
  open: boolean;
  onClose: () => void;
  onExecute: (input: string) => void;
  isExecuting?: boolean;
}

export function ExecutionInputDialog({
  open,
  onClose,
  onExecute,
  isExecuting = false,
}: ExecutionInputDialogProps) {
  const [input, setInput] = useState('Process this workflow');

  const handleExecute = () => {
    onExecute(input);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-execution-input">
        <DialogHeader>
          <DialogTitle>Execute Workflow</DialogTitle>
          <DialogDescription>
            Provide input for your agent swarm workflow. This will be passed to the first agent in the chain.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter your input prompt or task description..."
            className="min-h-[120px] resize-none"
            data-testid="input-execution-prompt"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExecuting} data-testid="button-cancel-execution">
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={isExecuting || !input.trim()} data-testid="button-confirm-execution">
            {isExecuting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Execute
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
