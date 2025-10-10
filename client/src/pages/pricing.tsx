import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Sparkles } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      description: "Perfect for getting started and small projects",
      features: [
        "Up to 5 workflows",
        "100 executions/month",
        "Basic agent types",
        "Community support",
        "Knowledge base (limited)",
        "Single AI provider"
      ],
      cta: "Get Started Free",
      highlighted: false
    },
    {
      name: "Pro",
      price: "$49",
      description: "For professionals and growing teams",
      features: [
        "Unlimited workflows",
        "1,000 executions/month",
        "All agent types",
        "Priority support",
        "Full knowledge base",
        "All AI providers",
        "Advanced monitoring",
        "Template library access"
      ],
      cta: "Start Pro Trial",
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For organizations at scale",
      features: [
        "Unlimited everything",
        "Custom executions",
        "Dedicated support",
        "On-premise deployment",
        "SSO & SAML",
        "SLA guarantee",
        "Custom integrations",
        "Training & onboarding"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ];

  const faqs = [
    {
      q: "What counts as an execution?",
      a: "An execution is one complete run of a workflow, regardless of how many agents are involved. Each time you trigger a workflow, it counts as one execution."
    },
    {
      q: "Can I change plans anytime?",
      a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any differences."
    },
    {
      q: "What AI providers are supported?",
      a: "We support OpenAI (GPT-4, GPT-3.5), Anthropic (Claude 3.5, Opus, Haiku), and Google Gemini (1.5 Pro, Flash). You'll need your own API keys."
    },
    {
      q: "Is there a free trial?",
      a: "The Free plan is available forever with no credit card required. Pro includes a 14-day trial to test all features."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <div className="flex-1">
        {/* Hero */}
        <section className="py-20 bg-gradient-to-br from-primary/20 via-blue-500/10 to-transparent">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free and scale as you grow.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-20">
          <div className="container">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {plans.map((plan, i) => (
                <Card key={i} className={`p-8 ${plan.highlighted ? 'border-primary shadow-lg ring-2 ring-primary/20' : ''}`}>
                  {plan.highlighted && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-4">
                      <Sparkles className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">Most Popular</span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <p className="text-muted-foreground mb-6">{plan.description}</p>
                  
                  <Button 
                    className="w-full mb-6" 
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => window.location.href = "/api/login"}
                    data-testid={`button-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">
                Frequently Asked Questions
              </h2>
              
              <div className="space-y-6">
                {faqs.map((faq, i) => (
                  <Card key={i} className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container">
            <Card className="p-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Building?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join teams using SWARM to orchestrate AI agent swarms
              </p>
              <Button size="lg" onClick={() => window.location.href = "/api/login"} data-testid="button-cta-get-started">
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
