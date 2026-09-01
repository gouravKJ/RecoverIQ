import { prisma } from '../lib/prisma';
import type { AuditEventType } from '@recoveriq/shared';

export class AuditTrailService {
  async log(
    eventType: AuditEventType | string,
    payload: Record<string, unknown>,
    transactionId?: string,
    executionMode?: string
  ): Promise<void> {
    await prisma.auditEvent.create({
      data: {
        transactionId: transactionId ?? null,
        eventType,
        payload: payload as object,
        executionMode: executionMode ?? null,
      },
    });
  }

  async getByTransaction(transactionId: string) {
    return prisma.auditEvent.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAll(page = 1, limit = 50, eventType?: string) {
    const where = eventType ? { eventType } : {};
    const [events, total] = await Promise.all([
      prisma.auditEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { transaction: { select: { id: true, amount: true, paymentMethod: true } } },
      }),
      prisma.auditEvent.count({ where }),
    ]);
    return { events, total, page, limit };
  }
}
