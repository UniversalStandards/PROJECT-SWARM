import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';

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
  });

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
    });
  }, [node.id]); // Only re-sync when switching to a different node

  const handleChange = (field: string, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);
    onUpdate(updated);
  };

  const modelsByProvider = {
    openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'],
  };

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

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {formData.temperature / 100}
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
              <Label htmlFor="max-tokens">Max Tokens</Label>
              <Input
                id="max-tokens"
                type="number"
                value={formData.maxTokens}
                onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 1000)}
                data-testid="input-max-tokens"
              />
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4 mt-4">
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
