import { PublicHeader } from "@/components/public-header";
import { Card } from "@/components/ui/card";

export default function Privacy() {
  return (
    <div className="min-h-screen flex flex-col">
      <PublicHeader />
      
      <div className="flex-1">
        <div className="container py-20 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          <p className="text-muted-foreground mb-12">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-8">
            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We collect information that you provide directly to us, including:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Account information (name, email address, profile picture)</li>
                  <li>Workflow configurations and agent settings</li>
                  <li>Execution logs and performance data</li>
                  <li>Usage patterns and preferences</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We use the information we collect to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process your workflow executions and store results</li>
                  <li>Communicate with you about updates and features</li>
                  <li>Analyze usage patterns to enhance user experience</li>
                  <li>Ensure security and prevent fraud</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">3. Data Storage and Security</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Your data is stored securely using industry-standard encryption. We use PostgreSQL databases with regular backups. 
                  Workflow data and execution logs are isolated per user account.
                </p>
                <p>
                  We implement appropriate technical and organizational measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">4. AI Provider Integration</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  SWARM integrates with third-party AI providers (OpenAI, Anthropic, Google). When you use these providers:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Your API keys are encrypted and stored securely</li>
                  <li>Workflow inputs are sent to the selected AI provider</li>
                  <li>Provider usage is subject to their respective privacy policies</li>
                  <li>We do not share your data with providers beyond what's necessary for execution</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">5. Data Retention</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We retain your information for as long as your account is active or as needed to provide services. 
                  You may request deletion of your account and associated data at any time.
                </p>
                <p>
                  Execution logs and workflow history may be retained for up to 90 days for performance monitoring and debugging purposes.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Export your workflow configurations</li>
                  <li>Opt-out of marketing communications</li>
                </ul>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We use essential cookies for authentication and session management. We do not use third-party tracking cookies 
                  or analytics services that collect personal information.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">8. Changes to This Policy</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy 
                  on this page and updating the "Last updated" date.
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  If you have questions about this privacy policy or our data practices, please contact us through your account settings 
                  or visit our support page.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
