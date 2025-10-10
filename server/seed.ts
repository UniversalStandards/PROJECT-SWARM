import { storage } from './storage';

async function seed() {
  console.log('Seeding database...');

  // Create a mock user for templates
  const user = await storage.createUser({
    replitId: 'template-user-id',
    username: 'SWARM Templates',
    email: 'templates@swarm.ai',
    avatarUrl: null,
  });

  console.log('Created template user:', user.id);

  // Create executable template workflows
  const templates = [
    {
      name: 'Code Generation Pipeline',
      description: 'Generate production-ready code from requirements with architecture planning, implementation, and testing',
      category: 'Development',
      nodes: [
        {
          id: 'coordinator-1',
          type: 'agent',
          position: { x: 100, y: 150 },
          data: {
            label: 'Architecture Planner',
            role: 'Coordinator',
            provider: 'openai',
            model: 'gpt-4o-mini',
            description: 'Analyzes requirements and creates technical architecture plan',
            systemPrompt: `You are an Architecture Planner AI. Analyze the user's feature request and create a detailed technical plan.

Your output should include:
1. Technical architecture overview
2. Key components needed
3. Data flow and dependencies
4. Technology recommendations

Be specific and actionable. Focus on practical implementation details.`,
          },
        },
        {
          id: 'coder-1',
          type: 'agent',
          position: { x: 400, y: 100 },
          data: {
            label: 'Code Generator',
            role: 'Coder',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            description: 'Implements code based on architecture plan',
            systemPrompt: `You are a Code Generator AI. Based on the architecture plan provided, generate clean, production-ready code.

Requirements:
- Follow best practices and design patterns
- Include proper error handling
- Add inline comments for complex logic
- Use TypeScript for type safety
- Write modular, testable code

Output working code that can be directly used.`,
          },
        },
        {
          id: 'qa-1',
          type: 'agent',
          position: { x: 700, y: 150 },
          data: {
            label: 'QA Reviewer',
            role: 'QA',
            provider: 'openai',
            model: 'gpt-4o-mini',
            description: 'Reviews code quality and suggests improvements',
            systemPrompt: `You are a QA Reviewer AI. Review the generated code for:

1. Code quality and best practices
2. Potential bugs or edge cases
3. Performance considerations
4. Security vulnerabilities
5. Test coverage suggestions

Provide specific, actionable feedback to improve the code.`,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'coordinator-1', target: 'coder-1', animated: true },
        { id: 'e2', source: 'coder-1', target: 'qa-1', animated: true },
      ],
      exampleInput: {
        task: 'Create a user authentication system with JWT tokens, password hashing, and session management for a React + Node.js app'
      }
    },
    {
      name: 'Research & Summary Pipeline',
      description: 'Deep research on any topic with data gathering, analysis, and comprehensive summary generation',
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
            model: 'gpt-4o-mini',
            description: 'Plans research strategy and defines key questions',
            systemPrompt: `You are a Research Coordinator AI. Analyze the research topic and create a comprehensive research plan.

Your output should include:
1. Key research questions to answer
2. Areas to investigate
3. Information priorities
4. Expected outcomes

Create a structured plan that guides thorough research.`,
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
            model: 'gemini-1.5-flash',
            description: 'Conducts deep research and gathers information',
            systemPrompt: `You are a Data Researcher AI. Based on the research plan, gather comprehensive information.

Focus on:
- Current trends and developments
- Historical context and evolution
- Key statistics and data points
- Expert opinions and analysis
- Practical applications and use cases

Provide detailed, well-organized research findings.`,
          },
        },
        {
          id: 'analyst-1',
          type: 'agent',
          position: { x: 700, y: 150 },
          data: {
            label: 'Insight Synthesizer',
            role: 'Analyst',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            description: 'Synthesizes research into actionable insights',
            systemPrompt: `You are an Insight Synthesizer AI. Analyze the research findings and create a comprehensive summary.

Your summary should include:
1. Executive summary (2-3 paragraphs)
2. Key findings and insights
3. Trends and patterns identified
4. Practical implications
5. Recommendations or next steps

Make it clear, actionable, and valuable for decision-making.`,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'coordinator-1', target: 'researcher-1', animated: true },
        { id: 'e2', source: 'researcher-1', target: 'analyst-1', animated: true },
      ],
      exampleInput: {
        topic: 'The impact of AI on software development productivity in 2024-2025'
      }
    },
    {
      name: 'Content Creation Workflow',
      description: 'Create engaging blog posts with research, writing, and SEO optimization',
      category: 'Content',
      nodes: [
        {
          id: 'ideation-1',
          type: 'agent',
          position: { x: 100, y: 150 },
          data: {
            label: 'Content Strategist',
            role: 'Coordinator',
            provider: 'openai',
            model: 'gpt-4o-mini',
            description: 'Creates content outline and strategy',
            systemPrompt: `You are a Content Strategist AI. Create a detailed content outline for the given topic.

Include:
1. Compelling headline options (5 variations)
2. Article structure with sections
3. Key points to cover in each section
4. Target audience considerations
5. Content goals and CTAs

Create an outline that will result in engaging, valuable content.`,
          },
        },
        {
          id: 'writer-1',
          type: 'agent',
          position: { x: 400, y: 100 },
          data: {
            label: 'Content Writer',
            role: 'Coder',
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
            description: 'Writes engaging, high-quality content',
            systemPrompt: `You are a Content Writer AI. Based on the content outline, write a complete, engaging article.

Writing guidelines:
- Use clear, conversational tone
- Include specific examples and data
- Break up text with subheadings
- Use storytelling when appropriate
- Keep paragraphs concise (3-4 sentences)
- Add compelling introduction and conclusion

Write content that is both informative and enjoyable to read.`,
          },
        },
        {
          id: 'seo-1',
          type: 'agent',
          position: { x: 700, y: 150 },
          data: {
            label: 'SEO Optimizer',
            role: 'Analyst',
            provider: 'gemini',
            model: 'gemini-1.5-flash',
            description: 'Optimizes content for search engines',
            systemPrompt: `You are an SEO Optimizer AI. Review the article and provide SEO optimization suggestions.

Focus on:
1. Keyword optimization (primary and secondary keywords)
2. Meta description (155 characters)
3. URL slug suggestion
4. Header tag optimization (H1, H2, H3)
5. Internal/external linking opportunities
6. Content readability improvements

Provide specific, implementable SEO recommendations.`,
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'ideation-1', target: 'writer-1', animated: true },
        { id: 'e2', source: 'writer-1', target: 'seo-1', animated: true },
      ],
      exampleInput: {
        topic: 'How to Build Scalable AI Agent Systems: A Developer\'s Guide',
        keywords: 'AI agents, multi-agent systems, agent orchestration'
      }
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
        systemPrompt: node.data.systemPrompt,
        temperature: 70,
        maxTokens: 1500,
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

    console.log(`Created template: ${templateData.name}`);
  }

  console.log('\n✅ Seeding complete! Created 3 executable workflow templates.');
  console.log('Run these templates by creating a workflow from them and executing with appropriate input.');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
