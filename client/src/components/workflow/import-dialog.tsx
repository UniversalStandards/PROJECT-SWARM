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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ImportDialog({ open, onOpenChange, onSuccess }: ImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [conflictResolution, setConflictResolution] = useState<"skip" | "rename" | "overwrite">("rename");
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a workflow JSON file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      const fileContent = await file.text();
      const workflowData = JSON.parse(fileContent);

      const response = await fetch("/api/workflows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflow: workflowData,
          conflictResolution,
        }),
      });

      if (!response.ok) throw new Error("Failed to import workflow");

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Import successful",
          description: result.warnings
            ? `Workflow imported with warnings: ${result.warnings.join(", ")}`
            : "Workflow has been imported successfully.",
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        throw new Error(result.error || "Import failed");
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Workflow</DialogTitle>
          <DialogDescription>
            Upload a workflow JSON file to import it into your workspace.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-upload">Workflow File (JSON)</Label>
            <input
              id="file-upload"
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {file && (
              <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>Conflict Resolution</Label>
            <RadioGroup value={conflictResolution} onValueChange={(value: any) => setConflictResolution(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip" id="skip" />
                <Label htmlFor="skip" className="cursor-pointer font-normal">
                  Skip - Don't import if name exists
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rename" id="rename" />
                <Label htmlFor="rename" className="cursor-pointer font-normal">
                  Rename - Add timestamp to name
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="overwrite" id="overwrite" />
                <Label htmlFor="overwrite" className="cursor-pointer font-normal">
                  Overwrite - Replace existing workflow
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
