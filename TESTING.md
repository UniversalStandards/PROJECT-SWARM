# Phase 2B Testing Guide

## Manual Testing Checklist

### ✅ Auto-Layout Testing
- [ ] Create workflow with 10+ nodes
- [ ] Click "Auto-Arrange" dropdown
- [ ] Test Vertical Flow layout
- [ ] Test Horizontal Flow layout
- [ ] Test Force-Directed layout
- [ ] Test Radial layout
- [ ] Test Grid layout
- [ ] Verify smooth animations during layout changes
- [ ] Test Reset button

**Expected Results:**
- Nodes should rearrange without overlapping
- Edges should remain connected
- Animations should be smooth (300ms transition)
- Reset should restore view to fit all nodes

### ✅ Grid & Snapping Testing
- [ ] Press `G` to toggle grid on/off
- [ ] Verify grid dots appear/disappear
- [ ] Press `S` to toggle snap to grid
- [ ] Drag a node with snap enabled
- [ ] Verify node snaps to grid intersections
- [ ] Drag a node with snap disabled
- [ ] Verify free positioning
- [ ] Drag near another node
- [ ] Verify alignment guides appear (cyan dashed lines)

**Expected Results:**
- Grid should be visible as subtle dots
- Snap should constrain movement to 20px increments
- Alignment guides should appear within 10px of alignment
- Guides should be horizontal/vertical dashed cyan lines

### ✅ Minimap Testing
- [ ] Press `M` to toggle minimap
- [ ] Verify minimap appears in bottom-right
- [ ] Click minimap size buttons (S/M/L)
- [ ] Verify minimap resizes
- [ ] Click different areas of minimap
- [ ] Verify viewport jumps to that area
- [ ] Drag viewport rectangle in minimap
- [ ] Verify canvas pans accordingly
- [ ] Check node colors match roles

**Expected Results:**
- Minimap should show entire workflow
- Viewport rectangle should be draggable
- Node colors: Coordinator (cyan), Coder (purple), etc.
- Clicking minimap should navigate instantly

### ✅ Validation Testing
- [ ] Press `V` to open validation panel
- [ ] Create a circular dependency (A→B→C→A)
- [ ] Verify error appears: "Circular Dependency Detected"
- [ ] Create an orphan node (no connections)
- [ ] Verify warning: "Orphan Node"
- [ ] Create multiple coordinator nodes
- [ ] Verify warning: "Multiple Entry Points"
- [ ] Fix issues and verify panel updates
- [ ] Close validation panel with `V` or `Esc`

**Expected Results:**
- Errors should be red with XCircle icon
- Warnings should be amber with AlertTriangle icon
- Cycle should show path: "Node A → Node B → Node C → Node A"
- Panel should show error/warning counts
- Execute button should be disabled if errors exist

### ✅ Context Menu Testing
- [ ] Right-click a node
- [ ] Verify context menu appears
- [ ] Select "Copy" (or press Ctrl+C)
- [ ] Press Ctrl+V to paste
- [ ] Verify node duplicates with offset
- [ ] Right-click and select "Lock Position"
- [ ] Try to drag locked node
- [ ] Verify node cannot be dragged
- [ ] Right-click and select "Unlock Position"
- [ ] Right-click and select "Delete"
- [ ] Verify node is removed

**Expected Results:**
- Context menu should appear at cursor
- Copy/paste should create duplicate with label " (Copy)"
- Locked nodes should not be draggable
- Delete should remove node and connected edges

### ✅ Multi-Select Testing
- [ ] Click node to select
- [ ] Shift+Click another node
- [ ] Verify both nodes selected
- [ ] Ctrl+Click to toggle selection
- [ ] Press Ctrl+A to select all
- [ ] Verify all nodes selected
- [ ] With 2+ nodes selected, verify "Align" button appears
- [ ] Click Align dropdown
- [ ] Test "Align Left"
- [ ] Test "Align Top"
- [ ] Test "Center Horizontally"

**Expected Results:**
- Selected nodes should have border/highlight
- Align should move nodes to same X or Y coordinate
- Center should average positions
- Distribute (3+ nodes) should space evenly

### ✅ Search & Filter Testing
- [ ] Press Ctrl+F to open search
- [ ] Type "coordinator" in search box
- [ ] Verify matching nodes appear in results
- [ ] Click search result
- [ ] Verify node is selected on canvas
- [ ] Click "Filters" to expand
- [ ] Check "Coordinator" role filter
- [ ] Verify only coordinators appear
- [ ] Check "OpenAI" provider filter
- [ ] Verify only OpenAI nodes appear
- [ ] Click "Clear" to reset filters

**Expected Results:**
- Search should be case-insensitive
- Results should update in real-time
- Filters should combine (AND logic)
- Result count should be accurate
- Clicking result should focus node

### ✅ Toolbar Testing
- [ ] Verify toolbar sections: File, Edit, View, Run
- [ ] Click Save button (or Ctrl+S)
- [ ] Verify workflow saves
- [ ] Click Export button
- [ ] Verify JSON file downloads
- [ ] Click Zoom In (+)
- [ ] Verify canvas zooms in
- [ ] Click Zoom Out (-)
- [ ] Verify canvas zooms out
- [ ] Click Fit View (maximize icon)
- [ ] Verify all nodes visible
- [ ] Toggle Grid button
- [ ] Toggle Minimap button
- [ ] Toggle Validation button

