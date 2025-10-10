# SWARM - Smart Workflow Automation & Repository Manager - Design Guidelines

## Design Approach: Hybrid System

**Selected Framework**: Material Design 3 + Modern SaaS Aesthetics
- Foundation: Material Design 3 for enterprise-grade patterns and information density
- Enhancement: Modern SaaS visual treatments inspired by Linear, Vercel Dashboard, and Stripe
- Specialization: React Flow best practices for workflow visualization

**Rationale**: This is a complex, information-dense productivity tool requiring clear hierarchy and efficient workflows, combined with modern visual appeal to differentiate in the AI orchestration space.

---

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (Developer/Technical Tool)

Primary Brand Colors:
- Primary Cyan: 189 94% 43% (interactive elements, primary CTAs)
- Primary Blue: 217 91% 60% (secondary actions, accents)
- Deep Navy: 222 47% 11% (main background)
- Slate Gray: 215 25% 17% (secondary surfaces)

Supporting Colors:
- Success Green: 142 76% 36% (agent active states, success indicators)
- Warning Amber: 38 92% 50% (alerts, warnings)
- Error Red: 0 72% 51% (errors, critical states)
- Neutral Gray: 215 16% 47% (text, borders)

Gradient Overlays:
- Cyan-Blue Gradient: from 189 94% 43% to 217 91% 60%
- Glass Effect: rgba(255, 255, 255, 0.1) with backdrop-blur

**Light Mode** (Optional secondary theme):
- Invert the dark mode palette with white backgrounds and dark text

### B. Typography

**Font Families**:
- Primary: Inter (body text, UI elements)
- Monospace: JetBrains Mono (code, technical data, node IDs)
- Display: Inter Display (headings, hero sections)

**Type Scale**:
- Hero/Display: text-5xl to text-6xl, font-bold
- Page Titles: text-3xl to text-4xl, font-semibold
- Section Headers: text-xl to text-2xl, font-semibold
- Body Text: text-sm to text-base, font-normal
- Captions/Meta: text-xs, font-medium

**Line Heights**: 
- Headings: leading-tight (1.25)
- Body: leading-relaxed (1.625)
- Code/Technical: leading-normal (1.5)

### C. Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4, p-6, p-8
- Section spacing: space-y-6, space-y-8, space-y-12
- Grid gaps: gap-4, gap-6, gap-8
- Container max-widths: max-w-7xl for main content, max-w-4xl for forms

**Grid System**:
- Dashboard: 12-column grid with responsive breakpoints
- Workflow Canvas: Full-width with sidebar panels (sidebar: w-80, w-96)
- Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for templates/agents

### D. Component Library

**Core UI Elements**:

1. **Navigation**:
   - Top bar: Sticky header with logo, main nav, user menu (h-16, bg-slate-900/95, backdrop-blur)
   - Sidebar: Collapsible navigation with icons and labels (w-64 expanded, w-16 collapsed)
   - Breadcrumbs: For deep navigation within workflows

2. **Cards & Containers**:
   - Glass cards: bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-6
   - Workflow nodes: Custom React Flow nodes with role-based colors (shadow-xl, rounded-lg)
   - Panel containers: bg-slate-800/50 rounded-lg p-4

3. **Forms & Inputs**:
   - Input fields: bg-slate-700/50 border-slate-600 focus:border-cyan-500 rounded-lg px-4 py-2
   - Dropdowns: Custom Radix UI Select with glass styling
   - Toggle switches: Cyan when active, gray when inactive
   - Multi-step wizard: Progress indicator with steps, current step highlighted

4. **Data Display**:
   - Agent status badges: Rounded-full with status colors (bg-green-500/20 text-green-400)
   - Execution logs: Monospace font, scrollable terminal-style (bg-black/50)
   - Metrics cards: Large numbers with trend indicators (arrows, sparklines)
   - Template cards: Image + title + description + action button

5. **Interactive Elements**:
   - Primary buttons: bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500
   - Secondary buttons: border-cyan-500 text-cyan-400 hover:bg-cyan-500/10
   - Icon buttons: Circular with hover scale effect (hover:scale-110 transition)
   - Node connectors: Smooth bezier curves with animated flow indicators

