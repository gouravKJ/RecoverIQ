import type { LLMProvider } from './providers/LLMProvider';
import { GroqProvider } from './providers/GroqProvider';
import { MockLLMProvider } from './providers/MockLLMProvider';
import { aiStatusService } from './AIStatusService';

export class AIService {
  getProvider(): LLMProvider {
    const status = aiStatusService.getStatus();
    if (status.enabled && process.env.NODE_ENV !== 'test') {
      const groq = new GroqProvider();
      if (groq.isAvailable()) {
        return groq;
      }
    }
    return new MockLLMProvider();
  }

  isUsingRealLLM(): boolean {
    return aiStatusService.getStatus().enabled && process.env.NODE_ENV !== 'test';
  }
}

export const aiService = new AIService();
