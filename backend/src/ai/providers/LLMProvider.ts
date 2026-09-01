export interface LLMProvider {
  name: string;
  model: string;
  isAvailable(): boolean;
  generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: unknown
  ): Promise<T>;
}