6. **Overlays & Modals**:
   - AI Assistant panel: Fixed bottom-right, glass styling, h-[500px] w-96
   - Configuration modals: Center-screen, max-w-2xl, with backdrop-blur overlay
   - Toast notifications: Top-right stack with auto-dismiss (Sonner library)

### E. Workflow Canvas Specific

**React Flow Customization**:
- Canvas background: Dot pattern in slate-700 on slate-900
- Node styling: 
  - Agent nodes: Cyan border, white background, status indicator dot
  - Coordinator nodes: Blue gradient background, white text
  - Task nodes: Slate background with amber accent
  - Tool nodes: Purple accent for API/function nodes
- Edge styling:
  - Message edges: Dashed cyan line with arrow
  - Data flow edges: Solid blue line with animated dots
- Controls: Glass-styled minimap, zoom controls in bottom-left
- Panel overlays: Agent config panel slides from right (w-96)

---

## Key User Flows Design

### 1. Dashboard/Landing
- Hero section: Full-width gradient background with primary CTA (h-[60vh])
- Quick stats: 4-column grid showing active agents, workflows, executions
- Recent workflows: Card grid (grid-cols-3) with workflow previews
- Template library: Horizontal scrollable carousel of pre-built swarms

### 2. Workflow Builder
- Canvas: Full-screen React Flow with sidebar
- Left sidebar: Agent library (draggable items)
- Right panel: Node configuration (slides in on selection)
- Top toolbar: Save, execute, template actions
- Bottom status: Connection status, agent count, execution state

### 3. Agent Configuration
- Tabbed interface: Details, Capabilities, Tasks, Advanced
- Form sections: Clearly separated with headers and dividers
- Live preview: Agent node preview updates in real-time
- AI suggestions: Floating panel with recommended configurations

### 4. Execution Monitoring
- Split view: Workflow visualization (60%) + Logs (40%)
- Real-time updates: WebSocket-powered status changes
- Step-by-step progress: Visual indicators on workflow nodes
- Expandable log viewer: Monospace, syntax-highlighted output

---

## Animation & Interaction

**Motion Design** (Framer Motion):
- Page transitions: Fade + slide (duration-300)
- Card hover: Scale 1.02 + shadow increase (hover:scale-102 transition-transform)
- Node selection: Glow effect with cyan border
- Loading states: Pulsing gradients for skeleton screens
- Success/Error: Checkmark/X animation on completion

**Micro-interactions**:
- Button press: Scale down (active:scale-95)
- Toggle switch: Slide animation with spring physics
- Dropdown open: Slide down with fade (animate-in)
- AI typing indicator: Bouncing dots in chat interface

---

## Accessibility & Responsive

**Dark Mode Optimization**:
- Contrast ratios: Minimum 4.5:1 for all text
- Focus indicators: 2px cyan outline (focus:ring-2 ring-cyan-500)
- Color blindness: Status conveyed with icons + color

**Responsive Breakpoints**:
- Mobile (< 768px): Stack workflow sidebar, simplified canvas controls
- Tablet (768-1024px): Side-by-side panels with reduced widths
- Desktop (> 1024px): Full multi-panel layout with all features

**Performance**:
- Virtualized lists for large agent libraries
- Lazy loading for workflow templates
- Debounced search and filter inputs

---

## Images & Visual Assets

**Hero Section**: 
- Large background: Abstract network visualization (nodes and connections) with cyan-blue gradient overlay, subtle animation
- Placement: Full-width hero (h-[60vh]) on landing/dashboard page

**Agent Node Icons**:
- Custom SVG icons from Lucide React library
- Agent types: Bot, Code, Search, Database, Shield icons
- Consistent 20x20 or 24x24 sizing within nodes

**Template Cards**:
- Thumbnail images: Workflow preview screenshots (aspect-ratio: 16/9)
- Placeholder: Abstract geometric patterns with brand gradients
- Overlay: Glass card with template name and description

**Decorative Elements**:
- Floating particles/dots in hero background
- Grid patterns in canvas background
- Glow effects on active nodes and connections