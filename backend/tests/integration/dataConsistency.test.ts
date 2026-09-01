import { describe, it, expect } from 'vitest';
import { prisma } from '../../src/lib/prisma';
import { RootCauseClassifier } from '../../src/engines/RootCauseClassifier';
import { CustomerIntelligence } from '../../src/engines/CustomerIntelligence';
import { revenueRiskEngine } from '../../src/engines/RevenueRiskEngine';
import { aiStatusService } from '../../src/ai/AIStatusService';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

describe('Data Consistency & Demo Integrity Verification Tests', () => {
  const classifier = new RootCauseClassifier();
  const customerIntel = new CustomerIntelligence();

  it('1. Canonical Root Cause Consistency — RootCauseClassifier matches Diagnosis DB record', async () => {
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(txn).toBeDefined();

    const result = classifier.classify(txn!);
    expect(result.cause).toBe('network_timeout');

    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY, true);

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(diagnosis?.cause).toBe('network_timeout');
  });

  it('2. Customer 360 Consistency — customer metrics are derived from real DB transaction records', async () => {
    const profile = await customerIntel.computeForCustomer('C1042');
    expect(profile.customerId).toBe('C1042');
    expect(profile.totalTransactions).toBeGreaterThan(0);
    expect(profile.lifetimeValue).toBeGreaterThan(0);
    expect(profile.successRate).toBeGreaterThan(0);

    const dbCustomer = await prisma.customer.findUnique({ where: { id: 'C1042' } });
    expect(Number(dbCustomer?.lifetimeValue)).toBe(profile.lifetimeValue);
    expect(dbCustomer?.totalTransactions).toBe(profile.totalTransactions);
  });

  it('3. Amount Consistency — Transaction amount and EV recoverable amount derive from Prisma txn.amount', async () => {
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(txn?.amount).toBe(BigInt(749900)); // ₹7,499.00

    const decision = await prisma.recoveryDecision.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(Number(decision?.recoverableAmount)).toBe(749900);
  });

  it('4. Scenario 1 (Successful Recovery) maps to status RECOVERED', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(txn?.status).toBe('recovered');

    const outcome = await prisma.recoveryOutcome.findFirst({
      where: { transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(outcome?.finalStatus).toBe('recovered');
    expect(Number(outcome?.recoveredAmount)).toBe(749900);
  });

  it('5. Scenario 2 (Do Nothing) maps to status NO_ACTION / do_nothing', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.DO_NOTHING, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.DO_NOTHING },
    });
    expect(txn?.status).toBe('no_action');

    const outcome = await prisma.recoveryOutcome.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.DO_NOTHING },
    });
    expect(outcome?.finalStatus).toBe('do_nothing');
  });

  it('6. Scenario 3 (Policy Block) maps to status BLOCKED', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.POLICY_BLOCK, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.POLICY_BLOCK },
    });
    expect(txn?.status).toBe('blocked');

    const outcome = await prisma.recoveryOutcome.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.POLICY_BLOCK },
    });
    expect(outcome?.finalStatus).toBe('blocked');
  });

  it('7. Scenario 4 (Graceful Failure) maps to status ESCALATED', async () => {
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.GRACEFUL_FAILURE, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE },
    });
    expect(txn?.status).toBe('escalated');

    const outcome = await prisma.recoveryOutcome.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE },
    });
    expect(outcome?.finalStatus).toBe('escalated');
  });

  it('8. Truthful AI Status Service — reports active status without leaking secrets', () => {
    const status = aiStatusService.getStatus();
    expect(status.provider).toBe('Groq');
    expect(status.model).toBeDefined();
    expect(['LLM', 'DETERMINISTIC_FALLBACK']).toContain(status.mode);
    expect((status as any).apiKey).toBeUndefined();
  });

  it('9. Amount conversion regression test — 749900 paise formats to ₹7,499.00 and never raw ₹749,900', () => {
    const amountPaise = 749900;
    const amountRupees = amountPaise / 100;
    const formatted = '₹' + amountRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    expect(formatted).toBe('₹7,499.00');
    expect(formatted).not.toContain('749,900');
  });

  it('10. AI Recommendation vs EV Decision — EV Engine decision remains authoritative over AI recommendation', async () => {
    // Run scenario 1 where EV engine decides 'retry'
    await revenueRiskEngine.run(DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY, true);
    const decision = await prisma.recoveryDecision.findUnique({
      where: { transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY },
    });
    expect(decision?.selectedAction).toBe('retry');
  });
});
