export type TransactionType = 'payment' | 'subscription';

export type TransactionStatus =
  | 'failed'
  | 'authorized'
  | 'captured'
  | 'recovered'
  | 'pending'
  | 'escalated'
  | 'closed';

export type TransactionSource = 'webhook' | 'batch' | 'sync';

export type RootCause =
  | 'temporary_bank_issue'
  | 'insufficient_funds'
  | 'mandate_expired'
  | 'network_timeout'
  | 'suspected_abandonment'
  | 'repeated_failure'
  | 'unknown';

export type RecoveryAction =
  | 'retry'
  | 'send_reminder'
  | 'offer_discount'
  | 'escalate_human'
  | 'do_nothing';

export type ExecutionMode = 'REAL_TEST_MODE' | 'DEMO_SIMULATED';

export type PolicyResult = 'PASS' | 'BLOCK';

export interface NormalizedTransaction {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  failureReasonCode: string | null;
  failureDescription: string | null;
  timestamp: Date;
  retryCount: number;
  type: TransactionType;
  status: TransactionStatus;
  source: TransactionSource;
  razorpayPaymentId?: string | null;
  razorpayOrderId?: string | null;
  razorpaySubscriptionId?: string | null;
  isDemoAnchor?: boolean;
  demoScenario?: string | null;
  customerOptedOut?: boolean;
  metadata?: Record<string, unknown>;
}

export interface CustomerProfile {
  customerId: string;
  lifetimeValue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  successRate: number;
  averageTransactionValue: number;
  preferredPaymentMethod: string;
  previousRetryCount: number;
}

export const DEMO_SCENARIO_IDS = {
  SUCCESSFUL_RECOVERY: 'txn_demo_s1_retry_success',
  DO_NOTHING: 'txn_demo_s2_do_nothing',
  POLICY_BLOCK: 'txn_demo_s3_policy_block',
  GRACEFUL_FAILURE: 'txn_demo_s4_graceful_failure',
} as const;
