import type { LLMProvider } from '../providers/LLMProvider';
import { CUSTOMER_INTELLIGENCE_PROMPT } from '../prompts/aiPrompts';
import { customerIntelligenceSchema } from '../schemas/aiSchemas';
import type { CustomerIntelligenceResult } from '../types';

export class CustomerIntelligenceAgent {
  constructor(private provider: LLMProvider) {}

  async analyze(context: Record<string, unknown>): Promise<CustomerIntelligenceResult> {
    const userPrompt = CUSTOMER_INTELLIGENCE_PROMPT.replace(
      '{{{contextJson}}}',
      JSON.stringify(context, null, 2)
    );

    return this.provider.generateStructured<CustomerIntelligenceResult>(
      'You are a customer behavior intelligence agent.',
      userPrompt,
      customerIntelligenceSchema
    );
  }
}
