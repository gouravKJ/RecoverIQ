import type { ExecutionRequest, ExecutionResult } from '@recoveriq/shared';
import type { RecoveryExecutor } from './RecoveryExecutor';
import { RazorpayExecutor } from './RazorpayExecutor';
import { DemoExecutor } from './DemoExecutor';
import { env } from '../config/env';

export class ExecutorFactory {
  private razorpay = new RazorpayExecutor();
  private demo = new DemoExecutor();

  getExecutor(
    action: string,
    paymentStatus?: string
  ): { executor: RecoveryExecutor; preferredMode: 'REAL_TEST_MODE' | 'DEMO_SIMULATED' } {
    if (env.EXECUTOR_MODE === 'demo') {
      return { executor: this.demo, preferredMode: 'DEMO_SIMULATED' };
    }

    if (
      env.EXECUTOR_MODE === 'razorpay' ||
      (env.EXECUTOR_MODE === 'hybrid' &&
        action === 'retry' &&
        paymentStatus === 'authorized')
    ) {
      return { executor: this.razorpay, preferredMode: 'REAL_TEST_MODE' };
    }

    return { executor: this.demo, preferredMode: 'DEMO_SIMULATED' };
  }

  async execute(input: ExecutionRequest, paymentStatus?: string): Promise<ExecutionResult> {
    const { executor } = this.getExecutor(input.action, paymentStatus);
    return executor.execute(input);
  }
}

export const executorFactory = new ExecutorFactory();
