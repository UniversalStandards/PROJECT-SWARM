import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import type { Execution } from '@shared/schema';

interface ComparisonData {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  input: any;
  output: any;
  error: string | null;
  logCount: number;
  messageCount: number;
  errorLogs: number;
  warningLogs: number;
}

interface ComparisonResponse {
  executions: ComparisonData[];
  comparisonDate: string;
}

export default function AppExecutionCompare() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState<ComparisonResponse | null>(null);

  const { data: executions, isLoading } = useQuery<Execution[]>({
    queryKey: ['/api/executions'],
  });

  const handleToggleExecution = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) return;

    setIsComparing(true);
    try {
      const response = await fetch('/api/executions/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionIds: selectedIds }),
      });
      const data = await response.json();
      setComparisonData(data);
    } catch (error) {
      console.error('Failed to compare executions:', error);
    } finally {
      setIsComparing(false);
    }
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'error':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'running':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
            <h1 className="text-3xl font-bold">Compare Executions</h1>
            <p className="text-muted-foreground text-sm">
              Select 2 or more executions to compare
            </p>
          </div>
        </div>
        <Button
          onClick={handleCompare}
          disabled={selectedIds.length < 2 || isComparing}
        >
          {isComparing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Comparing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Compare Selected ({selectedIds.length})
            </>
          )}
        </Button>
      </div>

      {!comparisonData ? (
        /* Selection View */
        <Card>
          <CardHeader>
            <CardTitle>Select Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {executions?.map((execution) => (
                  <div
                    key={execution.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleToggleExecution(execution.id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(execution.id)}
                      onCheckedChange={() => handleToggleExecution(execution.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{execution.id}</span>
                        <Badge variant="outline" className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Started: {new Date(execution.startedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDuration(execution.duration)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ) : (
        /* Comparison View */
        <div className="flex-1 overflow-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="outline" onClick={() => setComparisonData(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Selection
            </Button>
          </div>

          <div className="grid gap-4">
            {/* Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Execution Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Metric</th>
                        {comparisonData.executions.map((exec, idx) => (
                          <th key={exec.id} className="text-left p-2 font-medium">
                            Execution {idx + 1}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Status</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            <Badge variant="outline" className={getStatusColor(exec.status)}>
                              {exec.status}
                            </Badge>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Duration</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            {formatDuration(exec.duration)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Started At</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            {new Date(exec.startedAt).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Messages</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            {exec.messageCount}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Total Logs</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            {exec.logCount}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Errors</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            <span className={exec.errorLogs > 0 ? 'text-destructive font-medium' : ''}>
                              {exec.errorLogs}
                            </span>
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-2 font-medium">Warnings</td>
                        {comparisonData.executions.map((exec) => (
                          <td key={exec.id} className="p-2">
                            <span className={exec.warningLogs > 0 ? 'text-amber-500 font-medium' : ''}>
                              {exec.warningLogs}
                            </span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Output Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Outputs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {comparisonData.executions.map((exec, idx) => (
                    <div key={exec.id} className="space-y-2">
                      <h4 className="font-medium text-sm">Execution {idx + 1}</h4>
                      <div className="bg-muted rounded-lg p-3 text-xs">
                        <pre className="whitespace-pre-wrap break-words">
                          {exec.output ? JSON.stringify(exec.output, null, 2) : 'No output'}
                        </pre>
                      </div>
                      {exec.error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-xs text-destructive">
                          {exec.error}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
