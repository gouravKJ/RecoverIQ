import type { LLMProvider } from '../providers/LLMProvider';
import { FAILURE_ANALYSIS_PROMPT } from '../prompts/aiPrompts';
import { failureAnalysisSchema } from '../schemas/aiSchemas';
import type { FailureAnalysisResult } from '../types';

export class FailureAnalysisAgent {
  constructor(private provider: LLMProvider) {}

  async analyze(context: Record<string, unknown>): Promise<FailureAnalysisResult> {
    const userPrompt = FAILURE_ANALYSIS_PROMPT.replace(
      '{{{contextJson}}}',
      JSON.stringify(context, null, 2)
    );

    return this.provider.generateStructured<FailureAnalysisResult>(
      'You are a payment failure analysis agent.',
      userPrompt,
      failureAnalysisSchema
    );
  }
}
