import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, Zap, Download } from "lucide-react";

interface CostAnalytics {
  totalCost: number;
  period: string;
  breakdown: {
    byWorkflow: Array<{ workflowId: string; workflowName: string; cost: number }>;
    byProvider: Array<{ provider: string; cost: number }>;
    byModel: Array<{ model: string; cost: number }>;
  };
}

interface UsageStats {
  totalTokens: number;
  inputTokens: number;
  outputTokens: number;
  byProvider: Array<{ provider: string; tokens: number }>;
}

export default function AppAnalytics() {
  const [dateRange, setDateRange] = useState("30");

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - parseInt(dateRange));
    return { start, end };
  };

  const { data: costAnalytics } = useQuery<CostAnalytics>({
    queryKey: [`/api/analytics/costs`, dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/analytics/costs?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch cost analytics");
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
  const { data: usageStats } = useQuery<UsageStats>({
    queryKey: [`/api/analytics/usage`, dateRange],
    queryFn: async () => {
      const { start, end } = getDateRange();
      const response = await fetch(
        `/api/analytics/usage?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch usage stats");
      return response.json();
    },
  });

  const handleExportReport = async () => {
    const { start, end } = getDateRange();
    const response = await fetch(
      `/api/analytics/export?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
    );
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cost-report-${start.toISOString().split("T")[0]}-${end.toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(2)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

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
              ${costAnalytics?.totalCost ? formatCost(costAnalytics.totalCost) : '$0.00'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 mb-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costAnalytics ? formatCost(costAnalytics.totalCost) : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">
              {costAnalytics?.period || "No data"}
            </p>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats ? formatTokens(usageStats.totalTokens) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              Input: {usageStats ? formatTokens(usageStats.inputTokens) : "0"} | Output:{" "}
              {usageStats ? formatTokens(usageStats.outputTokens) : "0"}
            </p>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/1M Tokens</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costAnalytics && usageStats && usageStats.totalTokens > 0
                ? formatCost(Math.round((costAnalytics.totalCost / usageStats.totalTokens) * 1000000))
                : "$0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Per million tokens</p>
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
      {/* Cost Breakdown by Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
          <CardDescription>AI provider cost breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {costAnalytics?.breakdown.byProvider && costAnalytics.breakdown.byProvider.length > 0 ? (
            <div className="space-y-4">
              {costAnalytics.breakdown.byProvider.map((item) => (
                <div key={item.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.provider}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCost(item.cost)}</p>
                    <p className="text-xs text-muted-foreground">
                      {costAnalytics.totalCost > 0
                        ? Math.round((item.cost / costAnalytics.totalCost) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No cost data available</p>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Model</CardTitle>
          <CardDescription>AI model cost breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {costAnalytics?.breakdown.byModel && costAnalytics.breakdown.byModel.length > 0 ? (
            <div className="space-y-4">
              {costAnalytics.breakdown.byModel.map((item) => (
                <div key={item.model} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded">{item.model}</code>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCost(item.cost)}</p>
                    <p className="text-xs text-muted-foreground">
                      {costAnalytics.totalCost > 0
                        ? Math.round((item.cost / costAnalytics.totalCost) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No cost data available yet. Execute some workflows to see analytics.
            </p>
            <p className="text-center text-muted-foreground py-8">No cost data available</p>
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
      {/* Token Usage by Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Token Usage by Provider</CardTitle>
          <CardDescription>Token consumption breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {usageStats?.byProvider && usageStats.byProvider.length > 0 ? (
            <div className="space-y-4">
              {usageStats.byProvider.map((item) => (
                <div key={item.provider} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{item.provider}</Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatTokens(item.tokens)}</p>
                    <p className="text-xs text-muted-foreground">
                      {usageStats.totalTokens > 0
                        ? Math.round((item.tokens / usageStats.totalTokens) * 100)
                        : 0}
                      % of total
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No execution details available
            </p>
            <p className="text-center text-muted-foreground py-8">No usage data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
