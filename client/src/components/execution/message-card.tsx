import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import type { AgentMessage } from '@shared/schema';

interface MessageCardProps {
  message: AgentMessage;
  agentName?: string;
  fromAgentName?: string;
  toAgentName?: string;
  index?: number;
}

export function MessageCard({ message, agentName, fromAgentName, toAgentName, index }: MessageCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleColors = {
    user: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    assistant: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    system: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  };

  const roleColor = roleColors[message.role as keyof typeof roleColors] || roleColors.system;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
            {index !== undefined && (
              <span className="text-sm font-mono text-muted-foreground">#{index + 1}</span>
            )}
            <Badge variant="outline" className={roleColor}>
              {message.role}
            </Badge>
            {agentName && (
              <span className="text-sm font-medium">{agentName}</span>
            )}
            {fromAgentName && toAgentName && (
              <span className="text-sm text-muted-foreground">
                {fromAgentName} → {toAgentName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {message.tokenCount && (
              <Badge variant="secondary" className="text-xs">
                {message.tokenCount} tokens
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="relative">
            <div className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {message.content}
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="absolute top-2 right-2"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          {message.fromAgentId && message.toAgentId && (
            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
              <div>From: {message.fromAgentId}</div>
              <div>To: {message.toAgentId}</div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
