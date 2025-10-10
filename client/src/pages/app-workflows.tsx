import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Workflow, Play, Calendar, Trash2 } from "lucide-react";
import type { Workflow as WorkflowType } from "@shared/schema";
import { format } from "date-fns";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AppWorkflows() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  const { data: workflows, isLoading } = useQuery<WorkflowType[]>({
    queryKey: ["/api/workflows"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workflows</h1>
          <p className="text-muted-foreground mt-2">Design and manage your AI agent swarms</p>
        </div>
        <Link href="/app/workflow-builder">
          <Button data-testid="button-create-workflow">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : workflows && workflows.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <Card key={workflow.id} className="p-6 hover-elevate transition-all group">
              <div className="flex items-start justify-between mb-4">
                <Workflow className="w-8 h-8 text-primary" />
                <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{workflow.name}</h3>
              {workflow.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{workflow.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Calendar className="w-3 h-3" />
                <span>{format(new Date(workflow.createdAt), "MMM d, yyyy")}</span>
              </div>
              
              <div className="flex gap-2">
                <Link href={`/app/workflow-builder/${workflow.id}`} className="flex-1">
                  <Button variant="outline" className="w-full" data-testid={`button-edit-${workflow.id}`}>
                    Edit
                  </Button>
                </Link>
                <Button className="flex-1" data-testid={`button-run-${workflow.id}`}>
                  <Play className="w-4 h-4 mr-2" />
                  Run
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Workflow className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No workflows yet</h3>
          <p className="text-muted-foreground mb-6">
            Create your first AI agent swarm to get started
          </p>
          <Link href="/app/workflow-builder">
            <Button data-testid="button-create-first-workflow">
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Workflow
            </Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
