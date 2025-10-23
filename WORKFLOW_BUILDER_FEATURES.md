# Workflow Builder - Advanced Features Guide

This document describes all the advanced UX features implemented in the Workflow Builder.

## Table of Contents
1. [Auto-Layout](#auto-layout)
2. [Grid Snapping](#grid-snapping)
3. [Minimap](#minimap)
4. [Connection Validation](#connection-validation)
5. [Enhanced Toolbar](#enhanced-toolbar)
6. [Keyboard Shortcuts](#keyboard-shortcuts)
7. [Technical Architecture](#technical-architecture)

---

## Auto-Layout

The workflow builder now includes three automatic layout algorithms to organize your nodes:

### Available Algorithms

#### 1. Hierarchical Layout (Default)
- **Best for**: Linear workflows with clear dependencies
- **Behavior**: Arranges nodes in levels based on their connections
- **Features**:
  - Topological sorting to determine levels
  - Automatic spacing between ranks
  - Prevents overlapping nodes
  - Handles disconnected nodes
  - Supports multiple directions: TB (Top-Bottom), BT (Bottom-Top), LR (Left-Right), RL (Right-Left)

#### 2. Force-Directed Layout
- **Best for**: Complex workflows with many interconnections
- **Behavior**: Uses physics simulation to create organic spacing
- **Features**:
  - Repulsion forces between all nodes
  - Attraction forces between connected nodes
  - Iterative simulation for natural positioning
  - Minimizes edge crossings
  - Creates balanced layouts

#### 3. Grid Layout
- **Best for**: Simple workflows where order doesn't matter
- **Behavior**: Arranges nodes in a uniform grid
- **Features**:
  - Consistent spacing
  - Clean, organized appearance
  - Easy to scan visually

### How to Use

1. Click the **Auto-Layout** dropdown in the toolbar
2. Select your preferred algorithm
3. Nodes will smoothly animate to their new positions

### Customization

The layout algorithms can be customized in `client/src/lib/workflow-layout.ts`:
- `nodeSpacing`: Distance between nodes in the same level (default: 150px)
- `rankSpacing`: Distance between levels (default: 200px)

---

## Grid Snapping

Grid snapping helps keep your workflow clean and aligned by automatically positioning nodes on a grid.

### Features

- **Configurable Grid Size**: Choose from 10px, 20px, or 50px grid spacing
- **Visual Grid**: Optional grid dots/lines in the background
- **Smart Snapping**: Only snaps when you finish dragging (not during)
- **Shift Override**: Hold Shift while dragging to temporarily disable snapping
- **Snap All Button**: Snap all nodes to grid at once

### How to Use

1. **Toggle Grid**: Click the grid icon in the toolbar or press `Ctrl/Cmd + G`
2. **Change Grid Size**: Use the dropdown next to the grid button
3. **Disable Temporarily**: Hold Shift while dragging a node
4. **Snap All Nodes**: Use the "Snap All to Grid" toolbar option

### Visual Feedback

- Grid dots appear in the background when enabled
- Grid size determines the spacing of the dots
- Nodes snap to the nearest grid intersection

---

## Minimap

The minimap provides a bird's-eye view of your entire workflow, making navigation easier in large workflows.

### Features

- **Colored Nodes**: Each agent role has a distinct color
  - Coordinator: Purple (#8b5cf6)
  - Coder: Purple variant (#a855f7)
  - Researcher: Amber (#f59e0b)
  - Database: Blue (#3b82f6)
  - Security: Green (#10b981)
  - Custom: Gray (#64748b)
- **Viewport Indicator**: Shows your current view as a draggable rectangle
- **Interactive**: Click or drag to navigate to different areas
- **Semi-transparent**: Doesn't obstruct your workflow
- **Auto-hiding**: Can be toggled on/off as needed

### How to Use

1. **Toggle Minimap**: Click the map icon in the toolbar or press `Ctrl/Cmd + M`
2. **Navigate**: Click anywhere on the minimap to jump to that location
3. **Pan**: Drag the viewport rectangle to pan around
4. **Zoom**: Use the minimap's zoom controls

### Position

The minimap is positioned in the bottom-right corner by default. This can be customized in the component props.

---

## Connection Validation

Connection validation prevents invalid workflow configurations and provides real-time feedback.

### Validation Rules

1. **No Self-Connections**: A node cannot connect to itself
2. **No Duplicate Connections**: Each connection must be unique
3. **No Cycles**: Connections cannot create circular dependencies
4. **Type Compatibility**: (Future) Validates input/output type matching

### Visual Feedback

- **Valid Connection**: Green highlight on target node
- **Invalid Connection**: Red highlight on target node
- **Connection Line**: Follows your cursor while connecting
- **Error Messages**: Toast notifications explain why a connection is invalid

### How It Works

The validator uses:
- Adjacency map for cycle detection
- Depth-first search (DFS) for cycle checking
- Real-time validation as you drag connections

### Customization

Add custom validation rules in `client/src/lib/connection-validator.ts`:
```typescript
export function validateConnection(
  connection: Connection,
  nodes: Node[],
  edges: Edge[]
): ValidationResult {
  // Add your custom validation logic here
}
```

---

## Enhanced Toolbar

The toolbar provides quick access to all workflow builder features.

### Toolbar Sections

#### 1. Zoom Controls
- **Zoom In**: Increase zoom level (Ctrl/Cmd + +)
- **Zoom Out**: Decrease zoom level (Ctrl/Cmd + -)
- **100%**: Reset to actual size (Ctrl/Cmd + 0)
- **Fit View**: Fit entire workflow in viewport (Ctrl/Cmd + F)

#### 2. Layout Controls
- **Auto-Layout**: Dropdown to select layout algorithm
- Options: Hierarchical, Force-Directed, Grid

#### 3. Grid Controls
- **Grid Toggle**: Enable/disable grid snapping (Ctrl/Cmd + G)
- **Grid Size**: Dropdown to select grid size (10px, 20px, 50px)

#### 4. View Controls
- **Minimap Toggle**: Show/hide minimap (Ctrl/Cmd + M)

#### 5. History Controls (Planned)
- **Undo**: Revert last change (Ctrl/Cmd + Z)
- **Redo**: Reapply last undone change (Ctrl/Cmd + Shift + Z)

#### 6. Export Controls
- **Export Image**: Save workflow as PNG/SVG
- **Fullscreen**: Toggle fullscreen mode (F11)

### Tooltips

Every button includes a tooltip showing:
- What the button does
- The keyboard shortcut (if available)

---

## Keyboard Shortcuts

Complete list of keyboard shortcuts for efficient workflow editing.

### Navigation
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + F` | Fit view to canvas |
| `Ctrl/Cmd + 0` | Zoom to 100% |
| `Ctrl/Cmd + +` | Zoom in |
| `Ctrl/Cmd + -` | Zoom out |

### View Controls
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + G` | Toggle grid |
| `Ctrl/Cmd + M` | Toggle minimap |
| `F11` | Toggle fullscreen |

### Selection
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + A` | Select all nodes |
| `Escape` | Deselect all |
| `Delete` / `Backspace` | Delete selected nodes |

### Editing
| Shortcut | Action |
|----------|--------|
| `Shift` (hold) | Disable grid snapping while dragging |

### Future Shortcuts (Planned)
| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + C` | Copy selected nodes |
| `Ctrl/Cmd + V` | Paste nodes |
| `Ctrl/Cmd + D` | Duplicate selected nodes |
| `Arrow Keys` | Nudge selected nodes |

---

## Technical Architecture

### Core Libraries

- **@xyflow/react v12.8.6**: React Flow library for node-based UIs
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Shadcn UI**: Component library

### File Structure

```
client/src/
├── lib/
│   ├── workflow-layout.ts          # Auto-layout algorithms
│   └── connection-validator.ts     # Connection validation logic
├── hooks/
│   ├── useGridSnapping.ts          # Grid snapping functionality
│   └── useWorkflowNavigation.ts    # Navigation utilities
├── components/workflow/
│   ├── workflow-minimap.tsx        # Minimap component
│   ├── workflow-toolbar.tsx        # Toolbar component
│   ├── node-context-menu.tsx       # Context menu (future use)
│   └── node-style-editor.tsx       # Node styling (future use)
└── pages/
    └── workflow-builder.tsx         # Main workflow builder
```

### Key Design Patterns

#### 1. Custom Hooks
Reusable logic is extracted into custom hooks:
- `useGridSnapping`: Manages grid snapping state and logic
- `useWorkflowNavigation`: Handles navigation and search

#### 2. Separation of Concerns
- Layout algorithms are pure functions in `workflow-layout.ts`
- Validation logic is isolated in `connection-validator.ts`
- UI components are separate from business logic

#### 3. React Flow Integration
- Uses React Flow's built-in features where possible
- Custom controls extend React Flow's capabilities
- Follows React Flow's patterns and conventions

### Performance Considerations

- **Layout Calculation**: Cached and only recalculated when needed
- **Grid Snapping**: Applied only on drag end, not during drag
- **Minimap**: Uses React Flow's optimized minimap component
- **Event Handlers**: Memoized with `useCallback` to prevent re-renders

### Extending the Features

#### Adding a New Layout Algorithm

1. Add algorithm to `workflow-layout.ts`:
```typescript
function calculateMyCustomLayout(
  nodes: Node[],
  edges: Edge[]
): Node[] {
  // Your layout logic here
  return nodes;
}
```

2. Update the `applyLayout` function:
```typescript
export function applyLayout(...) {
  switch (algorithm) {
    case 'my-custom':
      return calculateMyCustomLayout(nodes, edges);
    // ...
  }
}
```

3. Add to toolbar dropdown in `workflow-toolbar.tsx`

#### Adding Custom Validation Rules

Edit `connection-validator.ts`:
```typescript
export function validateConnection(...) {
  // Existing validations...
  
  // Add your custom validation
  if (myCustomRule(connection)) {
    return {
      valid: false,
      message: 'Your custom error message',
    };
  }
  
  return { valid: true };
}
```

---

## Future Enhancements

### Planned Features
- [ ] Undo/Redo functionality
- [ ] Node context menu with actions
- [ ] Copy/paste nodes
- [ ] Node styling and customization
- [ ] Connection style options (curves, steps)
- [ ] Animated connection flow
- [ ] Node search and filter
- [ ] Workflow templates
- [ ] Export as image (PNG/SVG)

### Ideas for Improvement
- Alignment guides when dragging nodes
- Smart edge routing to minimize crossings
- Node grouping and containers
- Collapsible sub-workflows
- Custom node types
- Workflow diff and version control
- Real-time collaboration

---

## Troubleshooting

### Grid Snapping Not Working
- Check if grid is enabled in the toolbar
- Try toggling grid off and on
- Ensure you're not holding Shift (which disables snapping)

### Minimap Not Visible
- Click the minimap button in toolbar to enable
- Check if workflow has multiple nodes (minimap auto-hides for small workflows)
- Ensure minimap is not covered by other UI elements

### Connection Validation Issues
- Review validation rules in `connection-validator.ts`
- Check browser console for error messages
- Verify that nodes exist before connecting

### Layout Algorithm Not Working
- Ensure workflow has multiple nodes
- Try different algorithms to see which works best
- Check for isolated nodes (no connections)

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code in the files listed above
3. Open an issue on GitHub
4. Contact the development team

## Version History

### v1.0.0 (Current)
- ✅ Auto-layout algorithms (hierarchical, force-directed, grid)
- ✅ Grid snapping with configurable sizes
- ✅ Minimap with colored nodes
- ✅ Connection validation
- ✅ Enhanced toolbar with tooltips
- ✅ Comprehensive keyboard shortcuts

---

*Last updated: October 2025*
