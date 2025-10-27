import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  stepIndex: number;
  agentId: string;
  agentName: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: 'completed' | 'error' | 'running';
  logs: any[];
}

interface ExecutionTimelineProps {
  timeline: TimelineStep[];
  totalDuration?: number;
}

export function ExecutionTimeline({ timeline, totalDuration }: ExecutionTimelineProps) {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Execution Timeline</CardTitle>
          {totalDuration !== undefined && (
            <Badge variant="secondary">
              Total: {formatDuration(totalDuration)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {timeline.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No timeline data available
          </div>
        ) : (
          <div className="relative space-y-6">
            {/* Timeline line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
            
            {timeline.map((step, index) => (
              <div key={step.stepIndex} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 border-background bg-card shadow-sm">
                  {getStatusIcon(step.status)}
                </div>

                {/* Step content */}
                <div className="flex-1 pb-2">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">
                          Step {step.stepIndex + 1}: {step.agentName}
                        </h4>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(step.status))}>
                          {step.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(step.startTime).toLocaleTimeString()} → {new Date(step.endTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {formatDuration(step.duration)}
                    </Badge>
                  </div>

                  {/* Progress bar for visual duration */}
                  {totalDuration && (
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden mb-2">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          step.status === 'error' 
                            ? "bg-destructive" 
                            : step.status === 'completed'
                            ? "bg-green-500"
                            : "bg-amber-500"
                        )}
                        style={{ width: `${(step.duration / totalDuration) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Log count */}
                  {step.logs && step.logs.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {step.logs.length} log {step.logs.length === 1 ? 'entry' : 'entries'}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
