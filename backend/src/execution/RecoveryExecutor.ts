import type { ExecutionRequest, ExecutionResult } from '@recoveriq/shared';

export interface RecoveryExecutor {
  execute(input: ExecutionRequest): Promise<ExecutionResult>;
  verify(paymentId: string): Promise<{ status: string; captured: boolean }>;
}
