import Razorpay from 'razorpay';
import type { ExecutionRequest, ExecutionResult } from '@recoveriq/shared';
import type { RecoveryExecutor } from './RecoveryExecutor';
import { env } from '../config/env';

export class RazorpayExecutor implements RecoveryExecutor {
  private client: Razorpay | null = null;

  private getClient(): Razorpay | null {
    if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) return null;
    if (!this.client) {
      this.client = new Razorpay({
        key_id: env.RAZORPAY_KEY_ID,
        key_secret: env.RAZORPAY_KEY_SECRET,
      });
    }
    return this.client;
  }

  async execute(input: ExecutionRequest): Promise<ExecutionResult> {
    const client = this.getClient();
    if (!client) {
      return {
        status: 'failed',
        executionMode: 'REAL_TEST_MODE',
        executorType: 'razorpay',
        error: { code: 'NO_CREDENTIALS', message: 'Razorpay credentials not configured' },
      };
    }

    if (input.action === 'retry' && input.paymentStatus === 'authorized' && input.razorpayPaymentId) {
      try {
        await client.payments.capture(input.razorpayPaymentId, input.amount, 'INR');
        return {
          status: 'success',
          executionMode: 'REAL_TEST_MODE',
          executorType: 'razorpay',
          razorpayReference: input.razorpayPaymentId,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Capture failed';
        return {
          status: 'failed',
          executionMode: 'REAL_TEST_MODE',
          executorType: 'razorpay',
          error: { code: 'CAPTURE_FAILED', message },
        };
      }
    }

    return {
      status: 'skipped',
      executionMode: 'REAL_TEST_MODE',
      executorType: 'razorpay',
      error: {
        code: 'UNSUPPORTED_OPERATION',
        message: 'Razorpay test mode does not support direct retry of failed payments',
      },
    };
  }

  async verify(paymentId: string): Promise<{ status: string; captured: boolean }> {
    const client = this.getClient();
    if (!client) return { status: 'unknown', captured: false };
    try {
      const payment = await client.payments.fetch(paymentId);
      return {
        status: payment.status as string,
        captured: Boolean(payment.captured),
      };
    } catch {
      return { status: 'unknown', captured: false };
    }
  }
}
