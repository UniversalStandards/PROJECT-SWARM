import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link, Copy, RefreshCw, Zap, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WorkflowWebhook {
  id: string;
  workflowId: string;
  webhookUrl: string;
  secretKey: string;
  enabled: boolean;
  triggerCount: number;
  lastTriggeredAt: string | null;
}

interface WebhookConfigProps {
  workflowId: string;
}

export function WebhookConfig({ workflowId }: WebhookConfigProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: webhook, isLoading } = useQuery<WorkflowWebhook | null>({
    queryKey: [`/api/workflows/${workflowId}/webhooks`],
  });

  const createWebhookMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/workflows/${workflowId}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to create webhook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/webhooks`] });
      toast({
        title: "Webhook created",
        description: "Your webhook URL has been generated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateSecretMutation = useMutation({
    mutationFn: async () => {
      if (!webhook) throw new Error("No webhook found");
      const response = await fetch(`/api/webhooks/${webhook.id}/regenerate`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to regenerate secret");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/webhooks`] });
      toast({
        title: "Secret regenerated",
        description: "Your webhook secret key has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleWebhookMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      if (!webhook) throw new Error("No webhook found");
      const response = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!response.ok) throw new Error("Failed to update webhook");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workflows/${workflowId}/webhooks`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Webhook URL copied to clipboard",
    });
  };

  const handleRegenerateSecret = () => {
    if (confirm("Are you sure? This will invalidate the current webhook URL.")) {
      regenerateSecretMutation.mutate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Webhook Trigger
            </CardTitle>
            <CardDescription>
              Trigger this workflow via HTTP POST requests from external services
            </CardDescription>
          </div>
          {webhook && (
            <div className="flex items-center gap-2">
              <Label htmlFor="webhook-enabled" className="text-sm font-normal">
                {webhook.enabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="webhook-enabled"
                checked={webhook.enabled}
                onCheckedChange={(checked) => toggleWebhookMutation.mutate(checked)}
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading webhook...</div>
        ) : !webhook ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              No webhook configured for this workflow yet.
            </p>
            <Button onClick={() => createWebhookMutation.mutate()}>
              <Link className="h-4 w-4 mr-2" />
              Create Webhook
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Webhook URL</Label>
              <div className="flex gap-2">
                <Input
                  value={webhook.webhookUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(webhook.webhookUrl)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Use this URL to trigger the workflow from external services
              </p>
            </div>

            <div className="space-y-2">
              <Label>Secret Key</Label>
              <div className="flex gap-2">
                <Input
                  value={webhook.secretKey}
                  type="password"
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateSecret}
                  disabled={regenerateSecretMutation.isPending}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Include this key in your webhook requests for authentication
              </p>
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={webhook.enabled ? "default" : "secondary"}>
                      {webhook.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Total Triggers</Label>
                  <p className="mt-1 font-medium">{webhook.triggerCount}</p>
                </div>
                {webhook.lastTriggeredAt && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Last Triggered</Label>
                    <p className="mt-1 text-sm">
                      {new Date(webhook.lastTriggeredAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="text-sm font-medium mb-2">Example cURL Request</h4>
              <pre className="text-xs overflow-x-auto">
                {`curl -X POST ${webhook.webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{"key": "value"}'`}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
