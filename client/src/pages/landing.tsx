import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PublicHeader } from "@/components/public-header";
import { Sparkles, Zap, Shield, Network, Brain, TrendingUp, ArrowRight, Check } from "lucide-react";
import workflowImage from "@assets/stock_images/modern_digital_workf_ee8cde70.jpg";
import dashboardImage from "@assets/stock_images/ai_artificial_intell_f528b33c.jpg";
import analyticsImage from "@assets/stock_images/data_analytics_visua_75f173e5.jpg";

export default function Landing() {
  const features = [
    {
      icon: Network,
      title: "Visual Workflow Design",
      description: "Drag-and-drop interface for building complex agent swarms with intuitive node-based workflows."
    },
    {
      icon: Brain,
      title: "Persistent Knowledge Base",
      description: "Agents learn and share knowledge across executions, creating collective intelligence that improves over time."
    },
    {
      icon: Sparkles,
      title: "Multi-AI Provider Support",
      description: "Seamlessly integrate OpenAI, Anthropic Claude, and Google Gemini in a single orchestration platform."
    },
    {
      icon: Zap,
      title: "Real-time Monitoring",
      description: "Track agent executions, view live logs, and monitor communication between agents in real-time."
    },
    {
      icon: Shield,
      title: "Enterprise-Ready",
      description: "Built with TypeScript, PostgreSQL, and modern security practices for production deployments."
    },
    {
      icon: TrendingUp,
      title: "Template Library",
      description: "Start quickly with pre-built agent swarm configurations for common use cases and workflows."
    }
  ];

  const useCases = [
    { title: "Code Generation Pipelines", description: "Coordinate agents for requirements analysis, code generation, and testing" },
    { title: "Research & Analysis", description: "Deploy swarms that gather, analyze, and synthesize information from multiple sources" },
    { title: "Content Creation", description: "Orchestrate agents for ideation, drafting, editing, and optimization" },
    { title: "Data Processing", description: "Build workflows that validate, transform, and analyze complex datasets" }
  ];

  const handleGetStarted = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Enterprise AI Agent Orchestration</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Orchestrate AI Agent Swarms
              <span className="block text-primary mt-2">With Visual Simplicity</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Deploy AI agent swarms that intelligently automate workflows and manage your repositories.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={handleGetStarted} className="text-lg px-8" data-testid="button-hero-get-started">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" asChild className="text-lg px-8">
                <a href="/how-it-works" data-testid="link-how-it-works">
                  See How It Works
                </a>
              </Button>
            </div>

            {/* Product Screenshot */}
            <div className="mt-12 max-w-5xl mx-auto">
              <div className="relative rounded-xl overflow-hidden shadow-2xl border border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/20" />
                <img 
                  src={workflowImage} 
                  alt="SWARM Workflow Builder Interface" 
                  className="w-full h-auto"
                  data-testid="img-hero-product"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-muted/50">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Powerful Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, deploy, and scale AI agent orchestration workflows
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="p-6 hover-elevate transition-all">
                <feature.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20">
        <div className="container">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">Built for Real-World Use Cases</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From code generation to research analysis, SWARM adapts to your workflow
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {useCases.map((useCase, i) => (
              <Card key={i} className="p-6 hover-elevate transition-all">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">{useCase.title}</h3>
                    <p className="text-sm text-muted-foreground">{useCase.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent">
        <div className="container">
          <Card className="p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Build Your AI Agent Swarm?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join teams using SWARM to orchestrate intelligent workflows at scale
            </p>
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8" data-testid="button-cta-get-started">
              Start Building Now
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t bg-muted/50">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-500">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold">SWARM</h3>
                <p className="text-xs text-muted-foreground">Workflow & Repo Manager</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <a href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </a>
              <a href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </a>
            </div>
          </div>
          <div className="mt-8 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} SWARM. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
