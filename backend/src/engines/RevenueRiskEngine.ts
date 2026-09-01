import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { auditTrail } from '../lib/services';
import { RootCauseClassifier } from './RootCauseClassifier';
import { CustomerIntelligence } from './CustomerIntelligence';
import { ExpectedValueEngine } from './ExpectedValueEngine';
import { PolicyGate } from '../policy/PolicyGate';
import { executorFactory } from '../execution/ExecutorFactory';
import { aiOrchestrator } from '../ai/AIOrchestrator';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';
import type { RecoveryAction } from '@recoveriq/shared';

export class RevenueRiskEngine {
  private classifier = new RootCauseClassifier();
  private customerIntel = new CustomerIntelligence();
  private evEngine = new ExpectedValueEngine();
  private policyGate = new PolicyGate();

  async run(transactionId: string, reprocess = false): Promise<void> {
    const txn = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!txn) throw new Error(`Transaction ${transactionId} not found`);
    if (txn.processed && !reprocess) return;

    await this.clearPriorRun(transactionId, reprocess);

    await auditTrail.log('detection', {
      message: 'Payment failure detected',
      amount: Number(txn.amount),
      transactionId: txn.id,
    }, transactionId);

    const customer = await this.customerIntel.computeForCustomer(txn.customerId);
    await auditTrail.log('customer_intel', { ...customer }, transactionId);

    const diagnosis = this.classifier.classify(txn, customer);
    await prisma.diagnosis.upsert({
      where: { transactionId },
      create: {
        transactionId,
        cause: diagnosis.cause,
        confidence: diagnosis.confidence,
        signals: diagnosis.signals,
        explanation: diagnosis.explanation,
      },
      update: {
        cause: diagnosis.cause,
        confidence: diagnosis.confidence,
        signals: diagnosis.signals,
        explanation: diagnosis.explanation,
        classifiedAt: new Date(),
      },
    });
    await auditTrail.log('diagnosis', { ...diagnosis }, transactionId);

    await prisma.riskRecord.upsert({
      where: { transactionId },
      create: {
        transactionId,
        atRiskAmount: txn.amount,
        outcome: 'at_risk',
      },
      update: { atRiskAmount: txn.amount, outcome: 'at_risk' },
    });

    await aiOrchestrator.runPreDecisionPipeline(transactionId).catch((err) => {
      console.warn(`[AI Pipeline Warning] Pre-decision analysis skipped: ${err}`);
    });

    let forceDiscountPct: number | undefined;
    if (transactionId === DEMO_SCENARIO_IDS.POLICY_BLOCK) {
      forceDiscountPct = 10;
    }

    let decision = this.evEngine.decide(
      Number(txn.amount),
      diagnosis.cause,
      diagnosis.confidence,
      customer,
      txn.retryCount,
      forceDiscountPct
    );

    if (transactionId === DEMO_SCENARIO_IDS.POLICY_BLOCK) {
      decision = this.forceDemoPolicyBlockDecision(decision, Number(txn.amount));
    }

    await auditTrail.log('probability_calculated', {
      label: decision.label,
      candidates: decision.candidates.map((c) => ({
        action: c.action,
        probability: c.recoveryProbability,
      })),
    }, transactionId);

    await auditTrail.log('ev_calculated', {
      candidates: decision.candidates,
      formula: 'EV = P(recovery|action) × recoverable_amount − intervention_cost − friction_cost',
    }, transactionId);

    const recoveryDecision = await prisma.recoveryDecision.upsert({
      where: { transactionId },
      create: {
        transactionId,
        selectedAction: decision.selectedAction,
        selectedEv: decision.selectedEv,
        recoverableAmount: BigInt(decision.recoverableAmount),
        reasoningText: decision.reasoningText,
      },
      update: {
        selectedAction: decision.selectedAction,
        selectedEv: decision.selectedEv,
        recoverableAmount: BigInt(decision.recoverableAmount),
        reasoningText: decision.reasoningText,
        decidedAt: new Date(),
      },
    });

    await prisma.candidateAction.deleteMany({ where: { decisionId: recoveryDecision.id } });
    await prisma.candidateAction.createMany({
      data: decision.candidates.map((c) => ({
        decisionId: recoveryDecision.id,
        action: c.action,
        recoveryProbability: c.recoveryProbability,
        recoverableAmount: BigInt(c.recoverableAmount),
        interventionCost: c.interventionCost / 100,
        frictionCost: c.frictionCost / 100,
        expectedValue: c.expectedValue,
        discountPct: c.discountPct,
        isSelected: c.action === decision.selectedAction,
      })),
    });

    await auditTrail.log('action_selected', {
      selectedAction: decision.selectedAction,
      selectedEv: decision.selectedEv,
      reasoning: decision.reasoningText,
    }, transactionId);

