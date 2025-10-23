import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ExecutionMetrics } from '@/components/execution/execution-metrics';
import { ExecutionTimeline } from '@/components/execution/execution-timeline';
import { LogViewer } from '@/components/execution/log-viewer';
import { AgentMessageFlow } from '@/components/execution/agent-message-flow';
import type { Execution, ExecutionLog, AgentMessage, Agent } from '@shared/schema';

interface TimelineResponse {
  execution: Execution;
  timeline: any[];
  totalDuration: number;
  totalSteps: number;
}

const formatOutput = (data: any): string => {
  if (typeof data === 'string') return data;
  if (data === null || data === undefined) return '';
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

export default function AppExecutionDetail() {
  const { id } = useParams<{ id: string }>();

  const { data: execution, isLoading: executionLoading } = useQuery<Execution>({
    queryKey: ['/api/executions', id],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ExecutionLog[]>({
    queryKey: [`/api/executions/${id}/logs`],
    refetchInterval: execution?.status === 'running' ? 2000 : false,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<AgentMessage[]>({
    queryKey: [`/api/executions/${id}/messages`],
    refetchInterval: execution?.status === 'running' ? 2000 : false,
  });

  const { data: timelineData } = useQuery<TimelineResponse>({
    queryKey: [`/api/executions/${id}/timeline`],
    refetchInterval: execution?.status === 'running' ? 2000 : false,
  });

  const { data: agents } = useQuery<Agent[]>({
    queryKey: [`/api/workflows/${execution?.workflowId}/agents`],
    enabled: !!execution?.workflowId,
  });

  if (executionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!execution) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Execution not found</p>
        <Link href="/app/executions">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Executions
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/executions">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Execution Details</h1>
            <p className="text-muted-foreground text-sm">ID: {execution.id}</p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <ExecutionMetrics
        execution={execution}
        logs={logs || []}
        messages={messages || []}
        timeline={timelineData?.timeline}
      />

      {/* Tabs for different views */}
      <Tabs defaultValue="timeline" className="flex-1 flex flex-col overflow-hidden">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="output">Output</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="flex-1 overflow-hidden mt-4">
          {timelineData ? (
            <ExecutionTimeline
              timeline={timelineData.timeline}
              totalDuration={timelineData.totalDuration}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </TabsContent>

        <TabsContent value="logs" className="flex-1 overflow-hidden mt-4">
          {logsLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LogViewer logs={logs || []} autoScroll={execution.status === 'running'} />
          )}
        </TabsContent>

        <TabsContent value="messages" className="flex-1 overflow-hidden mt-4">
          {messagesLoading || !agents ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AgentMessageFlow
              messages={messages || []}
              agents={agents}
              autoScroll={execution.status === 'running'}
            />
          )}
        </TabsContent>

        <TabsContent value="output" className="flex-1 overflow-auto mt-4">
          <div className="grid gap-4">
            {execution.output && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Output</h3>
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {formatOutput(execution.output)}
                </pre>
              </div>
            )}

            {execution.input && (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="text-sm font-medium mb-2">Input</h3>
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {formatOutput(execution.input)}
                </pre>
              </div>
            )}

            {execution.error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <h3 className="text-sm font-medium text-destructive mb-2">Error</h3>
                <p className="text-sm text-destructive">{execution.error}</p>
              </div>
            )}

            {!execution.output && !execution.input && !execution.error && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No output available yet
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
