import { describe, it, expect } from 'vitest';
import { PolicyGate } from '../../src/policy/PolicyGate';
import type { Transaction } from '@prisma/client';

describe('PolicyGate', () => {
  const gate = new PolicyGate();

  const baseTxn = {
    id: 'txn_test',
    retryCount: 0,
    reminderCount: 0,
    lastReminderAt: null,
    amount: BigInt(800000),
  } as Transaction;

  it('blocks discount exceeding maximum', async () => {
    const result = await gate.evaluate('offer_discount', { discountPct: 10 }, baseTxn, false);
    expect(result.result).toBe('BLOCK');
    expect(result.blockReason).toContain('5%');
  });

  it('passes discount within maximum', async () => {
    const result = await gate.evaluate('offer_discount', { discountPct: 3 }, baseTxn, false);
    expect(result.result).toBe('PASS');
  });

  it('blocks retry when limit reached', async () => {
    const txn = { ...baseTxn, retryCount: 2 } as Transaction;
    const result = await gate.evaluate('retry', {}, txn, false);
    expect(result.result).toBe('BLOCK');
  });

  it('passes do_nothing always', async () => {
    const result = await gate.evaluate('do_nothing', {}, baseTxn, false);
    expect(result.result).toBe('PASS');
  });
});
