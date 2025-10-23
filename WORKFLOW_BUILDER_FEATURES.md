# Workflow Builder UX Features - Visual Guide

## 🎨 UI Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  TOOLBAR                                                             │
│  [Workflow Name] [Status] │ File Edit View Layout │ [Execute] [⏱]  │
└─────────────────────────────────────────────────────────────────────┘
│                                                                       │
│  ┌──────────────┐                           ┌──────────────────┐    │
│  │ Add Agent    │                           │ Layout Controls  │    │
│  │ Panel        │                           │ [Auto-Arrange ▼] │    │
│  │              │                           │ [Align ▼]        │    │
│  │ [Coordinator]│    WORKFLOW CANVAS        │ [Distribute ▼]   │    │
│  │ [Coder]      │    ┌─────┐               │ [Reset]          │    │
│  │ [Researcher] │    │Node │               └──────────────────┘    │
│  │ [Database]   │    └──┬──┘                                        │
│  │ [Security]   │       │                                           │
│  │ [Custom]     │       ▼                                           │
│  └──────────────┘    ┌─────┐                                        │
│                      │Node │                                        │
│                      └─────┘                                        │
│                                                                      │
│  [Zoom: 100%]                            ┌──────────┐               │
│                                          │ Minimap  │               │
│                                          │ [S][M][L]│               │
│                                          │ ┌──────┐ │               │
│                                          │ │▓▓░░░░│ │               │
│                                          │ │▓▓░░░░│ │               │
│                                          │ └──────┘ │               │
│                                          └──────────┘               │
└──────────────────────────────────────────────────────────────────────┘

