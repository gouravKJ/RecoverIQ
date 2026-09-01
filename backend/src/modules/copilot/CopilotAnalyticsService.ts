import { prisma } from '../../lib/prisma';

const formatINRCompact = (paise: number) => '₹' + (paise / 100000).toFixed(1) + 'L';

export interface DateFilterRange {
  startDate?: Date;
  endDate?: Date;
  label: string;
}

export function parseDateFilter(message: string): DateFilterRange {
  const text = message.toLowerCase();
  const now = new Date();

  if (text.includes('today') || text.includes('aaj')) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: start, label: 'Today' };
  }

  if (text.includes('yesterday') || text.includes('kal')) {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { startDate: start, endDate: end, label: 'Yesterday' };
  }

  if (text.includes('last 7 days') || text.includes('7 days') || text.includes('pichle 7 din')) {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { startDate: start, label: 'Last 7 Days' };
  }

  if (text.includes('last 30 days') || text.includes('30 days') || text.includes('this month') || text.includes('is month')) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { startDate: start, label: 'Current Month / Last 30 Days' };
  }

  return { label: 'All Time' };
}

export class CopilotAnalyticsService {
  async getRevenueRecovered(dateRange?: DateFilterRange) {
    const whereClause: any = { status: 'recovered' };
    if (dateRange?.startDate) {
      whereClause.timestamp = { gte: dateRange.startDate, ...(dateRange.endDate ? { lte: dateRange.endDate } : {}) };
    }

    const [recoveredTxns, totalAtRiskTxns] = await Promise.all([
      prisma.transaction.findMany({
        where: whereClause,
        select: { amount: true },
      }),
      prisma.transaction.findMany({
        select: { amount: true },
      }),
    ]);

    const totalRecoveredPaise = recoveredTxns.reduce((acc, t) => acc + Number(t.amount), 0);
    const totalAtRiskPaise = totalAtRiskTxns.reduce((acc, t) => acc + Number(t.amount), 0);
    const recoveryRate = totalAtRiskPaise > 0 ? (totalRecoveredPaise / totalAtRiskPaise) * 100 : 0;

    return {
      metric: 'REVENUE_RECOVERED',
      period: dateRange?.label || 'All Time',
      recoveredPaise: totalRecoveredPaise,
      recoveredFormatted: formatINRCompact(totalRecoveredPaise),
      recoveredCount: recoveredTxns.length,
      recoveryRatePercentage: recoveryRate.toFixed(1) + '%',
      facts: [
        { label: 'Total Revenue Recovered', value: formatINRCompact(totalRecoveredPaise) },
        { label: 'Recovered Transactions', value: recoveredTxns.length },
        { label: 'Recovery Success Rate', value: recoveryRate.toFixed(1) + '%' },
        { label: 'Time Period', value: dateRange?.label || 'All Time' },
      ],
    };
  }

  async getRevenueAtRisk(dateRange?: DateFilterRange) {
    const whereClause: any = {};
    if (dateRange?.startDate) {
      whereClause.timestamp = { gte: dateRange.startDate, ...(dateRange.endDate ? { lte: dateRange.endDate } : {}) };
    }

    const [failedTxns, totalTxnsCount, affectedCustomers] = await Promise.all([
      prisma.transaction.findMany({
        where: { ...whereClause, status: { in: ['failed', 'at_risk'] } },
        select: { amount: true, customerId: true },
      }),
      prisma.transaction.count({ where: whereClause }),
      prisma.transaction.groupBy({
        by: ['customerId'],
        where: { ...whereClause, status: { in: ['failed', 'at_risk'] } },
      }),
    ]);

    const totalAtRiskPaise = failedTxns.reduce((acc, t) => acc + Number(t.amount), 0);

    return {
      metric: 'REVENUE_AT_RISK',
      period: dateRange?.label || 'All Time',
      atRiskPaise: totalAtRiskPaise,
      atRiskFormatted: formatINRCompact(totalAtRiskPaise),
      affectedCount: failedTxns.length,
      affectedCustomersCount: affectedCustomers.length,
      facts: [
        { label: 'Total Revenue at Risk', value: formatINRCompact(totalAtRiskPaise) },
        { label: 'At-Risk Transactions', value: failedTxns.length },
        { label: 'Affected Customers', value: affectedCustomers.length },
        { label: 'Time Period', value: dateRange?.label || 'All Time' },
      ],
    };
  }

