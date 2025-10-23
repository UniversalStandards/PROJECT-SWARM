import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlowProvider,
  Controls,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  Panel,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bot, 
  Plus, 
  Settings, 
  Code, 
  Database,
  Search as SearchIcon,
  Shield,
  Sparkles,
  FileJson,
} from 'lucide-react';
import { AgentNode } from '@/components/workflow/agent-node';
import { AgentConfigPanel } from '@/components/workflow/agent-config-panel';
import { ExecutionInputDialog } from '@/components/workflow/execution-input-dialog';
import { BuilderToolbar } from '@/components/workflow/builder-toolbar';
import { LayoutControls } from '@/components/workflow/layout-controls';
import { Minimap } from '@/components/workflow/minimap';
import { ConnectionValidator, useWorkflowValidation } from '@/components/workflow/connection-validator';
import { NodeContextMenu, useNodeClipboard } from '@/components/workflow/node-context-menu';
import { NodeSearch } from '@/components/workflow/node-search';
import { WorkflowCanvas, useZoomControls, ZoomIndicator } from '@/components/workflow/workflow-canvas';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useParams, useLocation } from 'wouter';
import type { Workflow } from '@shared/schema';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

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
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [workflowId, setWorkflowId] = useState<string | null>(params.id || null);
  const [showExecutionDialog, setShowExecutionDialog] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showValidation, setShowValidation] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [gridSize] = useState(20);
  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const { toast } = useToast();
  const { copy, paste, canPaste } = useNodeClipboard();
  
  // Get zoom controls (only works inside ReactFlowProvider)
  const zoomControls = useZoomControls();
  
  // Validation
  const { isValid, hasErrors, warningCount } = useWorkflowValidation(nodes, edges);

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

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // Track selected nodes
        const selected = updated.filter(n => n.selected);
        setSelectedNodes(selected);
        return updated;
      });
    },
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            saveWorkflow();
            break;
          case 'c':
            if (!isInputField && selectedNodes.length > 0) {
              e.preventDefault();
              copy(selectedNodes);
              toast({ title: 'Copied', description: `${selectedNodes.length} node(s) copied` });
            }
            break;
          case 'v':
            if (!isInputField && canPaste) {
              e.preventDefault();
              const pastedNodes = paste();
              setNodes([...nodes, ...pastedNodes]);
              toast({ title: 'Pasted', description: `${pastedNodes.length} node(s) pasted` });
            }
            break;
          case 'a':
            if (!isInputField) {
              e.preventDefault();
              setNodes(nodes.map(n => ({ ...n, selected: true })));
            }
            break;
          case 'f':
            if (!isInputField) {
              e.preventDefault();
              setShowSearch(!showSearch);
            }
            break;
          case 'z':
            if (!isInputField) {
              e.preventDefault();
              // TODO: Implement undo
            }
            break;
          case 'y':
            if (!isInputField) {
              e.preventDefault();
              // TODO: Implement redo
            }
            break;
        }
      } else {
        // Non-modifier keys
        switch (e.key.toLowerCase()) {
          case 'delete':
          case 'backspace':
            if (!isInputField && selectedNodes.length > 0) {
              e.preventDefault();
              const idsToDelete = selectedNodes.map(n => n.id);
              setNodes(nodes.filter(n => !idsToDelete.includes(n.id)));
              setEdges(edges.filter(e => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)));
              toast({ title: 'Deleted', description: `${selectedNodes.length} node(s) deleted` });
            }
            break;
          case 'g':
            if (!isInputField) {
              e.preventDefault();
              setShowGrid(!showGrid);
            }
            break;
          case 's':
            if (!isInputField) {
              e.preventDefault();
              setSnapToGrid(!snapToGrid);
              toast({ title: snapToGrid ? 'Snap disabled' : 'Snap enabled' });
            }
            break;
          case 'm':
            if (!isInputField) {
              e.preventDefault();
              setShowMinimap(!showMinimap);
            }
            break;
          case 'v':
            if (!isInputField) {
              e.preventDefault();
              setShowValidation(!showValidation);
            }
            break;
          case 'f':
            if (!isInputField) {
              e.preventDefault();
              zoomControls.fitView();
            }
            break;
          case 'escape':
            setSelectedNode(null);
            setShowSearch(false);
            setShowValidation(false);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, selectedNodes, showGrid, snapToGrid, showMinimap, showValidation, showSearch, canPaste, copy, paste, toast, zoomControls]);

  // Node operations handlers
  const handleNodeDuplicate = useCallback((node: Node) => {
    const newNode = {
      ...node,
      id: `${node.id}-copy-${Date.now()}`,
      position: { x: node.position.x + 50, y: node.position.y + 50 },
      data: { ...node.data, label: `${node.data?.label} (Copy)` },
    };
    setNodes([...nodes, newNode]);
  }, [nodes]);

  const handleNodeDelete = useCallback((node: Node) => {
    setNodes(nodes.filter(n => n.id !== node.id));
    setEdges(edges.filter(e => e.source !== node.id && e.target !== node.id));
  }, [nodes, edges]);

  const handleNodeLock = useCallback((node: Node, locked: boolean) => {
    setNodes(nodes.map(n => 
      n.id === node.id ? { ...n, data: { ...n.data, locked }, draggable: !locked } : n
    ));
  }, [nodes]);

  const handleNodesUpdate = useCallback((updatedNodes: Node[]) => {
    setNodes(updatedNodes);
  }, []);

  const handleNodeSelect = useCallback((nodeId: string) => {
    // Focus on node
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(node);
      // Optionally zoom to node
      // This would require ReactFlow instance
    }
    setShowSearch(false);
  }, [nodes]);

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Enhanced Toolbar */}
      <BuilderToolbar
        workflowName={workflowName}
        workflowStatus={executeWorkflowMutation.isPending ? 'running' : workflowId ? 'saved' : 'draft'}
        canUndo={false} // TODO: Implement undo/redo
        canRedo={false}
        canCopy={selectedNodes.length > 0}
        canPaste={canPaste}
        canDelete={selectedNodes.length > 0}
        showGrid={showGrid}
        showMinimap={showMinimap}
        showValidation={showValidation}
        validationErrors={hasErrors ? 1 : 0}
        onSave={saveWorkflow}
        onExport={() => {
          const data = JSON.stringify({ nodes, edges, name: workflowName }, null, 2);
          const blob = new Blob([data], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${workflowName}.json`;
          a.click();
        }}
        onZoomIn={() => zoomControls.zoomIn()}
        onZoomOut={() => zoomControls.zoomOut()}
        onFitView={() => zoomControls.fitView()}
        onToggleGrid={() => setShowGrid(!showGrid)}
        onToggleMinimap={() => setShowMinimap(!showMinimap)}
        onToggleValidation={() => setShowValidation(!showValidation)}
        onExecute={handleExecuteClick}
      />

      <div className="flex-1 relative">
        <NodeContextMenu
          node={selectedNode || undefined}
          onDuplicate={handleNodeDuplicate}
          onDelete={handleNodeDelete}
          onCopy={(node) => copy([node])}
          onLock={handleNodeLock}
        >
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            showGrid={showGrid}
            gridSize={gridSize}
            snapToGridEnabled={snapToGrid}
          >
            <Controls />
            
            {/* Add Agent Panel */}
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
                      <SearchIcon className="w-4 h-4" />
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

            {/* Layout Controls Panel */}
            <Panel position="top-right" className="m-4">
              <LayoutControls
                nodes={nodes}
                edges={edges}
                selectedNodes={selectedNodes}
                onNodesChange={handleNodesUpdate}
                onReset={() => zoomControls.fitView()}
              />
            </Panel>

            {/* Minimap */}
            {showMinimap && <Minimap />}

            {/* Zoom Indicator */}
            <ZoomIndicator />
          </WorkflowCanvas>
        </NodeContextMenu>

        {/* Agent Config Panel */}
        {selectedNode && (
          <AgentConfigPanel
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={(data) => updateNodeData(selectedNode.id, data)}
          />
        )}

        {/* Validation Panel */}
        <Sheet open={showValidation} onOpenChange={setShowValidation}>
          <SheetContent side="right" className="w-[400px] sm:w-[540px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileJson className="w-5 h-5" />
                Workflow Validation
              </SheetTitle>
              <SheetDescription>
                Check your workflow for errors and warnings
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <ConnectionValidator
                nodes={nodes}
                edges={edges}
                onNodesChange={setNodes}
                onEdgesChange={setEdges}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Search Panel */}
        <Sheet open={showSearch} onOpenChange={setShowSearch}>
          <SheetContent side="left" className="w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <SearchIcon className="w-5 h-5" />
                Search Nodes
              </SheetTitle>
              <SheetDescription>
                Find and filter workflow nodes
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <NodeSearch
                nodes={nodes}
                onNodeSelect={handleNodeSelect}
                onNodesHighlight={setHighlightedNodes}
              />
            </div>
          </SheetContent>
        </Sheet>

        {/* Execution Dialog */}
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

// Wrap the component in ReactFlowProvider
export default function WorkflowBuilder() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderContent />
    </ReactFlowProvider>
  );
}
