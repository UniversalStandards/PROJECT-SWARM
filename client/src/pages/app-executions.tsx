import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Clock, CheckCircle, XCircle, AlertCircle, GitCompare } from "lucide-react";
import type { Execution } from "@shared/schema";
import { format } from "date-fns";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AppExecutions() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();

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

  const { data: executions, isLoading } = useQuery<Execution[]>({
    queryKey: ["/api/executions"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "failed": return <XCircle className="w-4 h-4" />;
      case "running": return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case "completed": return "default";
      case "failed": return "destructive";
      case "running": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Executions</h1>
          <p className="text-muted-foreground mt-2">Monitor and review your workflow execution history</p>
        </div>
        <Link href="/app/executions/compare">
          <Button variant="outline">
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Executions
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-6 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : executions && executions.length > 0 ? (
        <div className="space-y-4">
          {executions.map((execution) => (
            <Link key={execution.id} href={`/app/executions/${execution.id}`}>
              <Card className="p-6 hover-elevate transition-all cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={getStatusVariant(execution.status)} className="flex items-center gap-1">
                        {getStatusIcon(execution.status)}
                        <span className="capitalize">{execution.status}</span>
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(execution.startedAt), "MMM d, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      Execution ID: <span className="font-mono">{execution.id.slice(0, 8)}</span>
                    </div>
                    
                    {execution.duration && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{(execution.duration / 1000).toFixed(1)}s</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No executions yet</h3>
          <p className="text-muted-foreground">
            Execute a workflow to see results here
          </p>
        </Card>
      )}
    </div>
  );
}
