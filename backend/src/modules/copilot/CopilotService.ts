import { copilotOrchestrator } from './CopilotOrchestrator';
import type { CopilotChatRequest, CopilotChatResponse } from './types';

export class CopilotService {
  async handleChat(request: CopilotChatRequest): Promise<CopilotChatResponse> {
    return copilotOrchestrator.processMessage(request);
  }
}

export const copilotService = new CopilotService();
