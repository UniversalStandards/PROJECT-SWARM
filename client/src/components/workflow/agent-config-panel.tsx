import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Checkbox } from '@/components/ui/checkbox';

interface AgentConfigPanelProps {
  node: Node;
  onClose: () => void;
  onUpdate: (data: any) => void;
}

export function AgentConfigPanel({ node, onClose, onUpdate }: AgentConfigPanelProps) {
  const [formData, setFormData] = useState({
    label: (node.data?.label as string) || '',
    role: (node.data?.role as string) || '',
    description: (node.data?.description as string) || '',
    provider: (node.data?.provider as string) || 'openai',
    model: (node.data?.model as string) || 'gpt-4',
    systemPrompt: (node.data?.systemPrompt as string) || '',
    temperature: (node.data?.temperature as number) || 70,
    maxTokens: (node.data?.maxTokens as number) || 1000,
    capabilities: (node.data?.capabilities as any[]) || [],
    topP: (node.data?.topP as number) || 100,
    frequencyPenalty: (node.data?.frequencyPenalty as number) || 0,
    presencePenalty: (node.data?.presencePenalty as number) || 0,
    stopSequences: (node.data?.stopSequences as string[]) || [],
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Only sync formData when node.id changes (different node selected), not on every node data update
  useEffect(() => {
    setFormData({
      label: (node.data?.label as string) || '',
      role: (node.data?.role as string) || '',
      description: (node.data?.description as string) || '',
      provider: (node.data?.provider as string) || 'openai',
      model: (node.data?.model as string) || 'gpt-4',
      systemPrompt: (node.data?.systemPrompt as string) || '',
      temperature: (node.data?.temperature as number) || 70,
      maxTokens: (node.data?.maxTokens as number) || 1000,
      capabilities: (node.data?.capabilities as any[]) || [],
      topP: (node.data?.topP as number) || 100,
      frequencyPenalty: (node.data?.frequencyPenalty as number) || 0,
      presencePenalty: (node.data?.presencePenalty as number) || 0,
      stopSequences: (node.data?.stopSequences as string[]) || [],
    });
  }, [node.id]); // Only re-sync when switching to a different node

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const applyPreset = (preset: 'conservative' | 'balanced' | 'creative') => {
    const presets = {
      conservative: { temperature: 30, topP: 80, frequencyPenalty: 50, presencePenalty: 0 },
      balanced: { temperature: 70, topP: 95, frequencyPenalty: 0, presencePenalty: 0 },
      creative: { temperature: 90, topP: 100, frequencyPenalty: -50, presencePenalty: 50 },
    };
    const updated = { ...formData, ...presets[preset] };
    setFormData(updated);
    onUpdate(updated);
  };

  const availableCapabilities = [
    { type: 'code_execution', name: 'Code Execution', description: 'Execute code snippets' },
    { type: 'file_operations', name: 'File Operations', description: 'Read and write files' },
    { type: 'web_search', name: 'Web Search', description: 'Search the web for information' },
    { type: 'api_calls', name: 'API Calls', description: 'Make HTTP API requests' },
    { type: 'database', name: 'Database Access', description: 'Query databases' },
  ];

  const modelsByProvider = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  };

  const InfoTooltip = ({ content }: { content: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="w-4 h-4 text-muted-foreground inline ml-1 cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <div className="absolute right-0 top-0 h-full w-96 bg-background border-l shadow-xl overflow-y-auto z-50">
      <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Agent Configuration</h2>
        <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-config">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-6">
        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
            <TabsTrigger value="model" data-testid="tab-model">Model</TabsTrigger>
            <TabsTrigger value="prompt" data-testid="tab-prompt">Prompt</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                value={formData.label}
                onChange={(e) => handleChange('label', e.target.value)}
                placeholder="Enter agent name"
                data-testid="input-agent-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-role">Role</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger id="agent-role" data-testid="select-agent-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Coordinator">Coordinator</SelectItem>
                  <SelectItem value="Coder">Coder</SelectItem>
                  <SelectItem value="Researcher">Researcher</SelectItem>
                  <SelectItem value="Database">Database</SelectItem>
                  <SelectItem value="Security">Security</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="agent-description">Description</Label>
              <Textarea
                id="agent-description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="What does this agent do?"
                rows={3}
                data-testid="input-agent-description"
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select 
                value={formData.provider} 
                onValueChange={(value) => {
                  handleChange('provider', value);
                  handleChange('model', modelsByProvider[value as keyof typeof modelsByProvider][0]);
                }}
              >
                <SelectTrigger id="provider" data-testid="select-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="gemini">Google Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={formData.model} onValueChange={(value) => handleChange('model', value)}>
                <SelectTrigger id="model" data-testid="select-model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modelsByProvider[formData.provider as keyof typeof modelsByProvider].map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 my-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('conservative')}
                className="flex-1"
              >
                Conservative
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('balanced')}
                className="flex-1"
              >
                Balanced
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset('creative')}
                className="flex-1"
              >
                Creative
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {(formData.temperature / 100).toFixed(2)}
                <InfoTooltip content="Controls randomness. Lower values make output more focused and deterministic." />
              </Label>
              <Slider
                id="temperature"
                value={[formData.temperature]}
                onValueChange={([value]) => handleChange('temperature', value)}
                min={0}
                max={100}
                step={1}
                data-testid="slider-temperature"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">
                Max Tokens
                <InfoTooltip content="Maximum number of tokens to generate in the response." />
              </Label>
              <Input
                id="max-tokens"
                type="number"
                min={1}
                max={100000}
                value={formData.maxTokens}
                onChange={(e) => handleChange('maxTokens', Math.min(100000, Math.max(1, parseInt(e.target.value) || 1000)))}
                data-testid="input-max-tokens"
              />
            </div>

            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  Advanced Settings
                  <span className="text-xs text-muted-foreground">
                    {advancedOpen ? '▲' : '▼'}
                  </span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="top-p">
                    Top P: {(formData.topP / 100).toFixed(2)}
                    <InfoTooltip content="Nucleus sampling: considers tokens with cumulative probability up to this value." />
                  </Label>
                  <Slider
                    id="top-p"
                    value={[formData.topP]}
                    onValueChange={([value]) => handleChange('topP', value)}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency-penalty">
                    Frequency Penalty: {(formData.frequencyPenalty / 100).toFixed(2)}
                    <InfoTooltip content="Reduces repetition by penalizing frequently used tokens. Range: -2.0 to 2.0" />
                  </Label>
                  <Slider
                    id="frequency-penalty"
                    value={[formData.frequencyPenalty]}
                    onValueChange={([value]) => handleChange('frequencyPenalty', value)}
                    min={-200}
                    max={200}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="presence-penalty">
                    Presence Penalty: {(formData.presencePenalty / 100).toFixed(2)}
                    <InfoTooltip content="Encourages new topics by penalizing tokens already present. Range: -2.0 to 2.0" />
                  </Label>
                  <Slider
                    id="presence-penalty"
                    value={[formData.presencePenalty]}
                    onValueChange={([value]) => handleChange('presencePenalty', value)}
                    min={-200}
                    max={200}
                    step={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="stop-sequences">
                    Stop Sequences
                    <InfoTooltip content="Enter sequences (comma-separated) where the model should stop generating." />
                  </Label>
                  <Input
                    id="stop-sequences"
                    placeholder="e.g., \n\n, END, ###"
                    value={formData.stopSequences.join(', ')}
                    onChange={(e) => handleChange('stopSequences', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="capabilities">
                Capabilities
                <InfoTooltip content="Select the tools and capabilities this agent can use." />
              </Label>
              <div className="space-y-2 border rounded-md p-3">
                {availableCapabilities.map((cap) => (
                  <div key={cap.type} className="flex items-start space-x-2">
                    <Checkbox
                      id={`cap-${cap.type}`}
                      checked={formData.capabilities.some((c: any) => c.type === cap.type)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handleChange('capabilities', [
                            ...formData.capabilities,
                            { type: cap.type, name: cap.name, description: cap.description }
                          ]);
                        } else {
                          handleChange('capabilities', formData.capabilities.filter((c: any) => c.type !== cap.type));
                        }
                      }}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor={`cap-${cap.type}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cap.name}
                      </label>
                      <p className="text-xs text-muted-foreground">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="system-prompt">System Prompt</Label>
              <Textarea
                id="system-prompt"
                value={formData.systemPrompt}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                placeholder="Enter the system prompt for this agent..."
                rows={12}
                className="font-mono text-sm"
                data-testid="input-system-prompt"
              />
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Prompt Suggestions</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                <p>• Define the agent's role and responsibilities</p>
                <p>• Specify output format and structure</p>
                <p>• Include relevant context and constraints</p>
                <p>• Define interaction patterns with other agents</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
