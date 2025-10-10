import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Network, Brain, Sparkles, Zap, Shield, TrendingUp, GitBranch, Database, Eye, Code, ArrowRight } from "lucide-react";
import dashboardImage from "@assets/stock_images/ai_artificial_intell_f528b33c.jpg";
import analyticsImage from "@assets/stock_images/data_analytics_visua_75f173e5.jpg";

export default function Features() {
  const features = [
    {
      icon: Network,
      title: "Visual Workflow Builder",
      description: "Design complex agent swarms with an intuitive drag-and-drop interface powered by React Flow.",
      details: [
        "Node-based workflow creation",
        "Real-time configuration panels",
        "Support for complex topologies",
        "Visual edge connections"
      ]
    },
    {
      icon: Brain,
      title: "Persistent Knowledge Base",
      description: "Agents automatically learn and share knowledge across executions, creating collective intelligence.",
      details: [
        "Automatic knowledge extraction",
        "Category-based organization",
        "Confidence scoring",
        "Cross-execution sharing"
      ]
    },
    {
      icon: Sparkles,
      title: "Multi-AI Provider Support",
      description: "Seamlessly integrate multiple AI providers in a single workflow with automatic fallbacks.",
      details: [
        "OpenAI (GPT-4, GPT-3.5)",
        "Anthropic (Claude 3.5, Opus, Haiku)",
        "Google Gemini (1.5 Pro, Flash)",
        "Provider-agnostic architecture"
      ]
    },
    {
      icon: Zap,
      title: "Real-time Execution Monitoring",
      description: "Track agent executions with live logs, message visualization, and performance metrics.",
      details: [
        "Live execution logs",
        "Agent message tracking",
        "Token usage monitoring",
        "Error and output display"
      ]
    },
    {
      icon: GitBranch,
      title: "Smart Agent Orchestration",
      description: "Intelligent coordination of agent execution with topological sorting and message passing.",
      details: [
        "Automatic execution ordering",
        "Inter-agent communication",
        "Error handling and recovery",
        "Parallel execution support"
      ]
    },
    {
      icon: Database,
      title: "Enterprise-Grade Storage",
      description: "PostgreSQL-backed data persistence with optimized queries and indexing.",
      details: [
        "Neon-backed PostgreSQL",
        "Composite indexes",
        "Efficient query patterns",
        "Data versioning"
      ]
    },
    {
      icon: TrendingUp,
      title: "Template Library",
      description: "Pre-built agent swarm configurations for common use cases and workflows.",
      details: [
        "Code generation pipelines",
        "Research workflows",
        "Content creation",
        "Data processing"
      ]
    },
    {
      icon: Shield,
      title: "Security & Authentication",
      description: "Built-in authentication with Replit Auth and secure session management.",
      details: [
        "OAuth integration",
        "Secure sessions",
        "User isolation",
        "API key management"
      ]
    },
    {
      icon: Eye,
      title: "Execution History",
      description: "Complete audit trail of all workflow executions with searchable logs.",
      details: [
        "Execution timeline",
        "Performance analytics",
        "Success/failure tracking",
        "Detailed logging"
      ]
    },
    {
      icon: Code,
      title: "Developer-Friendly",
      description: "Built with modern TypeScript, React, and best practices for extensibility.",
      details: [
        "TypeScript throughout",
        "Component-based UI",
        "REST API",
        "Comprehensive types"
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <div className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Powerful Features for
                <span className="block text-primary mt-2">AI Agent Orchestration</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Deploy AI agent swarms that intelligently automate workflows and manage your repositories.
              </p>
              <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Visual Showcase */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm">
                  <Zap className="w-4 h-4 text-primary" />
                  Real-time Monitoring
                </div>
                <h3 className="text-2xl font-bold">Track Every Execution</h3>
                <p className="text-muted-foreground">
                  Monitor agent workflows in real-time with comprehensive dashboards, live logs, and performance metrics.
                </p>
                <div className="rounded-lg overflow-hidden border border-primary/20">
                  <img src={dashboardImage} alt="Real-time monitoring dashboard" className="w-full" data-testid="img-dashboard" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Analytics & Insights
                </div>
                <h3 className="text-2xl font-bold">Optimize Performance</h3>
                <p className="text-muted-foreground">
                  Gain insights into agent behavior, execution patterns, and knowledge accumulation with detailed analytics.
                </p>
                <div className="rounded-lg overflow-hidden border border-primary/20">
                  <img src={analyticsImage} alt="Analytics and insights" className="w-full" data-testid="img-analytics" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8">
              {features.map((feature, i) => (
                <Card key={i} className="p-8 hover-elevate transition-all">
                  <feature.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <Card className="p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Experience These Features?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start building your AI agent swarms today with SWARM
              </p>
              <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-cta-get-started">
                Start Building Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
