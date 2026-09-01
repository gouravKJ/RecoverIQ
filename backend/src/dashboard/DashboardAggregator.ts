import { prisma } from '../lib/prisma';

export class DashboardAggregator {
  async getSummary() {
    const [
      totalTransactions,
      allTransactions,
      recoveredOutcomes,
      customersAffected,
      interventions,
      blocked,
      avoided,
      failedAttempts,
    ] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.findMany({ select: { amount: true } }),
      prisma.recoveryOutcome.findMany({ where: { finalStatus: 'recovered' } }),
      prisma.transaction.findMany({
        distinct: ['customerId'],
        select: { customerId: true },
      }),
      prisma.execution.count({
        where: { action: { not: 'do_nothing' }, status: { not: 'skipped' } },
      }),
      prisma.policyDecision.count({ where: { result: 'BLOCK' } }),
      prisma.recoveryDecision.count({ where: { selectedAction: 'do_nothing' } }),
      prisma.execution.count({ where: { status: 'failed' } }),
    ]);

    const revenueAtRisk = allTransactions.reduce((s, r) => s + Number(r.amount), 0);
    const revenueRecovered = recoveredOutcomes.reduce((s, r) => s + Number(r.recoveredAmount), 0);
    const recoveryRate = revenueAtRisk > 0 ? (revenueRecovered / revenueAtRisk) * 100 : 0;

    return {
      totalTransactionsProcessed: totalTransactions,
      revenueAtRisk,
      revenueRecovered,
      recoveryRate: Math.round(recoveryRate * 10) / 10,
      customersAffected: customersAffected.length,
      interventionsTaken: interventions,
      actionsBlocked: blocked,
      actionsAvoided: avoided,
      failedRecoveryAttempts: failedAttempts,
    };
  }

  async getLeakage() {
    const [paymentAggregate, subscriptionAggregate] = await Promise.all([
      prisma.transaction.aggregate({
        where: { type: 'payment' },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { type: 'subscription' },
        _sum: { amount: true },
      }),
    ]);

    const paymentFailures = Number(paymentAggregate._sum.amount ?? 0);
    const subscriptionFailures = Number(subscriptionAggregate._sum.amount ?? 0);
    const totalAtRiskValue = paymentFailures + subscriptionFailures;

    return {
      totalAtRiskValue,
      paymentFailures,
      subscriptionFailures,
      breakdown: [
        { name: 'Payment Failures', value: paymentFailures },
        { name: 'Subscription Failures', value: subscriptionFailures },
      ],
    };
  }
}

export const dashboardAggregator = new DashboardAggregator();
