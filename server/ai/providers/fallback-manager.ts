import type { Agent } from "@shared/schema";

interface FallbackConfig {
  primaryProvider: string;
  fallbackOrder: string[];
  fallbackConditions: {
    onError: boolean;
    onRateLimit: boolean;
    onTimeout: boolean;
    onHighLatency: boolean;
    latencyThreshold?: number; // milliseconds
  };
}

interface ProviderHealth {
  provider: string;
  failureCount: number;
  lastFailure?: Date;
  consecutiveFailures: number;
  isCircuitOpen: boolean; // Circuit breaker state
}

interface FallbackEvent {
  timestamp: Date;
  fromProvider: string;
  toProvider: string;
  reason: string;
  success: boolean;
}

export class FallbackManager {
  private providerHealth: Map<string, ProviderHealth> = new Map();
  private fallbackEvents: FallbackEvent[] = [];
  private readonly CIRCUIT_BREAKER_THRESHOLD = 5; // failures before opening circuit
  private readonly CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute

  /**
   * Get default fallback configuration for an agent
   */
  getDefaultFallbackConfig(agent: Agent): FallbackConfig {
    const config: FallbackConfig = {
      primaryProvider: agent.provider,
      fallbackOrder: [],
      fallbackConditions: {
        onError: true,
        onRateLimit: true,
        onTimeout: true,
        onHighLatency: false,
        latencyThreshold: 5000,
      },
    };

    // Set fallback order based on primary provider
    if (agent.provider === "openai") {
      config.fallbackOrder = ["anthropic", "gemini"];
    } else if (agent.provider === "anthropic") {
      config.fallbackOrder = ["openai", "gemini"];
    } else if (agent.provider === "gemini") {
      config.fallbackOrder = ["openai", "anthropic"];
    }

    return config;
  }

  /**
   * Determine if fallback should occur based on error
   */
  shouldFallback(error: any, config: FallbackConfig): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || "";
    const statusCode = error.status || error.statusCode;

    // Check rate limit
    if (config.fallbackConditions.onRateLimit && statusCode === 429) {
      return true;
    }

    // Check timeout
    if (config.fallbackConditions.onTimeout && errorMessage.includes("timeout")) {
      return true;
    }

