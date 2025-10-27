import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';
import type { AgentMessage, Agent } from '@shared/schema';

interface AgentCommunicationGraphProps {
  messages: AgentMessage[];
  agents: Agent[];
}

export function AgentCommunicationGraph({ messages, agents }: AgentCommunicationGraphProps) {
  // Create agent lookup map
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach(agent => map.set(agent.id, agent));
    return map;
  }, [agents]);

  // Calculate communication metrics
  const metrics = useMemo(() => {
    const agentMessages = new Map<string, number>();
    const agentTokens = new Map<string, number>();
    const connections = new Map<string, Set<string>>();

    messages.forEach(message => {
      // Count messages per agent
      const count = agentMessages.get(message.agentId) || 0;
      agentMessages.set(message.agentId, count + 1);

      // Count tokens per agent
      const tokens = agentTokens.get(message.agentId) || 0;
      agentTokens.set(message.agentId, tokens + (message.tokenCount || 0));

      // Track connections
      if (message.fromAgentId && message.toAgentId) {
        const key = `${message.fromAgentId}-${message.toAgentId}`;
        if (!connections.has(key)) {
          connections.set(key, new Set());
        }
      }
    });

    return { agentMessages, agentTokens, connections };
  }, [messages]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">Agent Communication Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {agents.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            No agents found
          </div>
        ) : (
          <div className="space-y-4">
            {/* Agent Activity Grid */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {agents.map(agent => {
                const messageCount = metrics.agentMessages.get(agent.id) || 0;
                const tokenCount = metrics.agentTokens.get(agent.id) || 0;
                
                return (
                  <div
                    key={agent.id}
                    className="p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{agent.name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.role}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {agent.provider}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Messages:</span>
                        <span className="font-medium">{messageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tokens:</span>
                        <span className="font-medium">{tokenCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Communication Flow */}
            {messages.some(m => m.fromAgentId && m.toAgentId) && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium mb-3">Communication Flow</h4>
                <div className="space-y-2">
                  {Array.from(metrics.connections.keys()).map(key => {
                    const [fromId, toId] = key.split('-');
                    const fromAgent = agentMap.get(fromId);
                    const toAgent = agentMap.get(toId);
                    
                    if (!fromAgent || !toAgent) return null;
                    
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-2 bg-muted rounded-lg text-sm"
                      >
                        <span className="font-medium">{fromAgent.name}</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{toAgent.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">{agents.length}</div>
                  <div className="text-xs text-muted-foreground">Agents</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">{messages.length}</div>
                  <div className="text-xs text-muted-foreground">Messages</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {Array.from(metrics.agentTokens.values())
                      .reduce((sum, val) => sum + val, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Total Tokens</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
