import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <div className="flex-1">
        <div className="container py-20 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          <p className="text-muted-foreground mb-12">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  By accessing and using SWARM ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  SWARM (Smart Workflow Automation & Repository Manager) is an AI agent swarm orchestration platform that enables users to design, deploy, and monitor intelligent 
                  multi-agent workflows and automate repository management. The Service integrates with third-party AI providers and GitHub, and requires users to supply their own API keys.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You agree to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Be responsible for all activities under your account</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Respect third-party AI provider terms of service</li>
                  <li>Not use the Service for illegal or unauthorized purposes</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">4. API Keys and Third-Party Services</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The Service requires integration with third-party AI providers. You are responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Obtaining and maintaining your own API keys</li>
                  <li>Complying with provider terms of service</li>
                  <li>Any costs associated with API usage</li>
                  <li>Ensuring API keys are kept secure</li>
                </ul>
                <p className="mt-4">
                  We are not responsible for any issues arising from third-party provider services, including but not limited to 
                  service availability, API changes, or billing disputes.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">5. Usage Limits and Fair Use</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Service usage is subject to plan limits. We reserve the right to enforce fair use policies and may suspend or 
                  terminate accounts that exceed reasonable usage or abuse the Service.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  The Service and its original content, features, and functionality are owned by SWARM and are protected by international 
                  copyright, trademark, and other intellectual property laws.
                </p>
                <p className="mt-4">
                  You retain ownership of workflows, configurations, and data you create using the Service. We do not claim ownership 
                  of your content.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">7. Service Availability</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We strive to maintain high service availability but do not guarantee uninterrupted access. The Service may be temporarily 
                  unavailable due to maintenance, updates, or circumstances beyond our control.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  To the maximum extent permitted by law, SWARM shall not be liable for any indirect, incidental, special, consequential, 
                  or punitive damages resulting from your use or inability to use the Service.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may terminate or suspend your account and access to the Service immediately, without prior notice, for conduct that 
                  we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We reserve the right to modify these terms at any time. We will notify users of any material changes. Continued use 
                  of the Service after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  For questions about these Terms of Service, please contact us through your account settings or visit our support page.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
