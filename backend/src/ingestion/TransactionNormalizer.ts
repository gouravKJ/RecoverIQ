import type { NormalizedTransaction } from '@recoveriq/shared';
import type { TransactionType, TransactionStatus, TransactionSource, Prisma } from '@prisma/client';

export class TransactionNormalizer {
  normalize(raw: Record<string, unknown>): NormalizedTransaction {
    return {
      id: String(raw.id),
      customerId: String(raw.customerId ?? raw.customer_id ?? 'unknown'),
      amount: Number(raw.amount),
      currency: String(raw.currency ?? 'INR'),
      paymentMethod: String(raw.paymentMethod ?? raw.payment_method ?? 'unknown'),
      failureReasonCode: raw.failureReasonCode
        ? String(raw.failureReasonCode)
        : raw.failure_reason_code
          ? String(raw.failure_reason_code)
          : null,
      failureDescription: raw.failureDescription
        ? String(raw.failureDescription)
        : raw.failure_description
          ? String(raw.failure_description)
          : null,
      timestamp: raw.timestamp ? new Date(String(raw.timestamp)) : new Date(),
      retryCount: Number(raw.retryCount ?? raw.retry_count ?? 0),
      type: (raw.type as 'payment' | 'subscription') ?? 'payment',
      status: (raw.status as NormalizedTransaction['status']) ?? 'failed',
      source: (raw.source as NormalizedTransaction['source']) ?? 'batch',
      razorpayPaymentId: raw.razorpayPaymentId ? String(raw.razorpayPaymentId) : null,
      razorpayOrderId: raw.razorpayOrderId ? String(raw.razorpayOrderId) : null,
      razorpaySubscriptionId: raw.razorpaySubscriptionId ? String(raw.razorpaySubscriptionId) : null,
      isDemoAnchor: Boolean(raw.isDemoAnchor ?? raw.is_demo_anchor),
      demoScenario: raw.demoScenario ? String(raw.demoScenario) : null,
      customerOptedOut: Boolean(raw.customerOptedOut ?? raw.customer_opted_out),
      metadata: raw.metadata as Record<string, unknown> | undefined,
    };
  }

  fromRazorpayPayment(payment: Record<string, unknown>, eventType: string): NormalizedTransaction {
    const isSubscription = Boolean(payment.invoice_id) || eventType.startsWith('subscription');
    const status = this.mapPaymentStatus(String(payment.status ?? 'failed'), eventType);

    return {
      id: String(payment.id ?? payment.payment_id ?? `pay_${Date.now()}`),
      customerId: String(payment.customer_id ?? payment.email ?? payment.contact ?? 'unknown'),
      amount: Number(payment.amount ?? 0),
      currency: String(payment.currency ?? 'INR'),
      paymentMethod: String(payment.method ?? 'unknown'),
      failureReasonCode: payment.error_code ? String(payment.error_code) : null,
      failureDescription: payment.error_description ? String(payment.error_description) : null,
      timestamp: payment.created_at
        ? new Date(Number(payment.created_at) * 1000)
        : new Date(),
      retryCount: 0,
      type: isSubscription ? 'subscription' : 'payment',
      status,
      source: 'webhook',
      razorpayPaymentId: String(payment.id ?? ''),
      razorpayOrderId: payment.order_id ? String(payment.order_id) : null,
      razorpaySubscriptionId: payment.subscription_id ? String(payment.subscription_id) : null,
    };
  }

  private mapPaymentStatus(status: string, eventType: string): NormalizedTransaction['status'] {
    if (eventType === 'payment.captured' || eventType === 'subscription.charged') return 'captured';
    if (status === 'authorized') return 'authorized';
    if (status === 'captured') return 'captured';
    if (eventType === 'payment.failed' || eventType === 'subscription.pending') return 'failed';
    return 'failed';
  }

  toPrismaData(txn: NormalizedTransaction) {
    return {
      id: txn.id,
      customerId: txn.customerId,
      amount: BigInt(txn.amount),
      currency: txn.currency,
      paymentMethod: txn.paymentMethod,
      failureReasonCode: txn.failureReasonCode,
      failureDescription: txn.failureDescription,
      timestamp: txn.timestamp,
      retryCount: txn.retryCount,
      type: txn.type as TransactionType,
      status: txn.status as TransactionStatus,
      source: txn.source as TransactionSource,
      razorpayPaymentId: txn.razorpayPaymentId,
      razorpayOrderId: txn.razorpayOrderId,
      razorpaySubscriptionId: txn.razorpaySubscriptionId,
      isDemoAnchor: txn.isDemoAnchor ?? false,
      demoScenario: txn.demoScenario,
      metadata: (txn.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    };
  }
}
