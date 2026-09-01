import type { LLMProvider } from '../providers/LLMProvider';
import { DECISION_EXPLANATION_PROMPT } from '../prompts/aiPrompts';
import { decisionExplanationSchema } from '../schemas/aiSchemas';
import type { DecisionExplanationResult } from '../types';

export class DecisionExplanationAgent {
  constructor(private provider: LLMProvider) {}

  async explain(context: Record<string, unknown>): Promise<DecisionExplanationResult> {
    const userPrompt = DECISION_EXPLANATION_PROMPT.replace(
      '{{{contextJson}}}',
      JSON.stringify(context, null, 2)
    );

    return this.provider.generateStructured<DecisionExplanationResult>(
      'You are a recovery decision explanation agent.',
      userPrompt,
      decisionExplanationSchema
    );
  }
}
