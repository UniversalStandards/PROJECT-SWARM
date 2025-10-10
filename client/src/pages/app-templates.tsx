import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutTemplate, Star, Download } from "lucide-react";
import type { Template } from "@shared/schema";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AppTemplates() {
  const { isLoading: authLoading, isAuthenticated } = useAuth();
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

  const { data: templates, isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
    enabled: isAuthenticated,
  });

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Templates</h1>
        <p className="text-muted-foreground mt-2">Pre-built workflows to help you get started quickly</p>
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
      ) : templates && templates.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover-elevate transition-all">
              <div className="flex items-start justify-between mb-4">
                <LayoutTemplate className="w-8 h-8 text-primary" />
                {template.featured && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Featured
                  </Badge>
                )}
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{template.name}</h3>
              {template.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{template.description}</p>
              )}
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                <Badge variant="outline" className="text-xs">{template.category}</Badge>
                <span>•</span>
                <span>{template.usageCount} uses</span>
              </div>
              
              <Button className="w-full" data-testid={`button-use-${template.id}`}>
                <Download className="w-4 h-4 mr-2" />
                Use Template
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <LayoutTemplate className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No templates available</h3>
          <p className="text-muted-foreground">
            Check back soon for pre-built workflow templates
          </p>
        </Card>
      )}
    </div>
  );
}
