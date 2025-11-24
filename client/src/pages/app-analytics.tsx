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

  const { data: costAnalytics, isLoading: costsLoading } = useQuery<CostAnalytics>({
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

  const { data: usageStats, isLoading: usageLoading } = useQuery<UsageStats>({
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

  if (costsLoading || usageLoading) {
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
          <h1 className="text-3xl font-bold">Analytics & Cost Tracking</h1>
          <p className="text-muted-foreground">
            Monitor AI usage, costs, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageStats ? formatTokens(usageStats.totalTokens) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              {usageStats ? `${formatTokens(usageStats.inputTokens)} input / ${formatTokens(usageStats.outputTokens)} output` : "No data"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Providers</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costAnalytics?.breakdown?.byProvider?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Active providers</p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown by Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
          <CardDescription>Breakdown of costs across AI providers</CardDescription>
        </CardHeader>
        <CardContent>
          {costAnalytics?.breakdown?.byProvider && costAnalytics.breakdown.byProvider.length > 0 ? (
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
            <p className="text-center text-muted-foreground py-8">No usage data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
