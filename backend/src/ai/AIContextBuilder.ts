import { prisma } from '../lib/prisma';

function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}

export class AIContextBuilder {
  async buildTransactionContext(transactionId: string) {
    const txn = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        customer: true,
        diagnosis: true,
        riskRecord: true,
        recoveryDecision: {
          include: {
            candidateActions: true,
            policyDecision: true,
            executions: true,
          },
        },
        recoveryOutcome: true,
      },
    });

    if (!txn) {
      throw new Error(`Transaction ${transactionId} not found for AI context build`);
    }

    const recentAuditEvents = await prisma.auditEvent.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const safeTxn = serializeBigInt(txn) as Record<string, unknown>;
    const safeAudit = serializeBigInt(recentAuditEvents) as Record<string, unknown>[];

    const amountPaise = Number(safeTxn.amount);
    const amountInRupees = amountPaise / 100;
    const amountFormatted = '₹' + amountInRupees.toLocaleString('en-IN', { minimumFractionDigits: 2 });

    return {
      transaction: {
        id: safeTxn.id,
        amountInPaise: amountPaise,
        amountInRupees: amountInRupees,
        amountFormatted: amountFormatted,
        currency: safeTxn.currency,
        paymentMethod: safeTxn.paymentMethod,
        failureReasonCode: safeTxn.failureReasonCode,
        failureDescription: safeTxn.failureDescription,
        type: safeTxn.type,
        status: safeTxn.status,
        timestamp: safeTxn.timestamp,
        retryCount: safeTxn.retryCount,
        reminderCount: safeTxn.reminderCount,
        isDemoAnchor: safeTxn.isDemoAnchor,
      },
      customer: safeTxn.customer,
      diagnosis: safeTxn.diagnosis,
      decision: safeTxn.recoveryDecision,
      outcome: safeTxn.recoveryOutcome,
      auditEvents: safeAudit.map((e) => ({
        eventType: e.eventType,
        payload: e.payload,
        createdAt: e.createdAt,
      })),
    };
  }

  async buildBatchMetricsContext() {
    const [
      totalCount,
      typeBreakdown,
      methodBreakdown,
      topFailureCodes,
      recentFailures,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.groupBy({
        by: ['type'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['paymentMethod'],
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['failureReasonCode'],
        _count: { _all: true },
        _sum: { amount: true },
        orderBy: { _count: { failureReasonCode: 'desc' } },
        take: 5,
      }),
      prisma.transaction.findMany({
        where: { status: 'failed' },
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          failureReasonCode: true,
          type: true,
          timestamp: true,
        },
        take: 20,
        orderBy: { timestamp: 'desc' },
      }),
    ]);

    return {
      totalCount,
      typeBreakdown: serializeBigInt(typeBreakdown),
      methodBreakdown: serializeBigInt(methodBreakdown),
      topFailureCodes: serializeBigInt(topFailureCodes),
      recentFailures: serializeBigInt(recentFailures),
    };
  }
}

export const aiContextBuilder = new AIContextBuilder();
