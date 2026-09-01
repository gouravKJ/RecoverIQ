export type CopilotIntent =
  | 'REVENUE_RECOVERED'
  | 'REVENUE_AT_RISK'
  | 'TOP_FAILURE_REASON'
  | 'TOP_PAYMENT_METHOD_FAILURE'
  | 'TOP_CUSTOMER_IMPACT'
  | 'RECOVERY_PERFORMANCE'
  | 'RECOVERY_ACTION_PERFORMANCE'
  | 'FAILURE_PATTERNS'
  | 'TRANSACTION_EXPLANATION'
  | 'CUSTOMER_EXPLANATION'
  | 'DECISION_EXPLANATION'
  | 'POLICY_EXPLANATION'
  | 'RECOVERY_SUMMARY'
  | 'BATCH_SUMMARY'
  | 'SYSTEM_STATUS'
  | 'COMPARE_TRANSACTIONS'
  | 'GENERAL_RECOVERIQ_QUESTION'
  | 'UNKNOWN';

export interface SuggestedNavigation {
  label: string;
  url: string;
}

export interface CopilotFact {
  label: string;
  value: string | number;
}

export interface CopilotDataCard {
  transactionId?: string;
  cause?: string;
  aiRecommendation?: string;
  expectedValue?: string | number;
  finalDecision?: string;
  policyResult?: string;
  executionMode?: string;
  recoveredAmount?: string | number;
  metrics?: Record<string, unknown>;
}

export interface CopilotChatRequest {
  message: string;
  conversationId?: string;
  context?: {
    transactionId?: string;
  };
}

export interface CopilotChatResponse {
  message: string;
  intent: CopilotIntent;
  aiMode: 'LLM' | 'DETERMINISTIC_FALLBACK';
  provider: string;
  model: string;
  sources: string[];
  dataSource?: string;
  facts?: CopilotFact[];
  data?: CopilotDataCard;
  suggestedNavigation: SuggestedNavigation[];
}

export interface ChatMessageMemory {
  role: 'user' | 'assistant';
  content: string;
  intent?: CopilotIntent;
  transactionId?: string;
  facts?: CopilotFact[];
  timestamp: string;
}