[Validation Panel]          [Search Panel]          [Context Menu]
[Shown on right side]       [Shown on left side]    [On right-click]
```

## 🔧 Component Hierarchy

### Main Components

#### 1. BuilderToolbar
```
┌─────────────────────────────────────────────────────────────┐
│ [💎 Workflow] │ 💾 📤 📥 │ ↶ ↷ ✂️ 📋 🗑️ │ 🔍 📊 🗺️ │ ▶️ 📅 │
│               │  File    │  Edit      │  View  │   Run   │
└─────────────────────────────────────────────────────────────┘
```

**Sections:**
- **Status**: Workflow name and badge (draft/saved/running)
- **File**: Save, Import, Export
- **Edit**: Undo, Redo, Cut, Copy, Paste, Delete
- **View**: Zoom In/Out, Fit View, Grid, Minimap, Validation
- **Run**: Execute, Schedule

#### 2. LayoutControls
```
┌──────────────────────────────┐
│ [🔀 Auto-Arrange ▼]         │
│   ├─ Vertical Flow           │
│   ├─ Horizontal Flow         │
│   ├─ Force-Directed          │
│   ├─ Radial                  │
│   └─ Grid                    │
│                              │
│ [⬌ Align ▼] (2+ selected)   │
│   ├─ Align Left              │
│   ├─ Align Right             │
│   ├─ Align Top               │
│   ├─ Align Bottom            │
│   ├─ Center Horizontally     │
│   └─ Center Vertically       │
│                              │
│ [⬌ Distribute ▼] (3+ sel.)  │
│   ├─ Horizontally            │
│   └─ Vertically              │
│                              │
│ [↻ Reset]                    │
└──────────────────────────────┘
```

#### 3. Minimap
```
┌──────────────────────┐
│ Minimap    [S][M][L] │
├──────────────────────┤
│ ┌──────────────────┐ │
│ │ ▓ Coordinator    │ │
│ │ ● Coder          │ │
│ │ ○ Researcher     │ │
│ │ □ Database       │ │
│ │ ◇ Security       │ │
│ │                  │ │
│ │  ┌─────┐         │ │
│ │  │View │ ◄─ Viewport
│ │  └─────┘         │ │
│ └──────────────────┘ │
│ Press M to toggle    │
└──────────────────────┘
```

#### 4. ValidationPanel
```
┌───────────────────────────────────┐
│ 🛡️ Workflow Validation            │
├───────────────────────────────────┤
│ [0 Errors] [2 Warnings]           │
│                                   │
│ ⚠️ Orphan Node                    │
│ Node "Research Agent" has no      │
│ connections                       │
│                                   │
│ ⚠️ Multiple Entry Points          │
│ 2 nodes have no incoming          │
│ connections. Consider having      │
│ a single coordinator node.        │
│                                   │
│ ✅ Workflow Valid                 │
│ No critical issues found.         │
└───────────────────────────────────┘
```

#### 5. NodeSearch
```
┌────────────────────────────┐
│ 🔍 Search Nodes            │
├────────────────────────────┤
│ [🔍 Search nodes...    [×] │
│                            │
│ [🔽 Filters] [Clear]       │
│   Role                     │
│   ☑ Coordinator            │
│   ☑ Coder                  │
│   ☐ Researcher             │
│                            │
│   Provider                 │
│   ☑ OpenAI                 │
│   ☐ Anthropic              │
│                            │
│ ─────────────────────────  │
│ 3 results                  │
│                            │
│ ┌──────────────────────┐   │
│ │ Main Coordinator     │   │
│ │ [Coordinator][openai]│   │
│ └──────────────────────┘   │
│ ┌──────────────────────┐   │
│ │ Code Generator       │   │
│ │ [Coder][openai]      │   │
│ └──────────────────────┘   │
└────────────────────────────┘
```

#### 6. NodeContextMenu
```
Right-click on node:

┌────────────────────────┐
│ 📋 Copy        Ctrl+C  │
│ 📑 Duplicate   Ctrl+D  │
├────────────────────────┤
│ 🔒 Lock Position       │
├────────────────────────┤
│ 📚 Arrange          ▶  │
│   ├─ Bring to Front    │
│   └─ Send to Back      │
│ 💬 Add Note            │
│ 🕒 View History        │
├────────────────────────┤
│ 🗑️ Delete        Del   │
└────────────────────────┘
```

## 🎹 Keyboard Shortcuts Reference

### Essential Shortcuts
```
┌─────────────────────────────────────────┐
│ EDITING                                 │
├─────────────────────────────────────────┤
│ Ctrl+C    Copy selected nodes           │
│ Ctrl+V    Paste copied nodes            │
│ Ctrl+X    Cut selected nodes            │
│ Ctrl+A    Select all nodes              │
│ Del       Delete selected nodes         │
├─────────────────────────────────────────┤
│ VIEW & NAVIGATION                       │
├─────────────────────────────────────────┤
│ G         Toggle grid                   │
│ S         Toggle snap to grid           │
│ M         Toggle minimap                │
│ V         Toggle validation panel       │
│ F         Fit to screen                 │
│ Ctrl+F    Open search panel             │
├─────────────────────────────────────────┤
│ FILE                                    │
├─────────────────────────────────────────┤
│ Ctrl+S    Save workflow                 │
├─────────────────────────────────────────┤
│ OTHER                                   │
├─────────────────────────────────────────┤
│ Esc       Close panels/deselect         │
│ Space     Pan canvas (while dragging)   │
│ Wheel     Zoom in/out                   │
└─────────────────────────────────────────┘
```

## 🎯 Feature States

### Grid Display States
```
Grid ON + Snap ON        Grid ON + Snap OFF       Grid OFF
┌─·─·─·─·─·─┐           ┌─·─·─·─·─·─┐           ┌───────────┐
│ ·  ·  ·  · │           │ ·  ·  ·  · │           │           │
│  [Node]  · │           │  [Node]    │           │  [Node]   │
│ ·  ·  ·  · │           │ ·  ·  ·  · │           │           │
│ ·  ·  ·  · │           │ ·  ·  ·  · │           │           │
└───────────┘           └───────────┘           └───────────┘
Snaps to dots           Free positioning        Clean canvas
```

### Alignment Guides
```
Dragging node shows alignment guides:

     Node A
       ↓
    ┌─────┐
    │     │ ← Dragging this node
    └─────┘
       ║  ← Vertical guide (aligned X)
       ║
    ┌─────┐
    │     │ ← Node B (aligned)
    └─────┘
```

### Validation States
```
✅ Valid Workflow        ⚠️ Warnings             ❌ Errors
No issues found         2 orphan nodes         Circular dependency
Execute enabled         Can execute            Cannot execute
```

## 📊 Auto-Layout Examples

### Hierarchical Layout (Vertical)
```
Before:                  After:
[A]  [C]                    [A]
  [B]                      /   \
                         [B]   [C]
                               |
                              [D]
```

### Force-Directed Layout
```
Before:                  After:
[A][B][C]               [A]──[B]
[D]                        ╲  ╱
                            [C]
                             │
                            [D]
```

### Circular Layout
```
Before:                  After:
[A] [B]                    [A]
[C] [D]                 [D]   [B]
                           [C]
```

### Grid Layout
```
Before:                  After:
[A]                     [A]  [B]  [C]
  [B][C]
    [D]                 [D]  [E]  [F]
  [E]  [F]
```

## 🎨 Node Color Coding (Minimap)

```
Role Colors:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● Coordinator    Cyan    #06b6d4
● Coder          Purple  #a855f7
● Researcher     Amber   #f59e0b
● Database       Blue    #3b82f6
● Security       Green   #10b981
● Custom         Slate   #64748b
```

## 🔄 Workflow States

```
Draft State
┌─────────────────────────────┐
│ [Untitled Workflow] [draft] │
│ Not saved yet               │
└─────────────────────────────┘

Saved State
┌─────────────────────────────┐
│ [My Workflow] [saved]       │
│ Last saved: 2m ago          │
└─────────────────────────────┘

Running State
┌─────────────────────────────┐
│ [My Workflow] [running]     │
│ Execution in progress...    │
└─────────────────────────────┘
```

## 🎯 Multi-Select Operations

```
Select Multiple Nodes:
1. Shift+Click: Add to selection
2. Ctrl+Click: Toggle selection
3. Ctrl+A: Select all

Operations on Selection:
┌──────────────────────┐
│ Selected: 3 nodes    │
├──────────────────────┤
│ [Align Left]         │
│ [Align Top]          │
│ [Distribute Evenly]  │
│ [Delete All]         │
│ [Copy]               │
└──────────────────────┘
```

## 💡 Usage Tips

### Best Practices
1. **Start with Layout**: Use auto-layout first, then fine-tune positions
2. **Enable Grid**: Makes alignment easier for manual adjustments
3. **Use Search**: Quickly find nodes in large workflows
4. **Check Validation**: Before executing, review validation panel
5. **Keyboard First**: Learn shortcuts for faster workflow creation

### Performance Tips
- Use Grid layout for 50+ nodes (fastest)
- Force-directed layout works best with <30 nodes
- Hide minimap for very large workflows if needed
- Use search instead of manual scrolling

### Workflow Design Tips
- Start with a single Coordinator node
- Group related agents visually
- Use consistent naming conventions
- Lock node positions once layout is finalized
- Add notes to complex nodes via context menu

---

**Quick Start**: Press **Ctrl+F** to search, **F** to fit view, **G** for grid
