import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Users, Lightbulb, TrendingUp, ArrowRight } from "lucide-react";

export default function About() {
  const values = [
    {
      icon: Target,
      title: "Our Mission",
      description: "To democratize AI agent orchestration by making it accessible, intuitive, and powerful for developers and businesses of all sizes."
    },
    {
      icon: Lightbulb,
      title: "Innovation First",
      description: "We push the boundaries of what's possible with AI agents, implementing cutting-edge features like persistent knowledge bases and multi-provider coordination."
    },
    {
      icon: Users,
      title: "User-Centric",
      description: "Every feature is designed with the user in mind, from visual workflow builders to real-time monitoring and comprehensive documentation."
    },
    {
      icon: TrendingUp,
      title: "Continuous Improvement",
      description: "We're constantly evolving SWARM based on user feedback, emerging AI capabilities, and industry best practices."
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
                About SWARM
              </h1>
              <p className="text-xl text-muted-foreground">
                Building the future of AI agent orchestration with visual simplicity, enterprise reliability, and intelligent repository management
              </p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto space-y-6 text-lg">
              <p className="text-muted-foreground">
                SWARM (Smart Workflow Automation & Repository Manager) was born from a simple observation: as AI models become more powerful, the real challenge isn't just accessing AI—it's orchestrating multiple AI agents to work together effectively while managing repository workflows.
              </p>
              
              <p className="text-muted-foreground">
                Traditional development approaches require extensive coding, complex infrastructure, and deep technical expertise. We believed there had to be a better way.
              </p>
              
              <p className="text-muted-foreground">
                Our platform combines the power of visual workflow design with enterprise-grade AI orchestration, making it possible for anyone to build sophisticated agent swarms without writing complex code or managing infrastructure.
              </p>
              
              <p className="text-muted-foreground">
                Today, SWARM serves developers, researchers, and businesses who need to coordinate AI agents at scale—from code generation pipelines to research workflows and repository management.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {values.map((value, i) => (
                <Card key={i} className="p-6 hover-elevate transition-all">
                  <value.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section className="py-20">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Built with Modern Technology</h2>
              <p className="text-lg text-muted-foreground mb-8">
                SWARM is built on a foundation of proven, enterprise-grade technologies that ensure reliability, performance, and scalability.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Frontend</h3>
                  <p className="text-sm text-muted-foreground">React, TypeScript, React Flow, TanStack Query, Shadcn UI</p>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Backend</h3>
                  <p className="text-sm text-muted-foreground">Node.js, Express, PostgreSQL, Drizzle ORM</p>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">AI Providers</h3>
                  <p className="text-sm text-muted-foreground">OpenAI, Anthropic Claude, Google Gemini</p>
                </Card>
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-2">Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">Replit, Neon PostgreSQL, OAuth2</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent">
          <div className="container">
            <Card className="p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join Us in Building the Future
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Start orchestrating AI agent swarms with SWARM today
              </p>
              <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-get-started">
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
