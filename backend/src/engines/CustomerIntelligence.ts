import { prisma } from '../lib/prisma';
import type { CustomerProfile } from '@recoveriq/shared';

export class CustomerIntelligence {
  async computeForCustomer(customerId: string): Promise<CustomerProfile> {
    const transactions = await prisma.transaction.findMany({
      where: { customerId },
      orderBy: { timestamp: 'asc' },
    });

    const successful = transactions.filter((t) =>
      ['captured', 'recovered'].includes(t.status)
    );
    const failed = transactions.filter((t) => t.status === 'failed');

    const lifetimeValue = successful.reduce((sum, t) => sum + Number(t.amount), 0);
    const total = transactions.length;
    const successRate = total > 0 ? successful.length / total : 0;
    const avgValue = successful.length > 0 ? lifetimeValue / successful.length : 0;

    const methodCounts: Record<string, number> = {};
    for (const t of successful) {
      methodCounts[t.paymentMethod] = (methodCounts[t.paymentMethod] || 0) + 1;
    }
    const preferredPaymentMethod =
      Object.entries(methodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      transactions[0]?.paymentMethod ||
      'unknown';

    const previousRetryCount = transactions.reduce((sum, t) => sum + t.retryCount, 0);

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    const optedOut = customer?.optedOut ?? false;

    const profile: CustomerProfile = {
      customerId,
      lifetimeValue,
      totalTransactions: total,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      successRate,
      averageTransactionValue: Math.round(avgValue),
      preferredPaymentMethod,
      previousRetryCount,
    };

    await prisma.customer.upsert({
      where: { id: customerId },
      create: {
        id: customerId,
        lifetimeValue: BigInt(profile.lifetimeValue),
        totalTransactions: profile.totalTransactions,
        successfulTransactions: profile.successfulTransactions,
        failedTransactions: profile.failedTransactions,
        successRate: profile.successRate,
        averageTransactionValue: BigInt(profile.averageTransactionValue),
        preferredPaymentMethod: profile.preferredPaymentMethod,
        previousRetryCount: profile.previousRetryCount,
        optedOut,
      },
      update: {
        lifetimeValue: BigInt(profile.lifetimeValue),
        totalTransactions: profile.totalTransactions,
        successfulTransactions: profile.successfulTransactions,
        failedTransactions: profile.failedTransactions,
        successRate: profile.successRate,
        averageTransactionValue: BigInt(profile.averageTransactionValue),
        preferredPaymentMethod: profile.preferredPaymentMethod,
        previousRetryCount: profile.previousRetryCount,
        computedAt: new Date(),
      },
    });

    return profile;
  }
}