    // Check general errors
    if (config.fallbackConditions.onError) {
      // 4xx and 5xx errors
      if (statusCode >= 400) {
        return true;
      }
      
      // Network errors
      if (errorMessage.includes("network") || errorMessage.includes("connection")) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get next available provider from fallback order
   */
  getNextProvider(config: FallbackConfig, failedProviders: Set<string>): string | null {
    for (const provider of config.fallbackOrder) {
      // Skip if already failed
      if (failedProviders.has(provider)) {
        continue;
      }

      // Check circuit breaker
      const health = this.getProviderHealth(provider);
      if (health.isCircuitOpen) {
        // Check if circuit breaker timeout has passed
        if (
          health.lastFailure &&
          Date.now() - health.lastFailure.getTime() > this.CIRCUIT_BREAKER_TIMEOUT
        ) {
          // Reset circuit breaker
          this.resetCircuitBreaker(provider);
        } else {
          continue; // Circuit still open
        }
      }

      return provider;
    }

    return null;
  }

  /**
   * Get model mapping for fallback provider
   */
  getModelForProvider(provider: string, originalModel: string): string {
    // Map models to equivalent models in other providers
    const modelMappings: Record<string, Record<string, string>> = {
      openai: {
        "claude-3-5-sonnet-20241022": "gpt-4-turbo",
        "claude-3-opus-20240229": "gpt-4",
        "gemini-1.5-flash": "gpt-3.5-turbo",
        "gemini-1.5-pro": "gpt-4-turbo",
      },
      anthropic: {
        "gpt-4": "claude-3-opus-20240229",
        "gpt-4-turbo": "claude-3-5-sonnet-20241022",
        "gpt-3.5-turbo": "claude-3-haiku-20240307",
        "gemini-1.5-flash": "claude-3-haiku-20240307",
        "gemini-1.5-pro": "claude-3-5-sonnet-20241022",
      },
      gemini: {
        "gpt-4": "gemini-1.5-pro",
        "gpt-4-turbo": "gemini-1.5-pro",
        "gpt-3.5-turbo": "gemini-1.5-flash",
        "claude-3-5-sonnet-20241022": "gemini-1.5-pro",
        "claude-3-opus-20240229": "gemini-1.5-pro",
        "claude-3-haiku-20240307": "gemini-1.5-flash",
      },
    };

    return modelMappings[provider]?.[originalModel] || this.getDefaultModelForProvider(provider);
  }

  /**
   * Get default model for a provider
   */
  private getDefaultModelForProvider(provider: string): string {
    const defaults: Record<string, string> = {
      openai: "gpt-4-turbo",
      anthropic: "claude-3-5-sonnet-20241022",
      gemini: "gemini-1.5-flash",
    };

    return defaults[provider] || "gpt-4-turbo";
  }

  /**
   * Record provider failure
   */
  recordFailure(provider: string, reason: string): void {
    const health = this.getProviderHealth(provider);
    
    health.failureCount++;
    health.consecutiveFailures++;
    health.lastFailure = new Date();

    // Open circuit breaker if threshold exceeded
    if (health.consecutiveFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      health.isCircuitOpen = true;
      console.warn(
        `[Fallback] Circuit breaker opened for ${provider} after ${health.consecutiveFailures} consecutive failures`
      );
    }

    this.providerHealth.set(provider, health);
  }

  /**
   * Record successful provider execution
   */
  recordSuccess(provider: string): void {
    const health = this.getProviderHealth(provider);
    
    // Reset consecutive failures on success
    health.consecutiveFailures = 0;
    
    // Close circuit breaker if it was open
    if (health.isCircuitOpen) {
      health.isCircuitOpen = false;
      console.log(`[Fallback] Circuit breaker closed for ${provider}`);
    }

    this.providerHealth.set(provider, health);
  }

  /**
   * Get provider health status
   */
  private getProviderHealth(provider: string): ProviderHealth {
    if (!this.providerHealth.has(provider)) {
      this.providerHealth.set(provider, {
        provider,
        failureCount: 0,
        consecutiveFailures: 0,
        isCircuitOpen: false,
      });
    }

    return this.providerHealth.get(provider)!;
  }

  /**
   * Reset circuit breaker for a provider
   */
  private resetCircuitBreaker(provider: string): void {
    const health = this.getProviderHealth(provider);
    health.isCircuitOpen = false;
    health.consecutiveFailures = 0;
    this.providerHealth.set(provider, health);
    console.log(`[Fallback] Circuit breaker reset for ${provider}`);
  }

  /**
   * Log fallback event
   */
  logFallbackEvent(
    fromProvider: string,
    toProvider: string,
    reason: string,
    success: boolean
  ): void {
    const event: FallbackEvent = {
      timestamp: new Date(),
      fromProvider,
      toProvider,
      reason,
      success,
    };

    this.fallbackEvents.unshift(event);

    // Keep only last 100 events
    if (this.fallbackEvents.length > 100) {
      this.fallbackEvents.splice(100);
    }

    console.log(
      `[Fallback] ${fromProvider} → ${toProvider} (${reason}) - ${success ? "Success" : "Failed"}`
    );
  }

  /**
   * Get fallback event history
   */
  getFallbackHistory(limit: number = 50): FallbackEvent[] {
    return this.fallbackEvents.slice(0, limit);
  }

  /**
   * Get provider health dashboard data
   */
  getProviderHealthDashboard(): {
    providers: Array<{
      name: string;
      health: ProviderHealth;
      successRate: number;
      avgLatency: number;
    }>;
  } {
    const providers = Array.from(this.providerHealth.entries()).map(([name, health]) => {
      // Calculate success rate from recent fallback events
      const recentEvents = this.fallbackEvents
        .filter(e => e.toProvider === name)
        .slice(0, 20);
      
      const successCount = recentEvents.filter(e => e.success).length;
      const successRate = recentEvents.length > 0
        ? Math.round((successCount / recentEvents.length) * 100)
        : 100;

      return {
        name,
        health,
        successRate,
        avgLatency: 0, // Would need to track latencies to calculate
      };
    });

    return { providers };
  }

  /**
   * Smart routing: select best provider based on requirements
   */
  selectBestProvider(
    availableProviders: string[],
    requirements?: {
      preferCheapest?: boolean;
      preferFastest?: boolean;
      requireCapability?: string[];
    }
  ): string {
    // Filter out providers with open circuit breakers
    const healthyProviders = availableProviders.filter(provider => {
      const health = this.getProviderHealth(provider);
      return !health.isCircuitOpen;
    });

    if (healthyProviders.length === 0) {
      // All providers unhealthy, return first available
      return availableProviders[0];
    }

    // If preferring cheapest, return in cost order
    if (requirements?.preferCheapest) {
      const costOrder = ["gemini", "openai", "anthropic"];
      for (const provider of costOrder) {
        if (healthyProviders.includes(provider)) {
          return provider;
        }
      }
    }

    // If preferring fastest, return based on typical latency
    if (requirements?.preferFastest) {
      const speedOrder = ["gemini", "anthropic", "openai"];
      for (const provider of speedOrder) {
        if (healthyProviders.includes(provider)) {
          return provider;
        }
      }
    }

    // Default: return provider with lowest failure count
    const sortedByHealth = healthyProviders.sort((a, b) => {
      const healthA = this.getProviderHealth(a);
      const healthB = this.getProviderHealth(b);
      return healthA.failureCount - healthB.failureCount;
    });

    return sortedByHealth[0];
  }
}

export const fallbackManager = new FallbackManager();
