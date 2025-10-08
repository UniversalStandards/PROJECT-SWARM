import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import type { Agent } from '@shared/schema';

interface ExecutionContext {
  agentId: string;
  messages: Array<{ role: string; content: string }>;
  temperature: number;
  maxTokens: number;
}

interface ExecutionResult {
  content: string;
  tokenCount: number;
  finishReason: string;
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
      return `Model ${error.model} not found or not accessible.`;
    }
    return error.message || 'Unknown error occurred during AI execution';
  }

  private async executeOpenAI(agent: Agent, context: ExecutionContext): Promise<ExecutionResult> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    if (agent.systemPrompt) {
      messages.push({ role: 'system', content: agent.systemPrompt });
    }

    messages.push(...context.messages.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content,
    })));

    const response = await this.openai.chat.completions.create({
      model: agent.model,
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

    const response = await this.anthropic.messages.create({
      model: agent.model,
      max_tokens: context.maxTokens,
      temperature: context.temperature / 100,
      system: agent.systemPrompt || undefined,
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
    const model = this.gemini.getGenerativeModel({ 
      model: agent.model,
      systemInstruction: agent.systemPrompt || undefined,
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
