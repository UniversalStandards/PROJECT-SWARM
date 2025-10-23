import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { GitBranch, Clock, User, RotateCcw, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  commitMessage: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  data: any;
}

export default function WorkflowVersionsPage() {
  const params = useParams();
  const workflowId = params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [commitMessage, setCommitMessage] = useState('');

  const { data: versions = [], isLoading } = useQuery<WorkflowVersion[]>({
    queryKey: [`/api/workflows/${workflowId}/versions`],
    enabled: !!workflowId,
  });

  const createVersion = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/workflows/${workflowId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commitMessage: message }),
      });
      if (!response.ok) throw new Error('Failed to create version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      setCommitMessage('');
      toast({
        title: 'Version created',
        description: 'Workflow version saved successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const restoreVersion = useMutation({
    mutationFn: async (versionId: string) => {
      const response = await fetch(`/api/workflows/${workflowId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to restore version');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/versions`] });
      toast({
        title: 'Version restored',
        description: 'Workflow has been restored to the selected version',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading versions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GitBranch className="h-8 w-8" />
            Workflow Versions
          </h1>
          <p className="text-muted-foreground">Git-like version control for your workflow</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/app/workflows/${workflowId}`)}>
          Back to Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Version</CardTitle>
          <CardDescription>Save a snapshot of your current workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter commit message (e.g., 'Added new agent for data processing')"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
            />
            <Button 
              onClick={() => createVersion.mutate(commitMessage)}
              disabled={!commitMessage || createVersion.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Commit
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No versions yet. Create your first version to track changes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div 
                  key={version.id}
                  className="flex items-center justify-between border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={version.isActive ? 'default' : 'secondary'}>
                        v{version.version}
                      </Badge>
                      {version.isActive && (
                        <Badge variant="outline" className="text-green-600">
                          Active
                        </Badge>
                      )}
                    </div>
                    <p className="font-medium">{version.commitMessage}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(version.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!version.isActive && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => restoreVersion.mutate(version.id)}
                        disabled={restoreVersion.isPending}
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
