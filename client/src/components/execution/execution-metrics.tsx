import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, MessageSquare, Database } from 'lucide-react';
import type { Execution, ExecutionLog, AgentMessage } from '@shared/schema';

interface ExecutionMetricsProps {
  execution: Execution;
  logs: ExecutionLog[];
  messages: AgentMessage[];
  timeline?: any[];
}

export function ExecutionMetrics({ execution, logs, messages, timeline }: ExecutionMetricsProps) {
  const metrics = useMemo(() => {
    const totalDuration = execution.duration || 0;
    const errorCount = logs.filter(l => l.level === 'error').length;
    const warningCount = logs.filter(l => l.level === 'warning').length;
    const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokenCount || 0), 0);
    
    // Calculate per-agent metrics from timeline
    const agentMetrics = new Map<string, { duration: number; steps: number }>();
    if (timeline) {
      timeline.forEach(step => {
        const existing = agentMetrics.get(step.agentName) || { duration: 0, steps: 0 };
        agentMetrics.set(step.agentName, {
          duration: existing.duration + step.duration,
          steps: existing.steps + 1,
        });
      });
    }

    return {
      totalDuration,
      errorCount,
      warningCount,
      totalTokens,
      messageCount: messages.length,
      logCount: logs.length,
      stepCount: timeline?.length || 0,
      agentMetrics,
    };
  }, [execution, logs, messages, timeline]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const statusConfig = {
    pending: { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', label: 'Pending' },
    running: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Running' },
    completed: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Completed' },
    error: { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Error' },
  };

  const status = statusConfig[execution.status as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" className={status.color}>
            {status.label}
          </Badge>
          {execution.startedAt && (
            <p className="text-xs text-muted-foreground mt-2">
              Started {new Date(execution.startedAt).toLocaleString()}
            </p>
          )}
          {execution.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completed {new Date(execution.completedAt).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Duration Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Duration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatDuration(metrics.totalDuration)}
          </div>
          {metrics.stepCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.stepCount} steps executed
            </p>
          )}
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">{metrics.stepCount - metrics.errorCount}</span>
            </div>
            {metrics.errorCount > 0 && (
              <div className="flex items-center gap-1">
                <XCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm font-medium">{metrics.errorCount}</span>
              </div>
            )}
          </div>
          {metrics.warningCount > 0 && (
            <p className="text-xs text-amber-500 mt-1">
              {metrics.warningCount} warnings
            </p>
          )}
        </CardContent>
      </Card>

      {/* Communication Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {metrics.messageCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.totalTokens.toLocaleString()} tokens used
          </p>
        </CardContent>
      </Card>

      {/* Agent Performance */}
      {metrics.agentMetrics.size > 0 && (
        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="w-4 h-4" />
              Agent Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(metrics.agentMetrics.entries()).map(([agentName, data]) => (
                <div key={agentName} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{agentName}</div>
                    <div className="text-xs text-muted-foreground">
                      {data.steps} {data.steps === 1 ? 'step' : 'steps'}
                    </div>
                  </div>
                  <Badge variant="secondary">{formatDuration(data.duration)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
