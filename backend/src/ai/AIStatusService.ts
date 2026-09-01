import { env } from '../config/env';
import type { AIStatusResponse } from './types';

export class AIStatusService {
  getStatus(): AIStatusResponse {
    const hasKey = Boolean(env.GROQ_API_KEY && env.GROQ_API_KEY.trim().length > 0);
    const enabled = Boolean(env.LLM_ENABLED && hasKey);

    return {
      enabled,
      provider: 'Groq',
      model: env.GROQ_MODEL || 'openai/gpt-oss-20b',
      mode: enabled ? 'LLM' : 'DETERMINISTIC_FALLBACK',
    };
  }
}

export const aiStatusService = new AIStatusService();
