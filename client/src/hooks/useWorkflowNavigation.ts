import { useCallback, useState, useEffect } from 'react';
import { Node, useReactFlow } from '@xyflow/react';

export interface NavigationState {
  selectedNodes: string[];
  searchTerm: string;
  searchResults: Node[];
  currentSearchIndex: number;
}

export function useWorkflowNavigation() {
  const { fitView, getNodes, setCenter } = useReactFlow();
  const [navState, setNavState] = useState<NavigationState>({
    selectedNodes: [],
    searchTerm: '',
    searchResults: [],
    currentSearchIndex: -1,
  });
  
  // Select all nodes
  const selectAll = useCallback(() => {
    const nodes = getNodes();
    setNavState(prev => ({
      ...prev,
      selectedNodes: nodes.map(n => n.id),
    }));
  }, [getNodes]);
  
  // Deselect all nodes
  const deselectAll = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      selectedNodes: [],
    }));
  }, []);
  
  // Focus on selected nodes
  const focusSelected = useCallback(() => {
    if (navState.selectedNodes.length > 0) {
      fitView({
        nodes: getNodes().filter(n => navState.selectedNodes.includes(n.id)),
        duration: 300,
        padding: 0.2,
      });
    }
  }, [navState.selectedNodes, getNodes, fitView]);
  
  // Search nodes by label
  const searchNodes = useCallback((term: string) => {
    const nodes = getNodes();
    const results = nodes.filter(node => 
      (node.data.label as string)?.toLowerCase().includes(term.toLowerCase())
    );
    
    setNavState(prev => ({
      ...prev,
      searchTerm: term,
      searchResults: results,
      currentSearchIndex: results.length > 0 ? 0 : -1,
    }));
    
    // Focus on first result
    if (results.length > 0) {
      const firstResult = results[0];
      setCenter(firstResult.position.x, firstResult.position.y, {
        zoom: 1.5,
        duration: 300,
      });
    }
  }, [getNodes, setCenter]);
  
  // Jump to next search result
  const nextSearchResult = useCallback(() => {
    if (navState.searchResults.length === 0) return;
    
    const nextIndex = (navState.currentSearchIndex + 1) % navState.searchResults.length;
    const nextNode = navState.searchResults[nextIndex];
    
    setNavState(prev => ({
      ...prev,
      currentSearchIndex: nextIndex,
    }));
    
    setCenter(nextNode.position.x, nextNode.position.y, {
      zoom: 1.5,
      duration: 300,
    });
  }, [navState.searchResults, navState.currentSearchIndex, setCenter]);
  
  // Jump to previous search result
  const prevSearchResult = useCallback(() => {
    if (navState.searchResults.length === 0) return;
    
    const prevIndex = navState.currentSearchIndex === 0 
      ? navState.searchResults.length - 1 
      : navState.currentSearchIndex - 1;
    const prevNode = navState.searchResults[prevIndex];
    
    setNavState(prev => ({
      ...prev,
      currentSearchIndex: prevIndex,
    }));
    
    setCenter(prevNode.position.x, prevNode.position.y, {
      zoom: 1.5,
      duration: 300,
    });
  }, [navState.searchResults, navState.currentSearchIndex, setCenter]);
  
  // Clear search
  const clearSearch = useCallback(() => {
    setNavState(prev => ({
      ...prev,
      searchTerm: '',
      searchResults: [],
      currentSearchIndex: -1,
    }));
  }, []);
  
  return {
    navState,
    selectAll,
    deselectAll,
    focusSelected,
    searchNodes,
    nextSearchResult,
    prevSearchResult,
    clearSearch,
  };
}
