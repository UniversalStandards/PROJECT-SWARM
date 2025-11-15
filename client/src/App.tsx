import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAuth } from "@/hooks/useAuth";

// Public Pages
import Landing from "@/pages/landing";
import Features from "@/pages/features";
import HowItWorks from "@/pages/how-it-works";
import Pricing from "@/pages/pricing";
import About from "@/pages/about";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";

// App Pages (Protected)
import AppWorkflows from "@/pages/app-workflows";
import AppExecutions from "@/pages/app-executions";
import AppTemplates from "@/pages/app-templates";
import AppAssistant from "@/pages/app-assistant";
import AppSettings from "@/pages/app-settings";
import WorkflowBuilder from "@/pages/workflow-builder";
import ExecutionMonitor from "@/pages/execution-monitor";
import AppAnalytics from "@/pages/app-analytics";
import AppWorkflowVersions from "@/pages/app-workflow-versions";
import AppExecutionDetail from "@/pages/app-execution-detail";
import AppExecutionCompare from "@/pages/app-execution-compare";

import NotFound from "@/pages/not-found";

function PublicRouter() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/features" component={Features} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppRouter() {
  const [location, navigate] = useLocation();
  
  // Redirect /app to /app/workflows
  if (location === "/app") {
    navigate("/app/workflows");
    return null;
  }
  
  return (
    <Switch>
      <Route path="/app/workflows" component={AppWorkflows} />
      <Route path="/app/executions" component={AppExecutions} />
      <Route path="/app/executions/compare" component={AppExecutionCompare} />
      <Route path="/app/executions/:id/detail" component={AppExecutionDetail} />
      <Route path="/app/executions/:id" component={ExecutionMonitor} />
      <Route path="/app/templates" component={AppTemplates} />
      <Route path="/app/assistant" component={AppAssistant} />
      <Route path="/app/settings" component={AppSettings} />
      <Route path="/app/analytics" component={AppAnalytics} />
      <Route path="/app/workflows/:id/versions" component={AppWorkflowVersions} />
      <Route path="/app/workflow-builder" component={WorkflowBuilder} />
      <Route path="/app/workflow-builder/:id" component={WorkflowBuilder} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ProtectedAppLayout() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2 border-b bg-card/50 backdrop-blur">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <AppRouter />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const [location] = useLocation();
  const isAppRoute = location.startsWith("/app/") || location === "/app";

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          {isAppRoute ? <ProtectedAppLayout /> : <PublicRouter />}
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
