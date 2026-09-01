import type { LLMProvider } from '../providers/LLMProvider';
import { PATTERN_DETECTION_PROMPT } from '../prompts/aiPrompts';
import { patternDetectionSchema } from '../schemas/aiSchemas';
import type { PatternDetectionResult } from '../types';

export class PatternDetectionAgent {
  constructor(private provider: LLMProvider) {}

  async detectPatterns(context: Record<string, unknown>): Promise<PatternDetectionResult> {
    const userPrompt = PATTERN_DETECTION_PROMPT.replace(
      '{{{contextJson}}}',
      JSON.stringify(context, null, 2)
    );

    return this.provider.generateStructured<PatternDetectionResult>(
      'You are a payment failure pattern detection agent.',
      userPrompt,
      patternDetectionSchema
    );
  }
}
