import { describe, it, expect } from 'vitest';
import { ExpectedValueEngine } from '../../src/engines/ExpectedValueEngine';

describe('ExpectedValueEngine', () => {
  const engine = new ExpectedValueEngine();
  const customer = {
    customerId: 'C2015',
    lifetimeValue: 50000,
    totalTransactions: 5,
    successfulTransactions: 2,
    failedTransactions: 3,
    successRate: 0.4,
    averageTransactionValue: 10000,
    preferredPaymentMethod: 'upi',
    previousRetryCount: 1,
  };

  it('selects do_nothing for low-value transaction with poor signals', () => {
    const result = engine.decide(49900, 'insufficient_funds', 0.93, customer, 1);
    expect(result.selectedAction).toBe('do_nothing');
    expect(result.reasoningText).toContain('DO NOTHING');
  });

  it('selects retry for high-value network timeout', () => {
    const goodCustomer = { ...customer, successRate: 0.88, failedTransactions: 1 };
    const result = engine.decide(749900, 'network_timeout', 0.91, goodCustomer, 0);
    expect(result.selectedAction).toBe('retry');
    expect(result.candidates).toHaveLength(5);
  });

  it('calculates EV for all candidate actions', () => {
    const result = engine.decide(749900, 'network_timeout', 0.91, customer, 0);
    expect(result.candidates.every((c) => typeof c.expectedValue === 'number')).toBe(true);
  });
});
