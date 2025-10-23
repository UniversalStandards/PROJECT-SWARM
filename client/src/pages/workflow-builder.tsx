import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
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
  useReactFlow,
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
import { ExecutionInputDialog } from '@/components/workflow/execution-input-dialog';
import { WorkflowMinimap } from '@/components/workflow/workflow-minimap';
import { WorkflowToolbar } from '@/components/workflow/workflow-toolbar';
import { useToast } from '@/hooks/use-toast';
import { useGridSnapping } from '@/hooks/useGridSnapping';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import { applyLayout, type LayoutAlgorithm } from '@/lib/workflow-layout';
import { validateConnection, getConnectionStyle } from '@/lib/connection-validator';
import type { Workflow } from '@shared/schema';

const nodeTypes = {
  agent: AgentNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function WorkflowBuilderContent() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(params.id || null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const { toast } = useToast();
  const reactFlowInstance = useReactFlow();
  
  // Grid snapping hook
  const { 
    options: gridOptions, 
    updateOptions: updateGridOptions,
    applySnapping,
    snapAllNodesToGrid,
    handleKeyDown,
    handleKeyUp,
  } = useGridSnapping({
    enabled: true,
    gridSize: 20,
    showGrid: true,
  });

  // Fetch existing workflow if ID is provided
  const { data: workflow, isLoading } = useQuery<Workflow>({
    queryKey: ['/api/workflows', workflowId],
    enabled: !!workflowId,
  });

  // Fetch agents for the workflow
  const { data: agents } = useQuery<any[]>({
    queryKey: ['/api/workflows', workflowId, 'agents'],
    enabled: !!workflowId,
  });

  // Load workflow data when it's fetched
  useEffect(() => {
    if (workflow) {
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description || '');
      
      // Merge workflow nodes with agent data
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        const workflowNodes = workflow.nodes as Node[];
        
        // If we have agents, merge them with nodes
        if (agents && agents.length > 0) {
          const mergedNodes = workflowNodes.map(node => {
            const agent = agents.find((a: any) => a.nodeId === node.id);
            if (agent) {
              return {
                ...node,
                data: {
                  ...node.data,
                  agentId: agent.id,
                  workflowId: workflow.id,
                  label: agent.name,
                  provider: agent.provider,
                  model: agent.model,
                  role: agent.role,
                  description: agent.description,
                  systemPrompt: agent.systemPrompt,
                }
              };
            }
            return node;
          });
          setNodes(mergedNodes);
        } else {
          setNodes(workflowNodes);
        }
      }
      
      if (workflow.edges && Array.isArray(workflow.edges)) {
        setEdges(workflow.edges as Edge[]);
      }
    }
  }, [workflow, agents]);

  // Keyboard event listeners for grid snapping
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      const snappedChanges = applySnapping(changes);
      setNodes((nds) => applyNodeChanges(snappedChanges, nds));
    },
    [applySnapping]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      const validation = validateConnection(connection, nodes, edges);
      
      if (!validation.valid) {
        toast({
          title: "Invalid Connection",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }
      
      setEdges((eds) => addEdge({ 
        ...connection, 
        animated: true, 
        style: { stroke: '#06b6d4' } 
      }, eds));
    },
    [nodes, edges, toast]
  );
  
  // Connection validation visual feedback
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      // If it's an Edge, convert to Connection format
      const conn: Connection = 'id' in connection ? {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? null,
        targetHandle: connection.targetHandle ?? null,
      } : connection;
      
      return validateConnection(conn, nodes, edges).valid;
    },
    [nodes, edges]
  );

  const addAgentNode = async (type: string) => {
    if (!workflowId) {
      toast({
        title: "Error",
        description: "Please save the workflow first",
        variant: "destructive",
      });
      return;
    }

    const nodeId = `agent-${Date.now()}`;
    
    try {
      // Create agent in database first
      const response = await apiRequest('POST', '/api/agents', {
        name: `${type} Agent`,
        role: type,
        provider: 'openai',
        model: 'gpt-4o',
        description: '',
        systemPrompt: '',
        workflowId: workflowId,
        nodeId: nodeId,
        temperature: 70,
        maxTokens: 4000,
      });
      
      const agent = await response.json();
      
      // Then create React Flow node with agent ID
      const newNode: Node = {
        id: nodeId,
        type: 'agent',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          agentId: agent.id,
          label: agent.name,
          role: agent.role,
          provider: agent.provider,
          model: agent.model,
          description: agent.description,
          systemPrompt: agent.systemPrompt,
          workflowId: workflowId,
        },
      };
      
      // Update local state AND save to workflow
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      
      // Save workflow with new node to persist it
      await apiRequest('PATCH', `/api/workflows/${workflowId}`, {
        nodes: updatedNodes,
        edges: edges,
      });
      
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', workflowId] });
      queryClient.invalidateQueries({ queryKey: ['/api/workflows', workflowId, 'agents'] });
    } catch (error) {
      console.error('Failed to create agent:', error);
      toast({
        title: "Error",
        description: "Failed to create agent",
        variant: "destructive",
      });
    }
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
        setLocation(`/app/workflow-builder/${data.id}`);
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

  const executeWorkflowMutation = useMutation({
    mutationFn: async (input: string) => {
      if (!workflowId) throw new Error("No workflow ID");
      const res = await apiRequest('POST', '/api/executions', {
        workflowId,
        input,
      });
      return await res.json();
    },
    onSuccess: (execution) => {
      queryClient.invalidateQueries({ queryKey: ['/api/executions'] });
      toast({
        title: "Execution Started",
        description: "Your agent swarm is now running.",
      });
      // Navigate to execution monitor
      setLocation(`/executions/${execution.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message || "Failed to execute workflow",
        variant: "destructive",
      });
    },
  });

  const handleExecuteClick = () => {
    if (!workflowId) {
      toast({
        title: "Save Required",
        description: "Please save the workflow before executing.",
        variant: "destructive",
      });
      return;
    }
    setShowExecutionDialog(true);
  };

  const executeWorkflow = (input: string) => {
    executeWorkflowMutation.mutate(input);
    setShowExecutionDialog(false);
  };
  
  // Toolbar handlers
  const handleAutoLayout = useCallback((algorithm: LayoutAlgorithm) => {
    const layoutedNodes = applyLayout(nodes, edges, { algorithm });
    setNodes(layoutedNodes);
  }, [nodes, edges]);
  
  const handleZoomIn = useCallback(() => {
    reactFlowInstance.zoomIn();
  }, [reactFlowInstance]);
  
  const handleZoomOut = useCallback(() => {
    reactFlowInstance.zoomOut();
  }, [reactFlowInstance]);
  
  const handleFitView = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 300 });
  }, [reactFlowInstance]);
  
  const handleZoomToActual = useCallback(() => {
    reactFlowInstance.setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 });
  }, [reactFlowInstance]);
  
  const handleToggleGrid = useCallback(() => {
    updateGridOptions({ enabled: !gridOptions.enabled });
  }, [gridOptions.enabled, updateGridOptions]);
  
  const handleToggleMinimap = useCallback(() => {
    setMinimapEnabled(!minimapEnabled);
  }, [minimapEnabled]);
  
  const handleGridSizeChange = useCallback((size: number) => {
    updateGridOptions({ gridSize: size });
  }, [updateGridOptions]);
  
  const handleSnapAllToGrid = useCallback(() => {
    const snappedNodes = snapAllNodesToGrid(nodes);
    setNodes(snappedNodes);
  }, [nodes, snapAllNodesToGrid]);
  
  const handleExportImage = useCallback(() => {
    // This would require additional library like html-to-image
    toast({
      title: "Export Image",
      description: "Image export feature coming soon",
    });
  }, [toast]);
  
  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

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
          <Button size="sm" onClick={handleExecuteClick} data-testid="button-execute-workflow">
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
          isValidConnection={isValidConnection}
          fitView
          data-testid="workflow-canvas"
        >
          <Background 
            variant={gridOptions.showGrid ? BackgroundVariant.Dots : BackgroundVariant.Lines} 
            gap={gridOptions.gridSize} 
            size={1} 
          />
          <Controls />
          
          {/* Minimap */}
          <WorkflowMinimap 
            position="bottom-right"
            visible={minimapEnabled}
          />
          
          {/* Toolbar */}
          <Panel position="top-center" className="m-4">
            <WorkflowToolbar
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onFitView={handleFitView}
              onZoomToActual={handleZoomToActual}
              onAutoLayout={handleAutoLayout}
              onToggleGrid={handleToggleGrid}
              onToggleMinimap={handleToggleMinimap}
              onExportImage={handleExportImage}
              onFullscreen={handleFullscreen}
              gridEnabled={gridOptions.enabled}
              minimapEnabled={minimapEnabled}
              gridSize={gridOptions.gridSize}
              onGridSizeChange={handleGridSizeChange}
            />
          </Panel>
          
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

        <ExecutionInputDialog
          open={showExecutionDialog}
          onClose={() => setShowExecutionDialog(false)}
          onExecute={executeWorkflow}
          isExecuting={executeWorkflowMutation.isPending}
        />
      </div>
    </div>
  );
}

export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
