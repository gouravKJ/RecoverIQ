import type { ExecutionRequest, ExecutionResult } from '@recoveriq/shared';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';
import type { RecoveryExecutor } from './RecoveryExecutor';
import { env } from '../config/env';

export class DemoExecutor implements RecoveryExecutor {
  async execute(input: ExecutionRequest): Promise<ExecutionResult> {
    if (input.transactionId === DEMO_SCENARIO_IDS.GRACEFUL_FAILURE) {
      return {
        status: 'failed',
        executionMode: 'DEMO_SIMULATED',
        executorType: 'demo',
        error: {
          code: 'SIMULATED_EXECUTION_FAILURE',
          message: 'Simulated Razorpay/API execution failure for demo scenario',
        },
      };
    }

    if (
      env.DEMO_FORCE_SCENARIO_OUTCOMES &&
      input.transactionId === DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY &&
      input.action === 'retry'
    ) {
      return {
        status: 'success',
        executionMode: 'DEMO_SIMULATED',
        executorType: 'demo',
        razorpayReference: `demo_retry_${input.transactionId}`,
      };
    }

    if (input.action === 'do_nothing') {
      return {
        status: 'skipped',
        executionMode: 'DEMO_SIMULATED',
        executorType: 'demo',
      };
    }

    if (input.action === 'escalate_human') {
      return {
        status: 'success',
        executionMode: 'DEMO_SIMULATED',
        executorType: 'demo',
        razorpayReference: `demo_escalation_${input.transactionId}`,
      };
    }

    if (['retry', 'send_reminder', 'offer_discount'].includes(input.action)) {
      const successRate = input.action === 'send_reminder' ? 0.4 : 0.55;
      const success = Math.random() < successRate;
      return {
        status: success ? 'success' : 'failed',
        executionMode: 'DEMO_SIMULATED',
        executorType: 'demo',
        razorpayReference: success ? `demo_${input.action}_${input.transactionId}` : undefined,
        error: success
          ? undefined
          : { code: 'SIMULATED_FAILURE', message: `Simulated ${input.action} did not recover payment` },
      };
    }

    return {
      status: 'skipped',
      executionMode: 'DEMO_SIMULATED',
      executorType: 'demo',
    };
  }

  async verify(): Promise<{ status: string; captured: boolean }> {
    return { status: 'demo', captured: false };
  }
}
