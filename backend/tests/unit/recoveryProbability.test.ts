import { describe, it, expect } from 'vitest';
import { RecoveryProbabilityEngine } from '../../src/engines/RecoveryProbabilityEngine';

describe('RecoveryProbabilityEngine', () => {
  const engine = new RecoveryProbabilityEngine();
  const customer = {
    customerId: 'C1',
    lifetimeValue: 100000,
    totalTransactions: 10,
    successfulTransactions: 8,
    failedTransactions: 2,
    successRate: 0.8,
    averageTransactionValue: 10000,
    preferredPaymentMethod: 'upi',
    previousRetryCount: 0,
  };

  it('returns 0 for do_nothing', () => {
    expect(engine.estimate('do_nothing', 'unknown', 0.5, customer, 50000, 0)).toBe(0);
  });

  it('returns higher retry probability for network timeout', () => {
    const retry = engine.estimate('retry', 'network_timeout', 0.91, customer, 749900, 0);
    const reminder = engine.estimate('send_reminder', 'network_timeout', 0.91, customer, 749900, 0);
    expect(retry).toBeGreaterThan(reminder);
  });

  it('applies retry penalty', () => {
    const p0 = engine.estimate('retry', 'network_timeout', 0.91, customer, 749900, 0);
    const p2 = engine.estimate('retry', 'network_timeout', 0.91, customer, 749900, 2);
    expect(p2).toBeLessThan(p0);
  });

  it('has heuristic label', () => {
    expect(engine.getLabel()).toBe('Rule-Based Recovery Probability (Heuristic)');
  });
});
