import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

interface CostData {
  totalCost: number;
  totalTokens: number;
  byProvider: Record<string, {
    cost: number;
    tokens: number;
    count: number;
  }>;
  details: Array<{
    provider: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
  }>;
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { data: costs, isLoading } = useQuery<CostData>({
    queryKey: ['/api/analytics/costs', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      const response = await fetch(`/api/analytics/costs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch costs');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Analytics</h1>
          <p className="text-muted-foreground">Track your AI provider costs and token usage</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
            <CardDescription>Lifetime spending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              ${costs?.totalCost.toFixed(4) || '0.00'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Tokens</CardTitle>
            <CardDescription>All providers combined</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {costs?.totalTokens.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Executions</CardTitle>
            <CardDescription>Total API calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {costs?.details.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
          <CardDescription>Breakdown of spending across AI providers</CardDescription>
        </CardHeader>
        <CardContent>
          {costs?.byProvider && Object.keys(costs.byProvider).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(costs.byProvider).map(([provider, data]) => (
                <div key={provider} className="flex items-center justify-between border-b pb-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium capitalize">{provider}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.tokens.toLocaleString()} tokens · {data.count} calls
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${(data.cost / 1000000).toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">
                      {((data.cost / (costs.totalCost * 1000000)) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No cost data available yet. Execute some workflows to see analytics.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
          <CardDescription>Latest AI model usage</CardDescription>
        </CardHeader>
        <CardContent>
          {costs?.details && costs.details.length > 0 ? (
            <div className="space-y-2">
              {costs.details.slice(0, 10).map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b pb-2">
                  <div>
                    <span className="font-medium capitalize">{detail.provider}</span>
                    <span className="text-muted-foreground"> · {detail.model}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${(detail.costUsd / 1000000).toFixed(4)}</div>
                    <div className="text-xs text-muted-foreground">
                      {detail.promptTokens + detail.completionTokens} tokens
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No execution details available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
