import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, ExternalLink } from 'lucide-react';
import type { Execution, ExecutionLog, AgentMessage } from '@shared/schema';

export default function ExecutionMonitor() {
  const { id } = useParams<{ id: string }>();

  const { data: execution, isLoading: executionLoading } = useQuery<Execution>({
    queryKey: ['/api/executions', id],
  });

  const { data: logs, isLoading: logsLoading } = useQuery<ExecutionLog[]>({
    queryKey: [`/api/executions/${id}/logs`],
    refetchInterval: 2000,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<AgentMessage[]>({
    queryKey: [`/api/executions/${id}/messages`],
    refetchInterval: 2000,
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
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Execution not found</p>
      </div>
    );
  }

  const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    running: { icon: Loader2, color: 'text-primary', bg: 'bg-primary/10' },
    completed: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10' },
    error: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  };

  const config = statusConfig[execution.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Execution Monitor</h1>
          <p className="text-muted-foreground">Execution ID: {execution.id}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/executions/${execution.id}/detail`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Detailed View
            </Button>
          </Link>
          <Badge className={`gap-2 ${config.bg} ${config.color} border-0`} data-testid="badge-execution-status">
            <StatusIcon className={`w-4 h-4 ${execution.status === 'running' ? 'animate-spin' : ''}`} />
            {execution.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Execution Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : logs && logs.length > 0 ? (
                <div className="space-y-2 font-mono text-sm">
                  {logs.map((log) => {
                    const levelColors = {
                      info: 'text-muted-foreground',
                      warning: 'text-amber-500',
                      error: 'text-destructive',
                    };
                    return (
                      <div key={log.id} className="flex gap-3" data-testid={`log-${log.id}`}>
                        <span className="text-muted-foreground shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`font-medium shrink-0 uppercase ${levelColors[log.level as keyof typeof levelColors]}`}>
                          [{log.level}]
                        </span>
                        <span className="break-all">{log.message}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No logs available
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Agent Messages</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-6 pb-6">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message, index) => (
                    <div key={message.id} data-testid={`message-${message.id}`}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {message.role}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {message.tokenCount ? `${message.tokenCount} tokens` : ''}
                          </span>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No messages yet
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {execution.output && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
              {JSON.stringify(execution.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {execution.error && (
        <Card className="border-destructive">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{execution.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
