import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import type { Agent, KnowledgeEntry } from '@shared/schema';
import { fallbackManager } from './providers/fallback-manager';

interface ExecutionContext {
  agentId: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
  knowledgeContext?: KnowledgeEntry[];
  enableFallback?: boolean;
}

interface ExecutionResult {
  content: string;
  tokenCount: number;
  finishReason: string;
  provider?: string;
  model?: string;
  fallbackUsed?: boolean;
}

export class AIExecutor {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private gemini: GoogleGenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  }

  async executeAgent(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const enableFallback = context.enableFallback !== false; // Default to true
    
    if (!enableFallback) {
      // Execute without fallback
      return await this.executeSingleProvider(agent, context);
    }

    // Execute with fallback logic
    const fallbackConfig = fallbackManager.getDefaultFallbackConfig(agent);
    const failedProviders = new Set<string>();
    let lastError: any = null;

    // Try primary provider
    try {
      const result = await this.executeSingleProvider(agent, context);
      fallbackManager.recordSuccess(agent.provider);
      return {
        ...result,
        provider: agent.provider,
        model: agent.model,
        fallbackUsed: false,
      };
    } catch (error: any) {
      lastError = error;
      failedProviders.add(agent.provider);
      fallbackManager.recordFailure(agent.provider, error.message);

      // Check if we should fallback
      if (!fallbackManager.shouldFallback(error, fallbackConfig)) {
        throw error;
      }

      console.log(`[Executor] Primary provider ${agent.provider} failed, attempting fallback...`);
    }

    // Try fallback providers
    while (failedProviders.size < fallbackConfig.fallbackOrder.length + 1) {
      const nextProvider = fallbackManager.getNextProvider(fallbackConfig, failedProviders);
      
      if (!nextProvider) {
        break; // No more providers to try
      }

      try {
        // Create a temporary agent with the fallback provider
        const fallbackAgent = {
          ...agent,
          provider: nextProvider,
          model: fallbackManager.getModelForProvider(nextProvider, agent.model),
        };

        console.log(`[Executor] Trying fallback provider: ${nextProvider} with model ${fallbackAgent.model}`);
        
        const result = await this.executeSingleProvider(fallbackAgent, context);
        
        // Success! Log the fallback event
        fallbackManager.recordSuccess(nextProvider);
        fallbackManager.logFallbackEvent(agent.provider, nextProvider, lastError?.message || "Unknown error", true);
        
        return {
          ...result,
          provider: nextProvider,
          model: fallbackAgent.model,
          fallbackUsed: true,
        };
      } catch (error: any) {
        lastError = error;
        failedProviders.add(nextProvider);
        fallbackManager.recordFailure(nextProvider, error.message);
        fallbackManager.logFallbackEvent(agent.provider, nextProvider, error.message, false);
        console.log(`[Executor] Fallback provider ${nextProvider} also failed:`, error.message);
      }
    }

    // All providers failed
    throw new Error(
      `All providers failed. Last error: ${lastError?.message || "Unknown error"}. Tried providers: ${Array.from(failedProviders).join(", ")}`
    );
  }

  private async executeSingleProvider(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const provider = agent.provider.toLowerCase();
    
    try {
      switch (provider) {
        case 'openai':
          return await this.executeOpenAI(agent, context);
        case 'anthropic':
          return await this.executeAnthropic(agent, context);
        case 'gemini':
          return await this.executeGemini(agent, context);
        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error: any) {
      // Map provider-specific errors to standardized format
      const errorMessage = this.mapProviderError(error, provider);
      throw new Error(`[${provider.toUpperCase()}] ${errorMessage}`);
    }
  }

  private formatKnowledgeContext(knowledge: KnowledgeEntry[]): string {
    if (!knowledge || knowledge.length === 0) return '';

    const knowledgeText = knowledge
      .map((entry, idx) => {
        const context = entry.context ? ` (${entry.context})` : '';
        return `${idx + 1}. [${entry.category}] ${entry.content}${context}`;
      })
      .join('\n');

    return `\n\n--- Accumulated Knowledge Base ---\nThe following knowledge has been accumulated from previous executions. Use this to inform your responses:\n\n${knowledgeText}\n\n--- End Knowledge Base ---\n`;
  }

  private buildSystemPromptWithKnowledge(basePrompt: string | undefined, knowledge: KnowledgeEntry[]): string {
    const knowledgeContext = this.formatKnowledgeContext(knowledge);
    const systemPrompt = basePrompt || 'You are a helpful AI agent in a workflow orchestration system.';
    
    if (knowledgeContext) {
      return systemPrompt + knowledgeContext;
    }
    
    return systemPrompt;
  }

  private mapProviderError(error: any, provider: string): string {
    if (error.code === 'insufficient_quota') {
      return 'API quota exceeded. Please check your billing settings.';
    }
    if (error.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'Authentication failed. Please check your API key.';
    }
    if (error.code === 'model_not_found') {
      const model = error.model || 'unknown';
      return `Model '${model}' not found or not accessible. Your API key may not have access to this model.`;
    }
    return error.message || 'Unknown error occurred during AI execution';
  }

  private async executeOpenAI(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    const enhancedSystemPrompt = this.buildSystemPromptWithKnowledge(
      agent.systemPrompt,
      context.knowledgeContext || []
    );
    
    messages.push({ role: 'system', content: enhancedSystemPrompt });

    messages.push(...context.messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })));

    // Ensure model is defined and use fallback model
    const modelToUse = agent.model || 'gpt-3.5-turbo';

    const response = await this.openai.chat.completions.create({
      model: modelToUse,
      messages,
      temperature: context.temperature / 100,
      max_tokens: context.maxTokens,
    });

    const choice = response.choices[0];
    
    return {
      content: choice.message.content || '',
      tokenCount: response.usage?.total_tokens || 0,
      finishReason: choice.finish_reason,
    };
  }

  private async executeAnthropic(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = context.messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    const enhancedSystemPrompt = this.buildSystemPromptWithKnowledge(
      agent.systemPrompt,
      context.knowledgeContext || []
    );

    // Ensure model is defined
    const modelToUse = agent.model || 'claude-3-5-sonnet-20241022';

    const response = await this.anthropic.messages.create({
      model: modelToUse,
      max_tokens: context.maxTokens,
      temperature: context.temperature / 100,
      system: enhancedSystemPrompt,
      messages,
    });

    const content = response.content[0];
    const tokenCount = response.usage.input_tokens + response.usage.output_tokens;

    return {
      content: content.type === 'text' ? content.text : '',
      tokenCount,
      finishReason: response.stop_reason || 'end_turn',
    };
  }

  private async executeGemini(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const enhancedSystemPrompt = this.buildSystemPromptWithKnowledge(
      agent.systemPrompt,
      context.knowledgeContext || []
    );

    // Ensure model is defined
    const modelToUse = agent.model || 'gemini-1.5-flash';

    const model = this.gemini.getGenerativeModel({ 
      model: modelToUse,
      systemInstruction: enhancedSystemPrompt,
    });

    const chat = model.startChat({
      history: context.messages.slice(0, -1).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: context.temperature / 100,
        maxOutputTokens: context.maxTokens,
      },
    });

    const lastMessage = context.messages[context.messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      tokenCount: 0, // Gemini doesn't provide token counts in the same way
      finishReason: 'stop',
    };
  }
}

export const aiExecutor = new AIExecutor();
