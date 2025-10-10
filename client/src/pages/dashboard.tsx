import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Workflow as WorkflowIcon, 
  Activity, 
  Bot, 
  TrendingUp,
  Clock,
  CheckCircle2,
  Play,
  LayoutTemplate
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { Workflow, Execution, Template } from '@shared/schema';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: workflows, isLoading: workflowsLoading } = useQuery<Workflow[]>({
    queryKey: ['/api/workflows'],
  });

  const { data: executions, isLoading: executionsLoading } = useQuery<Execution[]>({
    queryKey: ['/api/executions'],
  });

  const { data: templates, isLoading: templatesLoading } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
  });

  const createFromTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest('POST', `/api/templates/${templateId}/create-workflow`, {});
      return await res.json();
    },
    onSuccess: (workflow: Workflow) => {
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow Created",
        description: `Created "${workflow.name}" from template`,
      });
      setLocation(`/app/workflow-builder/${workflow.id}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workflow from template",
        variant: "destructive",
      });
    },
  });

  const stats = [
    {
      title: 'Active Workflows',
      value: workflows?.length || 0,
      icon: WorkflowIcon,
      trend: '+12%',
      color: 'text-primary',
    },
    {
      title: 'Total Executions',
      value: executions?.length || 0,
      icon: Activity,
      trend: '+23%',
      color: 'text-blue-500',
    },
    {
      title: 'Running Agents',
      value: executions?.filter(e => e.status === 'running').length || 0,
      icon: Bot,
      trend: '+8%',
      color: 'text-green-500',
    },
    {
      title: 'Success Rate',
      value: '94%',
      icon: TrendingUp,
      trend: '+5%',
      color: 'text-amber-500',
    },
  ];

  const recentWorkflows = workflows?.slice(0, 3) || [];
  const featuredTemplates = templates?.filter(t => t.featured).slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNmI2ZDQiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0xLjEwNS44OTUtMiAyLTJzMiAuODk1IDIgMi0uODk1IDItMiAyLTItLjg5NS0yLTJabTAgMGMwLTEuMTA1Ljg5NS0yIDItMnMyIC44OTUgMiAyLS44OTUgMi0yIDItMi0uODk1LTItMloiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-4">
              AI Agent Swarm Orchestrator
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Design, deploy, and monitor intelligent agent workflows with enterprise-grade orchestration
            </p>
          </div>

          <div className="flex justify-center gap-4 mb-16">
            <Link href="/app/workflow-builder">
              <Button size="lg" className="gap-2" data-testid="button-create-workflow">
                <Plus className="w-5 h-5" />
                Create New Workflow
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2" data-testid="button-browse-templates">
              <LayoutTemplate className="w-5 h-5" />
              Browse Templates
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover-elevate transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                    <Badge variant="secondary" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {stat.trend}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(' ', '-')}`}>
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Recent Workflows</h2>
              <Link href="/workflows">
                <Button variant="ghost" size="sm" data-testid="button-view-all-workflows">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {workflowsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))
              ) : recentWorkflows.length > 0 ? (
                recentWorkflows.map((workflow) => (
                  <Card key={workflow.id} className="hover-elevate transition-all cursor-pointer" data-testid={`card-workflow-${workflow.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{workflow.name}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {workflow.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Link href={`/workflow-builder/${workflow.id}`}>
                          <Button variant="ghost" size="icon" data-testid={`button-edit-workflow-${workflow.id}`}>
                            <Play className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(workflow.updatedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <WorkflowIcon className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No workflows yet. Create your first agent swarm!
                    </p>
                    <Link href="/workflow-builder">
                      <Button className="mt-4" data-testid="button-create-first-workflow">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Workflow
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Featured Templates</h2>
              <Link href="/templates">
                <Button variant="ghost" size="sm" data-testid="button-view-all-templates">
                  View All
                </Button>
              </Link>
            </div>

            <div className="space-y-4">
              {templatesLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                  </Card>
                ))
              ) : featuredTemplates.length > 0 ? (
                featuredTemplates.map((template) => (
                  <Card key={template.id} className="hover-elevate transition-all cursor-pointer" data-testid={`card-template-${template.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-1">{template.name}</CardTitle>
                          <CardDescription className="line-clamp-1">
                            {template.description || 'No description'}
                          </CardDescription>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => createFromTemplateMutation.mutate(template.id)}
                          disabled={createFromTemplateMutation.isPending}
                          data-testid={`button-use-template-${template.id}`}
                        >
                          Use Template
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {template.usageCount} uses
                        </Badge>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <LayoutTemplate className="w-12 h-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      No templates available yet
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-primary/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Need Help Getting Started?</h3>
                <p className="text-muted-foreground">
                  Explore our template library or chat with the AI assistant to design your first agent swarm
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/templates">
                  <Button variant="outline" data-testid="button-explore-templates">
                    Explore Templates
                  </Button>
                </Link>
                <Button data-testid="button-open-assistant">
                  <Bot className="w-4 h-4 mr-2" />
                  Open AI Assistant
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
