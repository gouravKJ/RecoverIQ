import { prisma } from '../lib/prisma';
import { TransactionNormalizer } from './TransactionNormalizer';
import { RevenueRiskEngine } from '../engines/RevenueRiskEngine';

export class RazorpayWebhookIngestor {
  private normalizer = new TransactionNormalizer();
  private engine = new RevenueRiskEngine();

  async processEvent(event: Record<string, unknown>): Promise<void> {
    const eventId = String(event.id ?? `${event.event}_${Date.now()}`);
    const eventType = String(event.event ?? '');

    const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
    if (existing) return;

    await prisma.webhookEvent.create({ data: { eventId, eventType } });

    const payload = event.payload as Record<string, unknown> | undefined;
    if (!payload) return;

    const paymentEntity =
      (payload.payment as Record<string, unknown>)?.entity ??
      payload.payment ??
      null;

    if (!paymentEntity || typeof paymentEntity !== 'object') {
      if (eventType === 'subscription.pending' || eventType === 'subscription.charged') {
        const subPayment = this.extractSubscriptionPayment(payload);
        if (subPayment) {
          await this.handlePayment(subPayment, eventType);
        }
      }
      return;
    }

    await this.handlePayment(paymentEntity as Record<string, unknown>, eventType);
  }

  private extractSubscriptionPayment(payload: Record<string, unknown>): Record<string, unknown> | null {
    const payment = (payload.payment as Record<string, unknown>)?.entity;
    return payment && typeof payment === 'object' ? (payment as Record<string, unknown>) : null;
  }

  private async handlePayment(payment: Record<string, unknown>, eventType: string) {
    const normalized = this.normalizer.fromRazorpayPayment(payment, eventType);
    normalized.id = normalized.razorpayPaymentId || normalized.id;

    const data = this.normalizer.toPrismaData(normalized);
    await prisma.customer.upsert({
      where: { id: normalized.customerId },
      create: { id: normalized.customerId },
      update: {},
    });

    await prisma.transaction.upsert({
      where: { id: normalized.id },
      create: data,
      update: data,
    });

    if (normalized.status === 'failed') {
      await this.engine.run(normalized.id);
    } else if (normalized.status === 'captured') {
      await this.markRecovered(normalized.id, Number(normalized.amount));
    }
  }

  private async markRecovered(transactionId: string, amount: number) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: 'recovered' },
    });
    await prisma.recoveryOutcome.upsert({
      where: { transactionId },
      create: {
        transactionId,
        finalStatus: 'recovered',
        recoveredAmount: BigInt(amount),
        stoppingReason: 'Payment captured via webhook',
      },
      update: {
        finalStatus: 'recovered',
        recoveredAmount: BigInt(amount),
        stoppingReason: 'Payment captured via webhook',
      },
    });
  }
}

export const razorpayWebhookIngestor = new RazorpayWebhookIngestor();
