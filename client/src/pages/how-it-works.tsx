import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Settings, Play, TrendingUp, ArrowRight } from "lucide-react";
import workflowImage from "@assets/stock_images/modern_digital_workf_ee8cde70.jpg";
import dashboardImage from "@assets/stock_images/ai_artificial_intell_f528b33c.jpg";
import analyticsImage from "@assets/stock_images/data_analytics_visua_75f173e5.jpg";

export default function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Workflow,
      title: "Design Your Workflow",
      description: "Use our visual drag-and-drop builder to create agent swarms. Add coordinator, coder, researcher, and specialist agents with custom roles and capabilities.",
      features: ["Drag-and-drop interface", "Pre-built agent templates", "Visual node connections", "Real-time validation"]
    },
    {
      number: "02",
      icon: Settings,
      title: "Configure Agents",
      description: "Fine-tune each agent with AI provider selection, model configuration, system prompts, and behavior settings. Mix and match providers within the same workflow.",
      features: ["Multi-provider support", "Custom system prompts", "Temperature control", "Token management"]
    },
    {
      number: "03",
      icon: Play,
      title: "Execute & Monitor",
      description: "Run your workflow and watch agents collaborate in real-time. Track execution logs, agent messages, and knowledge accumulation with live monitoring.",
      features: ["Real-time execution", "Live log streaming", "Message visualization", "Performance metrics"]
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "Learn & Improve",
      description: "Agents automatically extract and share knowledge across executions. Each run makes the swarm smarter with persistent collective intelligence.",
      features: ["Knowledge extraction", "Cross-execution learning", "Confidence scoring", "Smart retrieval"]
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
                How SWARM Works
              </h1>
              <p className="text-xl text-muted-foreground">
                Deploy AI agent swarms that intelligently automate workflows and manage your repositories. From design to deployment in four simple steps.
              </p>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20">
          <div className="container">
            <div className="space-y-20">
              {steps.map((step, i) => (
                <div key={i} className="grid md:grid-cols-2 gap-12 items-center">
                  <div className={`${i % 2 === 1 ? 'md:order-2' : ''} space-y-6`}>
                    <div className="inline-flex items-center gap-4">
                      <div className="text-6xl font-bold text-primary/20">{step.number}</div>
                      <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    
                    <h2 className="text-3xl font-bold">{step.title}</h2>
                    <p className="text-lg text-muted-foreground">{step.description}</p>
                    
                    <ul className="grid grid-cols-2 gap-3">
                      {step.features.map((feature, j) => (
                        <li key={j} className="flex items-center gap-2 text-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                    <Card className="overflow-hidden border-primary/20">
                      <img 
                        src={i === 0 ? workflowImage : i === 2 ? dashboardImage : analyticsImage} 
                        alt={step.title}
                        className="w-full h-auto"
                        data-testid={`img-step-${i + 1}`}
                      />
                    </Card>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Under the Hood</h2>
                <p className="text-lg text-muted-foreground">
                  Built with modern technologies for enterprise reliability
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">AI Orchestration</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Topological execution ordering</li>
                    <li>• Intelligent agent coordination</li>
                    <li>• Provider-agnostic architecture</li>
                    <li>• Automatic fallback handling</li>
                  </ul>
                </Card>
                
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Knowledge System</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• Pattern-based extraction</li>
                    <li>• Composite index queries</li>
                    <li>• Confidence scoring</li>
                    <li>• Category-based retrieval</li>
                  </ul>
                </Card>
                
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Data Storage</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• PostgreSQL with Drizzle ORM</li>
                    <li>• Optimized indexing</li>
                    <li>• JSONB for flexible data</li>
                    <li>• Efficient query patterns</li>
                  </ul>
                </Card>
                
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Frontend Stack</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• React + TypeScript</li>
                    <li>• React Flow for workflows</li>
                    <li>• TanStack Query for data</li>
                    <li>• Shadcn UI components</li>
                  </ul>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container">
            <Card className="p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Build your first AI agent swarm in minutes
              </p>
              <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-get-started">
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
