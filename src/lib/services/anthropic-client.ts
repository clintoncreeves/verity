/**
 * Anthropic API Client for Verity
 * Uses Claude Haiku 4.5 for fast, cost-effective verification
 */

import Anthropic from '@anthropic-ai/sdk';

// Claude Haiku 4.5 - optimized for speed and cost
const MODEL = 'claude-haiku-4-5-20251001';

class AnthropicClient {
  private client: Anthropic | null = null;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  /**
   * Check if the client is configured with a real API key
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Send a message to Claude with retry logic
   */
  async sendMessage(
    systemPrompt: string,
    userMessage: string,
    options: {
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    if (!this.client) {
      throw new Error('ANTHROPIC_API_KEY is not configured. Please add it to your environment variables.');
    }

    const { temperature = 0.3, maxTokens = 2048 } = options;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.client.messages.create({
          model: MODEL,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [{ role: 'user', content: userMessage }],
        });

        const content = response.content[0];
        if (content.type === 'text') {
          return content.text;
        }

        throw new Error('Unexpected response type from Claude');
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries - 1;

        if (error instanceof Anthropic.APIError) {
          // Don't retry on client errors (4xx except rate limits)
          if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
            throw new Error(`Claude API error: ${error.message}`);
          }

          // Retry on server errors (5xx) or rate limits (429)
          if (!isLastAttempt) {
            const delay = this.baseDelay * Math.pow(2, attempt);
            console.log(`[Verity] Retrying Claude request in ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
            await this.sleep(delay);
            continue;
          }
        }

        if (isLastAttempt) {
          throw new Error(`Claude request failed after ${this.maxRetries} attempts: ${error}`);
        }
      }
    }

    throw new Error('Unexpected retry loop exit');
  }

  /**
   * Send message and parse JSON response
   */
  async sendMessageJSON<T>(
    systemPrompt: string,
    userMessage: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T> {
    const response = await this.sendMessage(systemPrompt, userMessage, options);

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      return JSON.parse(jsonStr.trim()) as T;
    } catch (error) {
      throw new Error(`Failed to parse Claude JSON response: ${error}\nResponse: ${response.substring(0, 500)}`);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const anthropicClient = new AnthropicClient();
