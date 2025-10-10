import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AppAssistant() {
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

  if (authLoading || !isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
        <p className="text-muted-foreground mt-2">Get help building and optimizing your workflows</p>
      </div>

      <Card className="p-12 text-center max-w-2xl mx-auto">
        <div className="p-4 rounded-full bg-gradient-to-br from-primary to-blue-500 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <Bot className="w-10 h-10 text-primary-foreground" />
        </div>
        
        <h2 className="text-2xl font-bold mb-4">AI Assistant Coming Soon</h2>
        <p className="text-muted-foreground mb-8">
          Get intelligent assistance with workflow design, agent configuration, and troubleshooting. 
          Our AI assistant will help you build better agent swarms faster.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4 text-left mb-8">
          <Card className="p-4 border-primary/20">
            <Sparkles className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Workflow Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              Get suggestions for optimal agent configurations and workflow structures
            </p>
          </Card>
          
          <Card className="p-4 border-primary/20">
            <Sparkles className="w-6 h-6 text-primary mb-2" />
            <h3 className="font-semibold mb-1">Debugging Help</h3>
            <p className="text-sm text-muted-foreground">
              Analyze execution logs and get intelligent troubleshooting advice
            </p>
          </Card>
        </div>
        
        <Button disabled>
          Coming Soon
        </Button>
      </Card>
    </div>
  );
}