    const customerRecord = await prisma.customer.findUnique({ where: { id: txn.customerId } });
    const actionParams: Record<string, unknown> = {};
    const selectedCandidate = decision.candidates.find((c) => c.action === decision.selectedAction);
    if (selectedCandidate?.discountPct) {
      actionParams.discountPct = selectedCandidate.discountPct;
    }

    const policyResult = await this.policyGate.evaluate(
      decision.selectedAction,
      actionParams,
      txn,
      customerRecord?.optedOut ?? false
    );

    await prisma.policyDecision.upsert({
      where: { decisionId: recoveryDecision.id },
      create: {
        decisionId: recoveryDecision.id,
        requestedAction: decision.selectedAction,
        requestedParams: actionParams as Prisma.InputJsonValue,
        result: policyResult.result,
        blockReason: policyResult.blockReason,
      },
      update: {
        requestedAction: decision.selectedAction,
        requestedParams: actionParams as Prisma.InputJsonValue,
        result: policyResult.result,
        blockReason: policyResult.blockReason,
        checkedAt: new Date(),
      },
    });

    await auditTrail.log('policy_check', { ...policyResult }, transactionId);

    if (policyResult.result === 'BLOCK') {
      await this.finalize(transactionId, 'blocked', 0, policyResult.blockReason ?? 'Policy blocked');
      await prisma.transaction.update({ where: { id: transactionId }, data: { processed: true } });
      return;
    }

    if (decision.selectedAction === 'do_nothing') {
      await this.finalize(
        transactionId,
        'do_nothing',
        0,
        'Economically unjustified — EV(do_nothing) highest'
      );
      await prisma.riskRecord.update({
        where: { transactionId },
        data: { outcome: 'do_nothing', resolvedAt: new Date() },
      });
      await prisma.transaction.update({ where: { id: transactionId }, data: { processed: true } });
      return;
    }

