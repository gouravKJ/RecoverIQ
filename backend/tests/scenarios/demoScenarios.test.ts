import { describe, it, expect } from 'vitest';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';
import { DemoExecutor } from '../../src/execution/DemoExecutor';

describe('Demo Scenarios', () => {
  const executor = new DemoExecutor();

  it('Scenario 1: successful recovery on retry', async () => {
    const result = await executor.execute({
      transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY,
      action: 'retry',
      params: {},
      idempotencyKey: 's1:retry:1',
      attemptNumber: 1,
      amount: 749900,
    });
    expect(result.status).toBe('success');
    expect(result.executionMode).toBe('DEMO_SIMULATED');
  });

  it('Scenario 4: graceful execution failure', async () => {
    const result = await executor.execute({
      transactionId: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE,
      action: 'retry',
      params: {},
      idempotencyKey: 's4:retry:1',
      attemptNumber: 1,
      amount: 600000,
    });
    expect(result.status).toBe('failed');
    expect(result.error?.code).toBe('SIMULATED_EXECUTION_FAILURE');
  });
});
