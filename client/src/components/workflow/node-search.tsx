import { useState, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, X, Filter, ChevronRight } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface NodeSearchProps {
  nodes: Node[];
  onNodeSelect?: (nodeId: string) => void;
  onNodesHighlight?: (nodeIds: string[]) => void;
}

export function NodeSearch({ nodes, onNodeSelect, onNodesHighlight }: NodeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Extract unique roles and providers
  const roles = useMemo(() => {
    const roleSet = new Set<string>();
    nodes.forEach(node => {
      if (node.data?.role) roleSet.add(node.data.role as string);
    });
    return Array.from(roleSet).sort();
  }, [nodes]);

  const providers = useMemo(() => {
    const providerSet = new Set<string>();
    nodes.forEach(node => {
      if (node.data?.provider) providerSet.add(node.data.provider as string);
    });
    return Array.from(providerSet).sort();
  }, [nodes]);

  // Filter nodes based on search and filters
  const filteredNodes = useMemo(() => {
    let results = nodes;

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(node => {
        const label = (node.data?.label as string || '').toLowerCase();
        const role = (node.data?.role as string || '').toLowerCase();
        const provider = (node.data?.provider as string || '').toLowerCase();
        const description = (node.data?.description as string || '').toLowerCase();
        const systemPrompt = (node.data?.systemPrompt as string || '').toLowerCase();

        return (
          label.includes(query) ||
          role.includes(query) ||
          provider.includes(query) ||
          description.includes(query) ||
          systemPrompt.includes(query)
        );
      });
    }

    // Role filter
    if (selectedRoles.length > 0) {
      results = results.filter(node =>
        selectedRoles.includes(node.data?.role as string)
      );
    }

    // Provider filter
    if (selectedProviders.length > 0) {
      results = results.filter(node =>
        selectedProviders.includes(node.data?.provider as string)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      // This would need edge data to determine connected/orphan status
      // For now, we'll implement a simple check
    }

    return results;
  }, [nodes, searchQuery, selectedRoles, selectedProviders, statusFilter]);

  // Highlight filtered nodes
  useMemo(() => {
    if (onNodesHighlight) {
      onNodesHighlight(filteredNodes.map(n => n.id));
    }
  }, [filteredNodes, onNodesHighlight]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleProviderToggle = (provider: string) => {
    setSelectedProviders(prev =>
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRoles([]);
    setSelectedProviders([]);
    setStatusFilter('all');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedRoles.length > 0 ||
    selectedProviders.length > 0 ||
    statusFilter !== 'all';

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          className="pl-10 pr-10"
          data-testid="input-node-search"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filters Section */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="h-5 px-1.5">
                    {[
                      selectedRoles.length,
                      selectedProviders.length,
                      statusFilter !== 'all' ? 1 : 0,
                    ].reduce((a, b) => a + b, 0)}
                  </Badge>
                )}
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isFiltersOpen ? 'rotate-90' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-2"
            >
              Clear
            </Button>
          )}
        </div>

        <CollapsibleContent className="space-y-4 mt-4">
          {/* Role Filter */}
          {roles.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Role</Label>
              <div className="space-y-2">
                {roles.map(role => (
                  <div key={role} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role}`}
                      checked={selectedRoles.includes(role)}
                      onCheckedChange={() => handleRoleToggle(role)}
                    />
                    <label
                      htmlFor={`role-${role}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {role}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Provider Filter */}
          {providers.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium">Provider</Label>
              <div className="space-y-2">
                {providers.map(provider => (
                  <div key={provider} className="flex items-center space-x-2">
                    <Checkbox
                      id={`provider-${provider}`}
                      checked={selectedProviders.includes(provider)}
                      onCheckedChange={() => handleProviderToggle(provider)}
                    />
                    <label
                      htmlFor={`provider-${provider}`}
                      className="text-sm cursor-pointer flex-1 capitalize"
                    >
                      {provider}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Nodes</SelectItem>
                <SelectItem value="connected">Connected</SelectItem>
                <SelectItem value="orphan">Orphan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Results */}
      <div>
        <div className="text-xs text-muted-foreground mb-2">
          {filteredNodes.length} {filteredNodes.length === 1 ? 'result' : 'results'}
        </div>
        <ScrollArea className="h-[300px]">
          <div className="space-y-2">
            {filteredNodes.map(node => (
              <button
                key={node.id}
                onClick={() => onNodeSelect?.(node.id)}
                className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                data-testid={`search-result-${node.id}`}
              >
                <div className="font-medium text-sm">{String(node.data?.label || 'Unnamed Node')}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {node.data?.role as string}
                  </Badge>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {node.data?.provider as string}
                  </Badge>
                </div>
                {node.data?.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {node.data.description as string}
                  </p>
                )}
              </button>
            ))}
            {filteredNodes.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No nodes found matching your criteria
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
