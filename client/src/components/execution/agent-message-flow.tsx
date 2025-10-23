import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Download, Filter } from 'lucide-react';
import { MessageCard } from './message-card';
import type { AgentMessage, Agent } from '@shared/schema';

interface AgentMessageFlowProps {
  messages: AgentMessage[];
  agents: Agent[];
  autoScroll?: boolean;
}

export function AgentMessageFlow({ messages, agents, autoScroll = true }: AgentMessageFlowProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, autoScroll]);

  // Create agent lookup map
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    agents.forEach(agent => map.set(agent.id, agent));
    return map;
  }, [agents]);

  // Filter and search messages
  const filteredMessages = useMemo(() => {
    return messages.filter(message => {
      // Search filter
      if (searchQuery && !message.content.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Agent filter
      if (filterAgent !== 'all' && message.agentId !== filterAgent) {
        return false;
      }

      // Role filter
      if (filterRole !== 'all' && message.role !== filterRole) {
        return false;
      }

      return true;
    });
  }, [messages, searchQuery, filterAgent, filterRole]);

  const exportMessages = () => {
    const data = filteredMessages.map(msg => ({
      timestamp: msg.timestamp,
      agent: agentMap.get(msg.agentId)?.name || msg.agentId,
      role: msg.role,
      content: msg.content,
      tokenCount: msg.tokenCount,
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const headers = ['Timestamp', 'Agent', 'Role', 'Token Count', 'Content'];
    const rows = filteredMessages.map(msg => [
      new Date(msg.timestamp).toISOString(),
      agentMap.get(msg.agentId)?.name || msg.agentId,
      msg.role,
      msg.tokenCount?.toString() || '',
      msg.content.replace(/"/g, '""'), // Escape quotes
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `messages-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Agent Messages</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredMessages.length} messages</Badge>
            <Button size="sm" variant="outline" onClick={exportMessages}>
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>
        <div className="flex gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={filterAgent} onValueChange={setFilterAgent}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="All agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map(agent => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="assistant">Assistant</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollRef}>
          {filteredMessages.length > 0 ? (
            <div className="space-y-3">
              {filteredMessages.map((message, index) => (
                <MessageCard
                  key={message.id}
                  message={message}
                  agentName={agentMap.get(message.agentId)?.name}
                  fromAgentName={message.fromAgentId ? agentMap.get(message.fromAgentId)?.name : undefined}
                  toAgentName={message.toAgentId ? agentMap.get(message.toAgentId)?.name : undefined}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              {searchQuery || filterAgent !== 'all' || filterRole !== 'all'
                ? 'No messages match your filters'
                : 'No messages yet'}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
