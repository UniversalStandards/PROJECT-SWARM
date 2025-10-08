import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Bot, 
  Play, 
  Save, 
  Plus, 
  Settings, 
  Code, 
  Database, 
  Search,
  Shield,
  Sparkles
} from 'lucide-react';
import { AgentNode } from '@/components/workflow/agent-node';
import { AgentConfigPanel } from '@/components/workflow/agent-config-panel';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import type { Workflow } from '@shared/schema';

const nodeTypes = {
  agent: AgentNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function WorkflowBuilder() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(params.id || null);
  const { toast } = useToast();

  // Fetch existing workflow if ID is provided
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['/api/workflows', workflowId],
    enabled: !!workflowId,
  });

  // Load workflow data when it's fetched
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        setNodes(workflow.nodes as Node[]);
      }
      if (workflow.edges && Array.isArray(workflow.edges)) {
        setEdges(workflow.edges as Edge[]);
      }
    }
  }, [workflow]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#06b6d4' } }, eds)),
    []
  );

  const addAgentNode = (type: string) => {
    const newNode: Node = {
      id: `agent-${Date.now()}`,
      type: 'agent',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: `${type} Agent`,
        role: type,
        provider: 'openai',
        model: 'gpt-4',
        description: '',
        systemPrompt: '',
      },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const updateNodeData = (nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  const saveMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; nodes: Node[]; edges: Edge[] }) => {
      if (workflowId) {
        const res = await apiRequest('PATCH', `/api/workflows/${workflowId}`, data);
        return await res.json();
      } else {
        const res = await apiRequest('POST', '/api/workflows', data);
        return await res.json();
      }
    },
    onSuccess: (data: any) => {
      if (!workflowId) {
        setWorkflowId(data.id);
        setLocation(`/workflow-builder/${data.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['/api/workflows'] });
      toast({
        title: "Workflow Saved",
        description: "Your workflow has been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow.",
        variant: "destructive",
      });
    },
  });

  const saveWorkflow = async () => {
    saveMutation.mutate({
      name: workflowName,
      description: workflowDescription,
      nodes,
      edges,
    });
  };

  const executeWorkflow = async () => {
    toast({
      title: "Execution Started",
      description: "Your agent swarm is now running.",
    });
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-3 border-b bg-card">
        <div className="flex items-center gap-4 flex-1 max-w-md">
          <Sparkles className="w-5 h-5 text-primary" />
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold border-0 bg-transparent focus-visible:ring-0 p-0"
            data-testid="input-workflow-name"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={saveWorkflow} data-testid="button-save-workflow">
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Button size="sm" onClick={executeWorkflow} data-testid="button-execute-workflow">
            <Play className="w-4 h-4 mr-2" />
            Execute
          </Button>
        </div>
      </header>

      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          data-testid="workflow-canvas"
        >
          <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
          <Controls />
          
          <Panel position="top-left" className="m-4">
            <Card className="w-64">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Agent
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Coordinator')}
                    className="justify-start gap-2"
                    data-testid="button-add-coordinator"
                  >
                    <Bot className="w-4 h-4" />
                    Coordinator
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Coder')}
                    className="justify-start gap-2"
                    data-testid="button-add-coder"
                  >
                    <Code className="w-4 h-4" />
                    Coder
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Researcher')}
                    className="justify-start gap-2"
                    data-testid="button-add-researcher"
                  >
                    <Search className="w-4 h-4" />
                    Researcher
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Database')}
                    className="justify-start gap-2"
                    data-testid="button-add-database"
                  >
                    <Database className="w-4 h-4" />
                    Database
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Security')}
                    className="justify-start gap-2"
                    data-testid="button-add-security"
                  >
                    <Shield className="w-4 h-4" />
                    Security
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => addAgentNode('Custom')}
                    className="justify-start gap-2"
                    data-testid="button-add-custom"
                  >
                    <Settings className="w-4 h-4" />
                    Custom
                  </Button>
                </div>
              </CardContent>
            </Card>
          </Panel>
        </ReactFlow>

        {selectedNode && (
          <AgentConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
          />
        )}
      </div>
    </div>
  );
}
