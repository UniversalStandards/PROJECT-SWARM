import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { History, GitBranch, Tag, RotateCcw, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  commitMessage: string | null;
  createdBy: string;
  createdAt: string;
  tag: string | null;
  executionCount: number;
  successRate: number | null;
  avgDuration: number | null;
}

interface VersionHistoryProps {
  workflowId: string;
}

export function VersionHistory({ workflowId }: VersionHistoryProps) {
  const [commitMessage, setCommitMessage] = useState("");
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: [`/api/workflows/${workflowId}/versions`],
  });

  const createVersionMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/workflows/${workflowId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commitMessage: message }),
      });
      if (!response.ok) throw new Error("Failed to create version");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      toast({
        title: "Version created",
        description: "Workflow version has been saved successfully.",
      });
      setShowCommitDialog(false);
      setCommitMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const restoreVersionMutation = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetch(`/api/workflows/${workflowId}/restore/${versionId}`, {
        method: "PUT",
      });
      if (!response.ok) throw new Error("Failed to restore version");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Version restored",
        description: "Workflow has been restored to the selected version.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      window.location.reload(); // Reload to reflect changes
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateVersion = () => {
    createVersionMutation.mutate(commitMessage);
  };

  const handleRestoreVersion = (versionId: string) => {
    if (confirm("Are you sure you want to restore this version? Current changes will be saved as a new version.")) {
      restoreVersionMutation.mutate(versionId);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Version History
              </CardTitle>
              <CardDescription>
                Track and restore previous versions of this workflow
              </CardDescription>
            </div>
            <Button onClick={() => setShowCommitDialog(true)} size="sm">
              <Save className="h-4 w-4 mr-2" />
              Save Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center text-muted-foreground py-8">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No versions yet. Save your first version to start tracking changes.
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {versions.map((version, index) => (
                  <Card key={version.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            v{version.version}
                          </Badge>
                          {version.tag && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {version.tag}
                            </Badge>
                          )}
                          {index === 0 && (
                            <Badge variant="default">Latest</Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium mb-1">
                          {version.commitMessage || `Version ${version.version}`}
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>Created: {new Date(version.createdAt).toLocaleString()}</p>
                          {version.executionCount > 0 && (
                            <p>
                              Executions: {version.executionCount} | Success Rate:{" "}
                              {version.successRate}% | Avg Duration:{" "}
                              {Math.round((version.avgDuration || 0) / 1000)}s
                            </p>
                          )}
                        </div>
                      </div>
                      {index !== 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreVersion(version.id)}
                          disabled={restoreVersionMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showCommitDialog} onOpenChange={setShowCommitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workflow Version</DialogTitle>
            <DialogDescription>
              Create a snapshot of the current workflow state with a descriptive message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="commit-message">Commit Message</Label>
              <Input
                id="commit-message"
                placeholder="Describe what changed in this version..."
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommitDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateVersion}
              disabled={createVersionMutation.isPending}
            >
              {createVersionMutation.isPending ? "Saving..." : "Save Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
