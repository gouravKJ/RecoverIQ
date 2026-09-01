import type { LLMProvider } from '../providers/LLMProvider';
import { RECOVERY_STRATEGY_PROMPT } from '../prompts/aiPrompts';
import { recoveryStrategySchema } from '../schemas/aiSchemas';
import type { RecoveryStrategyResult } from '../types';

export class RecoveryStrategyAgent {
  constructor(private provider: LLMProvider) {}

  async recommend(context: Record<string, unknown>): Promise<RecoveryStrategyResult> {
    const userPrompt = RECOVERY_STRATEGY_PROMPT.replace(
      '{{{contextJson}}}',
      JSON.stringify(context, null, 2)
    );

    return this.provider.generateStructured<RecoveryStrategyResult>(
      'You are a recovery strategy recommendation agent.',
      userPrompt,
      recoveryStrategySchema
    );
  }
}
