import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Bot, Code, Search, Database, Shield, Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const roleIcons = {
  Coordinator: Bot,
  Coder: Code,
  Researcher: Search,
  Database: Database,
  Security: Shield,
  Custom: Settings,
};

const roleColors = {
  Coordinator: 'bg-primary/10 border-primary text-primary',
  Coder: 'bg-purple-500/10 border-purple-500 text-purple-400',
  Researcher: 'bg-amber-500/10 border-amber-500 text-amber-400',
  Database: 'bg-blue-500/10 border-blue-500 text-blue-400',
  Security: 'bg-green-500/10 border-green-500 text-green-400',
  Custom: 'bg-slate-500/10 border-slate-500 text-slate-400',
};

export const AgentNode = memo(({ data, selected }: NodeProps) => {
  const Icon = roleIcons[data.role as keyof typeof roleIcons] || Settings;
  const colorClass = roleColors[data.role as keyof typeof roleColors] || roleColors.Custom;
  
  const status = data.status || 'idle';
  
  const StatusIcon: React.ComponentType<{ className?: string }> | null = status === 'running' ? Loader2 : status === 'completed' ? CheckCircle2 : status === 'error' ? XCircle : null;

  return (
    <Card className={`min-w-[200px] transition-all ${selected ? 'ring-2 ring-primary shadow-xl' : ''}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3" />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-sm truncate" data-testid={`text-agent-name-${data.label}`}>
                {data.label}
              </h3>
              {StatusIcon && (
                <StatusIcon 
                  className={`w-4 h-4 flex-shrink-0 ${
                    status === 'running' ? 'animate-spin text-primary' : 
                    status === 'completed' ? 'text-green-500' : 
                    'text-destructive'
                  }`} 
                />
              )}
            </div>
            
            {data.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.description}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="secondary" className="text-xs font-mono">
                {data.provider}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {data.model}
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});

AgentNode.displayName = 'AgentNode';