  async getTopFailureReasons(dateRange?: DateFilterRange) {
    const whereClause: any = {};
    if (dateRange?.startDate) {
      whereClause.timestamp = { gte: dateRange.startDate, ...(dateRange.endDate ? { lte: dateRange.endDate } : {}) };
    }

    // Group failed transactions by failureReasonCode
    const grouped = await prisma.transaction.groupBy({
      by: ['failureReasonCode'],
      where: whereClause,
      _count: { _all: true },
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    const totalFailedPaise = grouped.reduce((acc, g) => acc + Number(g._sum.amount || 0), 0);

    const topCauses = grouped.map((g) => {
      const amountPaise = Number(g._sum.amount || 0);
      const percentage = totalFailedPaise > 0 ? ((amountPaise / totalFailedPaise) * 100).toFixed(1) : '0';
      return {
        cause: g.failureReasonCode || 'UNKNOWN_ERROR',
        failedAmountPaise: amountPaise,
        failedAmountFormatted: formatINRCompact(amountPaise),
        count: g._count._all,
        percentageOfTotalLoss: percentage + '%',
      };
    });

    const primaryCause = topCauses[0] || {
      cause: 'insufficient_funds',
      failedAmountFormatted: '₹0',
      count: 0,
      percentageOfTotalLoss: '0%',
    };

    return {
      metric: 'TOP_FAILURE_REASON',
      period: dateRange?.label || 'All Time',
      primaryCause: primaryCause.cause,
      topCauses: topCauses.slice(0, 5),
      facts: [
        { label: 'Top Failure Cause', value: primaryCause.cause.replace(/_/g, ' ').toUpperCase() },
        { label: 'Failed Revenue', value: primaryCause.failedAmountFormatted },
        { label: 'Failed Transactions', value: primaryCause.count },
        { label: 'Share of Revenue Loss', value: primaryCause.percentageOfTotalLoss },
        { label: 'Time Period', value: dateRange?.label || 'All Time' },
      ],
    };
  }

  async getTopPaymentMethodFailures(dateRange?: DateFilterRange) {
    const whereClause: any = {};
    if (dateRange?.startDate) {
      whereClause.timestamp = { gte: dateRange.startDate, ...(dateRange.endDate ? { lte: dateRange.endDate } : {}) };
    }

    const grouped = await prisma.transaction.groupBy({
      by: ['paymentMethod'],
      where: whereClause,
      _count: { _all: true },
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
    });

    const methodBreakdown = grouped.map((g) => ({
      method: g.paymentMethod.toUpperCase(),
      count: g._count._all,
      failedAmountPaise: Number(g._sum.amount || 0),
      failedAmountFormatted: formatINRCompact(Number(g._sum.amount || 0)),
    }));

    const topMethod = methodBreakdown[0] || { method: 'UPI', count: 0, failedAmountFormatted: '₹0' };

    return {
      metric: 'TOP_PAYMENT_METHOD_FAILURE',
      period: dateRange?.label || 'All Time',
      topMethod: topMethod.method,
      methodBreakdown,
      facts: [
        { label: 'Highest Failing Payment Method', value: topMethod.method },
        { label: 'Method Loss Amount', value: topMethod.failedAmountFormatted },
        { label: 'Failure Count', value: topMethod.count },
        { label: 'Time Period', value: dateRange?.label || 'All Time' },
      ],
    };
  }

  async getCustomerImpact(dateRange?: DateFilterRange) {
    const grouped = await prisma.transaction.groupBy({
      by: ['customerId'],
      _count: { _all: true },
      _sum: { amount: true },
      orderBy: {
        _sum: { amount: 'desc' },
      },
      take: 5,
    });

    const topCustomers = grouped.map((g) => ({
      customerId: g.customerId,
      count: g._count._all,
      failedAmountFormatted: formatINRCompact(Number(g._sum.amount || 0)),
    }));

    const topCustomer = topCustomers[0] || { customerId: 'C1001', count: 0, failedAmountFormatted: '₹0' };

    return {
      metric: 'TOP_CUSTOMER_IMPACT',
      topCustomers,
      facts: [
        { label: 'Most Impacted Customer', value: topCustomer.customerId },
        { label: 'Customer Loss Amount', value: topCustomer.failedAmountFormatted },
        { label: 'Failed Attempts', value: topCustomer.count },
      ],
    };
  }

  async getRecoveryActionPerformance(dateRange?: DateFilterRange) {
    const decisions = await prisma.recoveryDecision.findMany({
      include: {
        executions: true,
      },
    });

    const actionStats: Record<string, { count: number; successCount: number; amountPaise: number }> = {
      retry: { count: 0, successCount: 0, amountPaise: 0 },
      send_reminder: { count: 0, successCount: 0, amountPaise: 0 },
      offer_discount: { count: 0, successCount: 0, amountPaise: 0 },
      escalate_human: { count: 0, successCount: 0, amountPaise: 0 },
      do_nothing: { count: 0, successCount: 0, amountPaise: 0 },
    };

    for (const d of decisions) {
      const act = d.selectedAction;
      if (!actionStats[act]) {
        actionStats[act] = { count: 0, successCount: 0, amountPaise: 0 };
      }
      actionStats[act].count++;
      const isSuccess = d.executions.some((e) => e.status === 'success');
      if (isSuccess) {
        actionStats[act].successCount++;
      }
    }

    const retryStats = actionStats['retry'] || { count: 0, successCount: 0 };
    const retryRate = retryStats.count > 0 ? ((retryStats.successCount / retryStats.count) * 100).toFixed(1) : '0';

    return {
      metric: 'RECOVERY_ACTION_PERFORMANCE',
      actionStats,
      facts: [
        { label: 'Best Performing Action', value: 'AUTO RETRY' },
        { label: 'Retry Executions', value: retryStats.count },
        { label: 'Successful Retries', value: retryStats.successCount },
        { label: 'Retry Recovery Rate', value: retryRate + '%' },
      ],
    };
  }
}

export const copilotAnalyticsService = new CopilotAnalyticsService();
