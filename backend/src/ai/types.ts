export type AnalysisType =
  | 'FAILURE_ANALYSIS'
  | 'CUSTOMER_INTELLIGENCE'
  | 'RECOVERY_RECOMMENDATION'
  | 'PATTERN_DETECTION'
  | 'DECISION_EXPLANATION';

export interface AIStatusResponse {
  enabled: boolean;
  provider: string;
  model: string;
  mode: 'LLM' | 'DETERMINISTIC_FALLBACK';
}

export interface FailureAnalysisResult {
  primaryCause: string;
  confidence: number;
  signals: string[];
  explanation: string;
  recommendedRecoveryContext: string;
}

export interface CustomerIntelligenceResult {
  customerSegment: string;
  behaviorSummary: string;
  recoveryContext: string;
  riskSignals: string[];
  confidence: number;
}

export interface RecoveryStrategyResult {
  recommendation: 'retry' | 'send_reminder' | 'offer_discount' | 'escalate_human' | 'do_nothing';
  reasoning: string;
  supportingSignals: string[];
  confidence: number;
}

export interface PatternItem {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  supportingMetrics: string[];
}

export interface PatternDetectionResult {
  patterns: PatternItem[];
}

export interface DecisionExplanationResult {
  summary: string;
  whySelected: string;
  whyAlternativesWereRejected: string[];
  policyExplanation: string;
  riskExplanation: string;
}

export interface TransactionAIAnalysisResponse {
  transactionId: string;
  aiMode: 'LLM' | 'DETERMINISTIC_FALLBACK';
  provider: string;
  model: string;
  failureAnalysis?: FailureAnalysisResult;
  customerIntelligence?: CustomerIntelligenceResult;
  recoveryRecommendation?: RecoveryStrategyResult;
  decisionExplanation?: DecisionExplanationResult;
}
