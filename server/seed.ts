import { storage } from './storage';

async function seed() {
  console.log('Seeding database...');

  // Create a mock user
  const user = await storage.createUser({
    replitId: 'mock-user-id',
    username: 'Demo User',
    email: 'demo@sawrm.ai',
    avatarUrl: null,
  });

  console.log('Created user:', user.id);

  // Create template workflows
  const templates = [
    {
      name: 'Customer Support Swarm',
      description: 'Multi-agent system for handling customer inquiries with triage, resolution, and escalation agents',
      category: 'Customer Service',
      nodes: [
        {
          id: 'triage-1',
          type: 'agent',
          position: { x: 100, y: 100 },
          data: {
            label: 'Triage Agent',
            role: 'Coordinator',
            provider: 'openai',
            model: 'gpt-4',
            description: 'Analyzes incoming support requests and routes to appropriate handler',
          },
        },
        {
          id: 'resolver-1',
          type: 'agent',
          position: { x: 400, y: 50 },
          data: {
            label: 'Technical Resolver',
            role: 'Coder',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            description: 'Handles technical support questions',
          },
        },
        {
          id: 'escalation-1',
          type: 'agent',
          position: { x: 400, y: 200 },
          data: {
            label: 'Escalation Agent',
            role: 'Custom',
            provider: 'openai',
            model: 'gpt-4-turbo',
            description: 'Handles complex issues requiring human intervention',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'triage-1', target: 'resolver-1', animated: true },
        { id: 'e2', source: 'triage-1', target: 'escalation-1', animated: true },
      ],
    },
    {
      name: 'Research & Analysis Pipeline',
      description: 'Coordinated agents for gathering information, analyzing data, and generating insights',
      category: 'Research',
      nodes: [
        {
          id: 'coordinator-1',
          type: 'agent',
          position: { x: 100, y: 150 },
          data: {
            label: 'Research Coordinator',
            role: 'Coordinator',
            provider: 'openai',
            model: 'gpt-4',
            description: 'Plans research strategy and coordinates other agents',
          },
        },
        {
          id: 'researcher-1',
          type: 'agent',
          position: { x: 400, y: 100 },
          data: {
            label: 'Data Researcher',
            role: 'Researcher',
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            description: 'Gathers and processes research data',
          },
        },
        {
          id: 'analyst-1',
          type: 'agent',
          position: { x: 700, y: 150 },
          data: {
            label: 'Insight Analyst',
            role: 'Custom',
            provider: 'anthropic',
            model: 'claude-3-opus-20240229',
            description: 'Synthesizes findings into actionable insights',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'coordinator-1', target: 'researcher-1', animated: true },
        { id: 'e2', source: 'researcher-1', target: 'analyst-1', animated: true },
      ],
    },
    {
      name: 'Code Review & Security',
      description: 'Automated code review with security analysis and optimization suggestions',
      category: 'Development',
      nodes: [
        {
          id: 'intake-1',
          type: 'agent',
          position: { x: 100, y: 150 },
          data: {
            label: 'Code Intake',
            role: 'Coordinator',
            provider: 'openai',
            model: 'gpt-4-turbo',
            description: 'Receives and preprocesses code submissions',
          },
        },
        {
          id: 'reviewer-1',
          type: 'agent',
          position: { x: 400, y: 50 },
          data: {
            label: 'Code Reviewer',
            role: 'Coder',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            description: 'Reviews code quality and best practices',
          },
        },
        {
          id: 'security-1',
          type: 'agent',
          position: { x: 400, y: 200 },
          data: {
            label: 'Security Analyzer',
            role: 'Security',
            provider: 'openai',
            model: 'gpt-4',
            description: 'Identifies security vulnerabilities',
          },
        },
        {
          id: 'optimizer-1',
          type: 'agent',
          position: { x: 700, y: 125 },
          data: {
            label: 'Performance Optimizer',
            role: 'Coder',
            provider: 'gemini',
            model: 'gemini-1.5-pro',
            description: 'Suggests performance improvements',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'intake-1', target: 'reviewer-1', animated: true },
        { id: 'e2', source: 'intake-1', target: 'security-1', animated: true },
        { id: 'e3', source: 'reviewer-1', target: 'optimizer-1', animated: true },
        { id: 'e4', source: 'security-1', target: 'optimizer-1', animated: true },
      ],
    },
  ];

  for (const templateData of templates) {
    // Create workflow
    const workflow = await storage.createWorkflow({
      userId: user.id,
      name: templateData.name,
      description: templateData.description,
      nodes: templateData.nodes,
      edges: templateData.edges,
      isTemplate: true,
      category: templateData.category,
    });

    console.log('Created workflow:', workflow.id);

    // Create agents for workflow
    for (const node of templateData.nodes) {
      await storage.createAgent({
        workflowId: workflow.id,
        name: node.data.label,
        role: node.data.role,
        description: node.data.description,
        provider: node.data.provider,
        model: node.data.model,
        systemPrompt: `You are a ${node.data.label}. ${node.data.description}`,
        temperature: 70,
        maxTokens: 1000,
        capabilities: [],
        nodeId: node.id,
        position: node.position,
      });
    }

    // Create template
    await storage.createTemplate({
      workflowId: workflow.id,
      name: templateData.name,
      description: templateData.description,
      category: templateData.category,
      thumbnailUrl: null,
      featured: true,
    });

    console.log('Created template for workflow:', workflow.id);
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
