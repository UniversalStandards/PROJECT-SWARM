import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  workflowId: string;
  workflowName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ workflowId, workflowName, open, onOpenChange }: ExportDialogProps) {
  const [options, setOptions] = useState({
    includeExecutions: false,
    includeKnowledge: false,
    includeSchedules: true,
    includeWebhooks: true,
    anonymize: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        includeExecutions: options.includeExecutions.toString(),
        includeKnowledge: options.includeKnowledge.toString(),
        includeSchedules: options.includeSchedules.toString(),
        includeWebhooks: options.includeWebhooks.toString(),
        anonymize: options.anonymize.toString(),
      });

      const response = await fetch(`/api/workflows/${workflowId}/export?${params}`);
      if (!response.ok) throw new Error("Failed to export workflow");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${workflowName.replace(/\s+/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: "Workflow has been exported successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Workflow</DialogTitle>
          <DialogDescription>
            Download this workflow as a JSON file that can be imported later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-executions"
              checked={options.includeExecutions}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeExecutions: checked as boolean })
              }
            />
            <Label htmlFor="include-executions" className="cursor-pointer">
              Include execution history
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-knowledge"
              checked={options.includeKnowledge}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeKnowledge: checked as boolean })
              }
            />
            <Label htmlFor="include-knowledge" className="cursor-pointer">
              Include knowledge base
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-schedules"
              checked={options.includeSchedules}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeSchedules: checked as boolean })
              }
            />
            <Label htmlFor="include-schedules" className="cursor-pointer">
              Include schedules
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-webhooks"
              checked={options.includeWebhooks}
              onCheckedChange={(checked) =>
                setOptions({ ...options, includeWebhooks: checked as boolean })
              }
            />
            <Label htmlFor="include-webhooks" className="cursor-pointer">
              Include webhooks
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymize"
              checked={options.anonymize}
              onCheckedChange={(checked) =>
                setOptions({ ...options, anonymize: checked as boolean })
              }
            />
            <Label htmlFor="anonymize" className="cursor-pointer">
              Anonymize data (create as template)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
