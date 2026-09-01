import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';
import { revenueRiskEngine } from '../../src/engines/RevenueRiskEngine';
import { PolicyGate } from '../../src/policy/PolicyGate';

describe('Demo Scenarios — Full Pipeline', () => {
  beforeAll(async () => {
    for (const id of Object.values(DEMO_SCENARIO_IDS)) {
      await prisma.transaction.updateMany({
        where: { id },
        data: { status: 'failed', processed: false },
      });
      const decision = await prisma.recoveryDecision.findUnique({ where: { transactionId: id } });
      if (decision) {
        await prisma.execution.deleteMany({ where: { decisionId: decision.id } });
        await prisma.recoveryDecision.delete({ where: { id: decision.id } });
      }
      await prisma.recoveryOutcome.deleteMany({ where: { transactionId: id } });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('Scenario 1: successful recovery', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
      include: { recoveryOutcome: true, recoveryDecision: { include: { executions: true, policyDecision: true } } },
    });
    expect(txn?.recoveryDecision?.selectedAction).toBe('retry');
    expect(txn?.recoveryDecision?.policyDecision?.result).toBe('PASS');
    expect(txn?.recoveryOutcome?.finalStatus).toBe('recovered');
    expect(txn?.status).toBe('recovered');
  });

  it('Scenario 2: do nothing', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.DO_NOTHING, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.DO_NOTHING },
      include: { recoveryOutcome: true, recoveryDecision: { include: { executions: true } } },
    });
    expect(txn?.recoveryDecision?.selectedAction).toBe('do_nothing');
    expect(txn?.recoveryOutcome?.finalStatus).toBe('do_nothing');
    expect(txn?.recoveryDecision?.executions.length).toBe(0);
  });

  it('Scenario 3: policy block', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.POLICY_BLOCK, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.POLICY_BLOCK },
      include: { recoveryOutcome: true, recoveryDecision: { include: { policyDecision: true, executions: true } } },
    });
    expect(txn?.recoveryDecision?.selectedAction).toBe('offer_discount');
    expect(txn?.recoveryDecision?.policyDecision?.result).toBe('BLOCK');
    expect(txn?.recoveryOutcome?.finalStatus).toBe('blocked');
    expect(txn?.recoveryDecision?.executions.length).toBe(0);
  });

  it('Scenario 4: graceful failure', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.GRACEFUL_FAILURE, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE },
      include: { recoveryOutcome: true, recoveryDecision: { include: { executions: true } } },
    });
    expect(txn?.recoveryDecision?.selectedAction).toBe('retry');
    expect(txn?.recoveryOutcome?.finalStatus).toBe('escalated');
    expect(txn?.recoveryDecision?.executions.length).toBe(2);
    const retryExecs = txn?.recoveryDecision?.executions.filter((e) => e.action === 'retry') ?? [];
    expect(retryExecs.length).toBe(1);
  });
});

describe('PolicyGate integration', () => {
  it('blocks discount above merchant maximum', async () => {
    const gate = new PolicyGate();
    const txn = await prisma.transaction.findFirst({ where: { status: 'failed' } });
    if (!txn) return;
    const result = await gate.evaluate('offer_discount', { discountPct: 10 }, txn, false);
    expect(result.result).toBe('BLOCK');
  });
});
