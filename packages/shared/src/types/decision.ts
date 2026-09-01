import type { RecoveryAction, RootCause } from './transaction';

export interface DiagnosisResult {
  cause: RootCause;
  confidence: number;
  signals: string[];
  explanation: string;
  label: 'Rule-Based Root Cause Classification';
}

export interface CandidateActionEV {
  action: RecoveryAction;
  recoveryProbability: number;
  recoverableAmount: number;
  interventionCost: number;
  frictionCost: number;
  expectedValue: number;
  discountPct?: number;
}

export interface RecoveryDecisionResult {
  selectedAction: RecoveryAction;
  selectedEv: number;
  recoverableAmount: number;
  reasoningText: string;
  candidates: CandidateActionEV[];
  label: 'Rule-Based Recovery Probability (Heuristic)';
}

export interface PolicyCheckResult {
  result: 'PASS' | 'BLOCK';
  blockReason?: string;
  checkedRules: string[];
  requestedAction: RecoveryAction;
  requestedParams: Record<string, unknown>;
}

export interface ExecutionRequest {
  transactionId: string;
  action: RecoveryAction;
  params: Record<string, unknown>;
  idempotencyKey: string;
  attemptNumber: number;
  amount: number;
  razorpayPaymentId?: string | null;
  paymentStatus?: string;
}

export interface ExecutionResult {
  status: 'success' | 'failed' | 'skipped';
  executionMode: 'REAL_TEST_MODE' | 'DEMO_SIMULATED';
  executorType: 'razorpay' | 'demo';
  razorpayReference?: string;
  error?: { code: string; message: string };
}