**Expected Results:**
- All tooltips should appear on hover
- Disabled buttons should be grayed out
- Workflow status badge should update
- Validation errors should show count badge

### ✅ Keyboard Shortcuts Testing
Test each shortcut:

| Shortcut | Action | Expected Result |
|----------|--------|-----------------|
| Ctrl+S | Save | Workflow saved, toast appears |
| Ctrl+C | Copy | Nodes copied to clipboard |
| Ctrl+V | Paste | Nodes pasted with offset |
| Ctrl+A | Select All | All nodes selected |
| Del | Delete | Selected nodes removed |
| G | Toggle Grid | Grid appears/disappears |
| S | Toggle Snap | Snap enabled/disabled toast |
| M | Toggle Minimap | Minimap shows/hides |
| V | Toggle Validation | Panel opens/closes |
| F | Fit View | Canvas fits all nodes |
| Ctrl+F | Search | Search panel opens |
| Esc | Close/Deselect | Panels close, nodes deselect |

### ✅ Canvas Navigation Testing
- [ ] Hold Space and drag
- [ ] Verify canvas pans
- [ ] Use mouse wheel to zoom
- [ ] Verify zoom in/out
- [ ] Press F to fit view
- [ ] Check zoom indicator (bottom-left)
- [ ] Verify shows current zoom %
- [ ] Zoom to 200%
- [ ] Verify indicator shows "200%"

**Expected Results:**
- Space+drag should pan smoothly
- Mouse wheel should zoom centered on cursor
- Zoom indicator should update in real-time
- Fit view should show all nodes with padding

## Integration Testing

### Workflow Creation End-to-End
1. Open workflow builder
2. Add 3 nodes (Coordinator, Coder, Researcher)
3. Connect them in sequence
4. Press Ctrl+A to select all
5. Click Auto-Arrange → Vertical Flow
6. Verify nodes align vertically
7. Press V to open validation
8. Verify "No issues found"
9. Press Ctrl+S to save
10. Click Execute button
11. Verify execution starts

### Complex Workflow Testing
1. Create workflow with 15+ nodes
2. Create multiple branches
3. Create a cycle (intentionally)
4. Open validation panel
5. Verify cycle detected
6. Remove cycle edge
7. Verify validation passes
8. Apply Grid layout
9. Adjust spacing manually
10. Enable grid and snap
11. Fine-tune positions
12. Save workflow

## Performance Testing

### Large Workflow (50+ nodes)
- [ ] Create 50 nodes
- [ ] Apply Hierarchical layout
- [ ] Measure time (should be < 200ms)
- [ ] Apply Force-Directed layout
- [ ] Measure time (should be < 500ms)
- [ ] Test canvas pan/zoom performance
- [ ] Verify no lag or stuttering

### Real-Time Updates
- [ ] Open validation panel
- [ ] Add/remove nodes
- [ ] Verify panel updates instantly
- [ ] Drag nodes around
- [ ] Verify alignment guides appear promptly
- [ ] Type in search box
- [ ] Verify results update in real-time

## Accessibility Testing

- [ ] Tab through toolbar buttons
- [ ] Verify focus indicators visible
- [ ] Test keyboard shortcuts without mouse
- [ ] Verify tooltips readable
- [ ] Check color contrast (errors vs warnings)
- [ ] Test with screen reader (if available)

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

Verify:
- Grid rendering
- Minimap display
- Context menu positioning
- Keyboard shortcuts
- Drag and drop

## Edge Cases

### Empty States
- [ ] Open builder with 0 nodes
- [ ] Verify no errors
- [ ] Verify layout controls disabled
- [ ] Add first node
- [ ] Verify controls enabled

### Single Node
- [ ] Create workflow with 1 node
- [ ] Apply auto-layout
- [ ] Verify node centered
- [ ] No validation errors

### Maximum Connections
- [ ] Create node with 11 connections
- [ ] Open validation
- [ ] Verify warning: "Too Many Connections"

### Rapid Operations
- [ ] Rapidly add 10 nodes
- [ ] Rapidly delete 5 nodes
- [ ] Rapidly copy/paste
- [ ] Verify no crashes or state corruption

## Regression Testing

### Existing Features
- [ ] Agent configuration panel still works
- [ ] Node provider/model selection works
- [ ] Execution dialog works
- [ ] Workflow save/load works
- [ ] Node data persists correctly

## Known Limitations

1. **Undo/Redo**: Not implemented (deferred)
2. **Database Required**: Full app needs DATABASE_URL set
3. **Lasso Selection**: Not implemented (use Ctrl+Click)
4. **Node Grouping**: Not implemented (planned)
5. **Persistent Zoom**: Zoom resets on page reload

## Bug Report Template

If you find issues:

```
**Bug**: [Brief description]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Browser**: [Chrome/Firefox/Safari]
**Console Errors**: [Any errors in console]
```

## Success Criteria

✅ All auto-layout algorithms work correctly
✅ Grid and snapping are smooth and accurate
✅ Minimap navigation is intuitive
✅ Validation catches all error types
✅ Keyboard shortcuts work consistently
✅ No TypeScript errors
✅ Build succeeds
✅ No runtime errors in console

---

**Last Updated**: October 23, 2025
**Status**: Ready for Testing