    await this.executeAndVerify(transactionId, recoveryDecision.id, decision.selectedAction, actionParams, txn);
    await prisma.transaction.update({ where: { id: transactionId }, data: { processed: true } });
  }

  private async executeAndVerify(
    transactionId: string,
    decisionId: string,
    action: RecoveryAction,
    params: Record<string, unknown>,
    txn: { amount: bigint; retryCount: number; razorpayPaymentId: string | null; status: string }
  ) {
    const attemptNumber = txn.retryCount + 1;
    const idempotencyKey = `${transactionId}:${action}:${attemptNumber}`;

    const existingExecution = await prisma.execution.findUnique({ where: { idempotencyKey } });
    if (existingExecution) {
      await auditTrail.log('execution_attempted', {
        message: 'Duplicate execution prevented by idempotency key',
        idempotencyKey,
      }, transactionId);
      return;
    }

    await auditTrail.log('execution_attempted', { action, idempotencyKey, attemptNumber }, transactionId);

    const result = await executorFactory.execute(
      {
        transactionId,
        action,
        params,
        idempotencyKey,
        attemptNumber,
        amount: Number(txn.amount),
        razorpayPaymentId: txn.razorpayPaymentId,
        paymentStatus: txn.status,
      },
      txn.status
    );

    await prisma.execution.create({
      data: {
        decisionId,
        action,
        executorType: result.executorType,
        executionMode: result.executionMode,
        idempotencyKey,
        status: result.status,
        razorpayReference: result.razorpayReference,
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
        attemptNumber,
      },
    });

    await auditTrail.log(
      'execution_result',
      { ...result, safeFailure: result.status === 'failed' },
      transactionId,
      result.executionMode
    );

    if (result.status === 'success') {
      await this.finalize(transactionId, 'recovered', Number(txn.amount), 'Revenue successfully recovered');
      await prisma.transaction.update({ where: { id: transactionId }, data: { status: 'recovered' } });
      await prisma.riskRecord.update({
        where: { transactionId },
        data: { outcome: 'recovered', resolvedAt: new Date() },
      });
      await auditTrail.log('recovery_verified', {
        recoveredAmount: Number(txn.amount),
        executionMode: result.executionMode,
      }, transactionId, result.executionMode);
      await auditTrail.log('loop_stopped', { reason: 'Revenue successfully recovered' }, transactionId);
      return;
    }

    if (result.status === 'failed') {
      await this.handleExecutionFailure(transactionId, decisionId, Number(txn.amount));
    }
  }

  private async handleExecutionFailure(
    transactionId: string,
    decisionId: string,
    amount: number
  ) {
    const escalateKey = `${transactionId}:escalate_human:1`;
    const existingEscalation = await prisma.execution.findUnique({ where: { idempotencyKey: escalateKey } });

    if (!existingEscalation) {
      const escalationResult = await executorFactory.execute({
        transactionId,
        action: 'escalate_human',
        params: {},
        idempotencyKey: escalateKey,
        attemptNumber: 1,
        amount,
      });

      await prisma.execution.create({
        data: {
          decisionId,
          action: 'escalate_human',
          executorType: escalationResult.executorType,
          executionMode: escalationResult.executionMode,
          idempotencyKey: escalateKey,
          status: escalationResult.status,
          razorpayReference: escalationResult.razorpayReference,
          attemptNumber: 1,
        },
      });

      await auditTrail.log('escalation', {
        reason: 'Execution failed; fallback to human escalation',
        noDuplicateCharge: true,
      }, transactionId, escalationResult.executionMode);
    }

    await this.finalize(
      transactionId,
      'escalated',
      0,
      'Recovery attempt failed safely — no duplicate payment action executed'
    );
    await prisma.transaction.update({ where: { id: transactionId }, data: { status: 'escalated' } });
    await prisma.riskRecord.update({
      where: { transactionId },
      data: { outcome: 'escalated', resolvedAt: new Date() },
    });
    await auditTrail.log('loop_stopped', {
      reason: 'Execution failure — escalated to human',
      safeFailure: true,
    }, transactionId);
  }

  private forceDemoPolicyBlockDecision(
    decision: ReturnType<ExpectedValueEngine['decide']>,
    amountPaise: number
  ) {
    const discountPct = 10;
    const discountCandidate = decision.candidates.find((c) => c.action === 'offer_discount');
    const recoverableAmount = amountPaise;
    const discountAmount = Math.round((amountPaise * discountPct) / 100);
    const interventionCost = (discountCandidate?.interventionCost ?? 1000) + discountAmount;
    const frictionCost = discountCandidate?.frictionCost ?? 7500;
    const recoveryProbability = discountCandidate?.recoveryProbability ?? 0.45;
    const expectedValue =
      recoveryProbability * (recoverableAmount / 100) -
      interventionCost / 100 -
      frictionCost / 100;

    const updatedCandidates = decision.candidates.map((c) =>
      c.action === 'offer_discount'
        ? { ...c, discountPct, interventionCost, expectedValue }
        : c
    );

    return {
      ...decision,
      selectedAction: 'offer_discount' as RecoveryAction,
      selectedEv: expectedValue,
      recoverableAmount,
      reasoningText: `OFFER_DISCOUNT selected at ${discountPct}% because EV = ₹${expectedValue.toFixed(2)} — higher than alternatives; subject to policy gate.`,
      candidates: updatedCandidates,
    };
  }

  private async clearPriorRun(transactionId: string, reprocess: boolean) {
    if (!reprocess) return;
    const existingDecision = await prisma.recoveryDecision.findUnique({
      where: { transactionId },
    });
    if (!existingDecision) return;
    await prisma.execution.deleteMany({ where: { decisionId: existingDecision.id } });
    await prisma.recoveryOutcome.deleteMany({ where: { transactionId } });
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'failed', processed: false },
    });
  }

  private async finalize(
    transactionId: string,
    finalStatus: 'recovered' | 'failed' | 'blocked' | 'do_nothing' | 'escalated' | 'pending',
    recoveredAmount: number,
    stoppingReason: string
  ) {
    await prisma.recoveryOutcome.upsert({
      where: { transactionId },
      create: { transactionId, finalStatus, recoveredAmount: BigInt(recoveredAmount), stoppingReason },
      update: { finalStatus, recoveredAmount: BigInt(recoveredAmount), stoppingReason, verifiedAt: new Date() },
    });

    const mappedTxnStatus =
      finalStatus === 'recovered'
        ? 'recovered'
        : finalStatus === 'escalated'
        ? 'escalated'
        : finalStatus === 'blocked'
        ? 'blocked'
        : finalStatus === 'do_nothing'
        ? 'no_action'
        : 'failed';

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: mappedTxnStatus as any, processed: true },
    });

    await auditTrail.log('loop_stopped', { reason: stoppingReason, finalStatus }, transactionId);

    await aiOrchestrator.runPostDecisionExplanation(transactionId).catch((err) => {
      console.warn(`[AI Pipeline Warning] Explanation generation skipped: ${err}`);
    });
  }

  async processBatch(limit = 500): Promise<{ processed: number; errors: string[] }> {
    const failures = await prisma.transaction.findMany({
      where: { status: 'failed', processed: false },
      take: limit,
      orderBy: { timestamp: 'asc' },
    });

    const errors: string[] = [];
    let processed = 0;

    for (const txn of failures) {
      try {
        await this.run(txn.id);
        processed++;
      } catch (err) {
        errors.push(`${txn.id}: ${err instanceof Error ? err.message : 'unknown error'}`);
      }
    }

    return { processed, errors };
  }
}

export const revenueRiskEngine = new RevenueRiskEngine();
