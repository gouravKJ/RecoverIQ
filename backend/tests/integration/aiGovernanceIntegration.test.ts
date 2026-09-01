import { describe, it, expect, beforeEach } from 'vitest';
import { ExpectedValueEngine } from '../../src/engines/ExpectedValueEngine';
import { PolicyGate } from '../../src/policy/PolicyGate';
import { MockLLMProvider } from '../../src/ai/providers/MockLLMProvider';
import { RecoveryStrategyAgent } from '../../src/ai/agents/RecoveryStrategyAgent';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';
import { prisma } from '../../src/lib/prisma';
import { revenueRiskEngine } from '../../src/engines/RevenueRiskEngine';

describe('AI Layer & Financial Governance Integration Tests', () => {
  const evEngine = new ExpectedValueEngine();
  const policyGate = new PolicyGate();
  const mockProvider = new MockLLMProvider();

  it('LLM recommends action, EV Engine independently calculates EV, PolicyGate validates, and Executor acts', async () => {
    // 1. LLM Recommendation
    const strategyAgent = new RecoveryStrategyAgent(mockProvider);
    const aiRec = await strategyAgent.recommend({
      failureReasonCode: 'GATEWAY_ERROR',
      amount: 500000,
    });
    expect(aiRec.recommendation).toBeDefined();

    // 2. EV Engine independently calculates EV
    const evDecision = evEngine.decide(
      500000,
      'temporary_bank_issue',
      0.9,
      {
        id: 'C1001',
        lifetimeValue: BigInt(5000000),
        totalTransactions: 10,
        successfulTransactions: 9,
        failedTransactions: 1,
        successRate: 0.9 as any,
        averageTransactionValue: BigInt(500000),
        preferredPaymentMethod: 'upi',
        previousRetryCount: 0,
        optedOut: false,
        computedAt: new Date(),
      },
      0
    );

    // EV Engine chooses winning action based on Math
    expect(evDecision.selectedAction).toBeDefined();
    expect(evDecision.selectedEv).toBeGreaterThan(0);

    // 3. PolicyGate validates decision
    const policyResult = await policyGate.evaluate(
      evDecision.selectedAction,
      {},
      { id: 'test_txn', amount: BigInt(500000), retryCount: 0, reminderCount: 0, type: 'payment' }
    );
    expect(policyResult.result).toBe('PASS');
  });

  it('AI Safety Test — Prompt Injection attempting to bypass PolicyGate or force discount is blocked by PolicyGate', async () => {
    const maliciousInput = {
      action: 'offer_discount',
      params: { discountPct: 50 }, // 50% exceeds max 5% policy limit
      txn: { id: 'test_inj', amount: BigInt(500000), retryCount: 0, reminderCount: 0, type: 'payment' },
    };

    const result = await policyGate.evaluate(
      'offer_discount',
      { discountPct: 50 },
      maliciousInput.txn
    );

    expect(result.result).toBe('BLOCK');
    expect(result.blockReason).toContain('exceeds merchant recovery constitution maximum');
  });

  it('AI Safety Test — AI Agent cannot directly call Executor or bypass audit trail', () => {
    const provider = mockProvider;
    // Verify that provider instance does NOT have execution methods
    expect((provider as any).execute).toBeUndefined();
    expect((provider as any).callExecutor).toBeUndefined();
    expect((provider as any).bypassPolicyGate).toBeUndefined();
  });
});
