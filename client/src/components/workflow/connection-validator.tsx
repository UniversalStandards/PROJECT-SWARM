import { useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ValidationIssue {
  id: string;
  type: 'error' | 'warning';
  title: string;
  description: string;
  nodeIds?: string[];
  edgeIds?: string[];
  fix?: () => void;
}

interface ConnectionValidatorProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

export function ConnectionValidator({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
}: ConnectionValidatorProps) {
  const issues = useMemo(() => {
    const foundIssues: ValidationIssue[] = [];

    // Check for circular dependencies
    const detectCycles = () => {
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      const cycles: string[][] = [];

      const dfs = (nodeId: string, path: string[]): boolean => {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        path.push(nodeId);

        const outgoingEdges = edges.filter(e => e.source === nodeId);
        
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            if (dfs(edge.target, [...path])) {
              return true;
            }
          } else if (recursionStack.has(edge.target)) {
            const cycleStart = path.indexOf(edge.target);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), edge.target]);
            }
            return true;
          }
        }

        recursionStack.delete(nodeId);
        return false;
      };

      nodes.forEach(node => {
        if (!visited.has(node.id)) {
          dfs(node.id, []);
        }
      });

      return cycles;
    };

    const cycles = detectCycles();
    if (cycles.length > 0) {
      cycles.forEach((cycle, index) => {
        const cycleNodes = cycle.map(id => nodes.find(n => n.id === id)?.data?.label || id);
        foundIssues.push({
          id: `cycle-${index}`,
          type: 'error',
          title: 'Circular Dependency Detected',
          description: `Cycle found: ${cycleNodes.join(' → ')}`,
          nodeIds: cycle,
        });
      });
    }

    // Check for orphan nodes (no connections)
    nodes.forEach(node => {
      const hasIncoming = edges.some(e => e.target === node.id);
      const hasOutgoing = edges.some(e => e.source === node.id);
      
      if (!hasIncoming && !hasOutgoing) {
        foundIssues.push({
          id: `orphan-${node.id}`,
          type: 'warning',
          title: 'Orphan Node',
          description: `Node "${node.data?.label || node.id}" has no connections`,
          nodeIds: [node.id],
        });
      }
    });

    // Check for nodes with no incoming connections (potential entry points)
    const nodesWithoutIncoming = nodes.filter(
      node => !edges.some(e => e.target === node.id) && edges.some(e => e.source === node.id)
    );
    
    if (nodesWithoutIncoming.length > 1) {
      foundIssues.push({
        id: 'multiple-entry-points',
        type: 'warning',
        title: 'Multiple Entry Points',
        description: `${nodesWithoutIncoming.length} nodes have no incoming connections. Consider having a single coordinator node as entry point.`,
        nodeIds: nodesWithoutIncoming.map(n => n.id),
      });
    }

    // Check for nodes with no outgoing connections (endpoints)
    const nodesWithoutOutgoing = nodes.filter(
      node => !edges.some(e => e.source === node.id) && edges.some(e => e.target === node.id)
    );

    if (nodesWithoutOutgoing.length === 0 && nodes.length > 0 && edges.length > 0) {
      foundIssues.push({
        id: 'no-endpoints',
        type: 'warning',
        title: 'No Terminal Nodes',
        description: 'No nodes found without outgoing connections. Every workflow should have at least one endpoint.',
      });
    }

    // Check for maximum connections per node (reasonable limit)
    const MAX_CONNECTIONS = 10;
    nodes.forEach(node => {
      const connections = edges.filter(e => e.source === node.id || e.target === node.id);
      if (connections.length > MAX_CONNECTIONS) {
        foundIssues.push({
          id: `max-connections-${node.id}`,
          type: 'warning',
          title: 'Too Many Connections',
          description: `Node "${node.data?.label || node.id}" has ${connections.length} connections. Consider simplifying.`,
          nodeIds: [node.id],
        });
      }
    });

    return foundIssues;
  }, [nodes, edges]);

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  if (issues.length === 0) {
    return (
      <Alert className="border-green-500/50 bg-green-500/10">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-500">Workflow Valid</AlertTitle>
        <AlertDescription className="text-muted-foreground">
          No validation issues found. Your workflow is ready to execute.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant={errorCount > 0 ? 'destructive' : 'secondary'}>
          {errorCount} {errorCount === 1 ? 'Error' : 'Errors'}
        </Badge>
        <Badge variant="outline">
          {warningCount} {warningCount === 1 ? 'Warning' : 'Warnings'}
        </Badge>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {issues.map(issue => (
            <Alert
              key={issue.id}
              variant={issue.type === 'error' ? 'destructive' : 'default'}
              className={issue.type === 'warning' ? 'border-amber-500/50 bg-amber-500/10' : ''}
            >
              {issue.type === 'error' ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              )}
              <div className="flex-1">
                <AlertTitle className={issue.type === 'warning' ? 'text-amber-500' : ''}>
                  {issue.title}
                </AlertTitle>
                <AlertDescription
                  className={issue.type === 'warning' ? 'text-amber-700 dark:text-amber-300' : ''}
                >
                  {issue.description}
                </AlertDescription>
                {issue.fix && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={issue.fix}
                    className="mt-2"
                  >
                    Fix Issue
                  </Button>
                )}
              </div>
            </Alert>
          ))}
        </div>
      </ScrollArea>

      {errorCount > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Cannot Execute</AlertTitle>
          <AlertDescription>
            Please resolve all errors before executing the workflow.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

/**
 * Hook to get validation status
 */
export function useWorkflowValidation(nodes: Node[], edges: Edge[]) {
  return useMemo(() => {
    const hasErrors = useMemo(() => {
      // Quick check for circular dependencies
      const visited = new Set<string>();
      const recursionStack = new Set<string>();

      const dfs = (nodeId: string): boolean => {
        visited.add(nodeId);
        recursionStack.add(nodeId);

        const outgoingEdges = edges.filter(e => e.source === nodeId);
        
        for (const edge of outgoingEdges) {
          if (!visited.has(edge.target)) {
            if (dfs(edge.target)) return true;
          } else if (recursionStack.has(edge.target)) {
            return true;
          }
        }

        recursionStack.delete(nodeId);
        return false;
      };

      for (const node of nodes) {
        if (!visited.has(node.id)) {
          if (dfs(node.id)) return true;
        }
      }

      return false;
    }, [nodes, edges]);

    const warningCount = useMemo(() => {
      let count = 0;
      
      // Orphan nodes
      nodes.forEach(node => {
        const hasIncoming = edges.some(e => e.target === node.id);
        const hasOutgoing = edges.some(e => e.source === node.id);
        if (!hasIncoming && !hasOutgoing) count++;
      });

      return count;
    }, [nodes, edges]);

    return {
      isValid: !hasErrors,
      hasErrors,
      warningCount,
    };
  }, [nodes, edges]);
}
