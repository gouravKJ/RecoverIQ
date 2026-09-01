import { describe, it, expect } from 'vitest';
import { DashboardAggregator } from '../../src/dashboard/DashboardAggregator';

describe('DashboardAggregator', () => {
  it('returns summary shape with numeric fields', async () => {
    const agg = new DashboardAggregator();
    const summary = await agg.getSummary();
    expect(summary).toHaveProperty('totalTransactionsProcessed');
    expect(summary).toHaveProperty('revenueAtRisk');
    expect(summary).toHaveProperty('recoveryRate');
    expect(typeof summary.recoveryRate).toBe('number');
  });
});
