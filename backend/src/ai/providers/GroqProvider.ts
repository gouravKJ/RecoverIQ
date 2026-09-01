import Groq from 'groq-sdk';
import type { LLMProvider } from './LLMProvider';
import type { ZodSchema } from 'zod';
import { env } from '../../config/env';

export class GroqProvider implements LLMProvider {
  name = 'Groq';
  model: string;
  private client: Groq | null = null;

  constructor(apiKey?: string, model?: string) {
    const key = apiKey !== undefined ? apiKey : env.GROQ_API_KEY;
    this.model = model || env.GROQ_MODEL || 'openai/gpt-oss-20b';

    if (key && key.trim()) {
      this.client = new Groq({ apiKey: key.trim() });
    }
  }

  isAvailable(): boolean {
    return Boolean(env.LLM_ENABLED && this.client);
  }

  async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: unknown
  ): Promise<T> {
    if (!this.client || !env.LLM_ENABLED) {
      throw new Error('GroqProvider is disabled or GROQ_API_KEY is not configured');
    }

    const zodSchema = schema as ZodSchema<T>;
    const timeoutMs = env.LLM_TIMEOUT_MS || 15000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // Groq Chat Completions API with JSON mode
      const completion = await this.client.chat.completions.create(
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
          max_tokens: 1024,
        },
        { signal: controller.signal }
      );

      clearTimeout(timer);

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Groq returned empty response body');
      }

      const json = JSON.parse(content);
      return zodSchema.parse(json);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Groq API request timed out after ${timeoutMs}ms`);
      }
      throw err;
    }
  }
}
