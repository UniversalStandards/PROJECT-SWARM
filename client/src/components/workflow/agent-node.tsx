import { memo, useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, useReactFlow } from '@xyflow/react';
import { Bot, Code, Search, Database, Shield, Settings, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';

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

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'gemini', label: 'Gemini' }
];

const modelsByProvider: Record<string, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
  gemini: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash']
};

export const AgentNode = memo(({ data, selected, id }: NodeProps) => {
  const Icon = roleIcons[data.role as keyof typeof roleIcons] || Settings;
  const colorClass = roleColors[data.role as keyof typeof roleColors] || roleColors.Custom;
  const { setNodes } = useReactFlow();
  
  const status = (data.status as string) || 'idle';
  const StatusIcon: React.ComponentType<{ className?: string }> | null = status === 'running' ? Loader2 : status === 'completed' ? CheckCircle2 : status === 'error' ? XCircle : null;

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(data.label as string);
  const [selectedProvider, setSelectedProvider] = useState(data.provider as string);
  const [selectedModel, setSelectedModel] = useState(data.model as string);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Sync local state when data changes from refetch
  useEffect(() => {
    setEditedName(data.label as string);
    setSelectedProvider(data.provider as string);
    setSelectedModel(data.model as string);
  }, [data.label, data.provider, data.model]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== data.label) {
      try {
        await apiRequest('PATCH', `/api/agents/${data.agentId}`, { name: editedName.trim() });
        
        // Update React Flow node state
        setNodes((nodes) =>
          nodes.map((node) =>
            node.id === id
              ? { ...node, data: { ...node.data, label: editedName.trim() } }
              : node
          )
        );
        
        // Invalidate both workflow and agents queries
        queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId] });
        queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId, 'agents'] });
      } catch (error) {
        console.error('Failed to update agent name:', error);
      }
    }
    setIsEditingName(false);
  };

  const handleProviderChange = async (provider: string) => {
    const defaultModel = modelsByProvider[provider][0];
    setSelectedProvider(provider);
    setSelectedModel(defaultModel);
    
    try {
      await apiRequest('PATCH', `/api/agents/${data.agentId}`, { provider, model: defaultModel });
      
      // Update React Flow node state
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, provider, model: defaultModel } }
            : node
        )
      );
      
      // Invalidate both workflow and agents queries
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId, 'agents'] });
    } catch (error) {
      console.error('Failed to update agent provider:', error);
    }
  };

  const handleModelChange = async (model: string) => {
    setSelectedModel(model);
    
    try {
      await apiRequest('PATCH', `/api/agents/${data.agentId}`, { model });
      
      // Update React Flow node state
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, model } }
            : node
        )
      );
      
      // Invalidate both workflow and agents queries
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', data.workflowId, 'agents'] });
    } catch (error) {
      console.error('Failed to update agent model:', error);
    }
  };

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
              {isEditingName ? (
                <Input
                  ref={nameInputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') {
                      setEditedName(data.label as string);
                      setIsEditingName(false);
                    }
                  }}
                  className="h-6 text-sm font-semibold px-1"
                  data-testid={`input-agent-name-${data.agentId}`}
                />
              ) : (
                <h3 
                  className="font-semibold text-sm truncate cursor-pointer hover-elevate px-1 rounded"
                  onClick={() => setIsEditingName(true)}
                  data-testid={`text-agent-name-${data.label as string}`}
                >
                  {data.label as string}
                </h3>
              )}
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
                {data.description as string}
              </p>
            )}
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Select value={selectedProvider} onValueChange={handleProviderChange}>
                <SelectTrigger className="h-6 w-auto text-xs font-mono" data-testid={`select-provider-${data.agentId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providerOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedModel} onValueChange={handleModelChange}>
                <SelectTrigger className="h-6 w-auto text-xs" data-testid={`select-model-${data.agentId}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelsByProvider[selectedProvider]?.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="text-center pt-2 pb-1 border-t mt-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
            {data.role as string}
          </p>
        </div>
      </div>
      
      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </Card>
  );
});

AgentNode.displayName = 'AgentNode';
