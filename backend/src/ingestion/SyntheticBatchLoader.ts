import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { TransactionNormalizer } from './TransactionNormalizer';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

export class SyntheticBatchLoader {
  private normalizer = new TransactionNormalizer();

  async loadFromFile(filePath?: string): Promise<{ batchRunId: string; count: number }> {
    const path = filePath ?? resolve(__dirname, '../../prisma/seed/syntheticBatch.json');
    const raw = JSON.parse(readFileSync(path, 'utf-8')) as Record<string, unknown>[];
    return this.loadRecords(raw, path);
  }

  async loadRecords(records: Record<string, unknown>[], sourceFile = 'inline'): Promise<{ batchRunId: string; count: number }> {
    const batchRun = await prisma.batchRun.create({
      data: { recordCount: records.length, sourceFile, status: 'running' },
    });

    let count = 0;
    for (const record of records) {
      const normalized = this.normalizer.normalize(record);
      await this.upsertTransaction(normalized);
      count++;
    }

    await prisma.batchRun.update({
      where: { id: batchRun.id },
      data: { status: 'completed', completedAt: new Date(), recordCount: count },
    });

    return { batchRunId: batchRun.id, count };
  }

  private async upsertTransaction(txn: ReturnType<TransactionNormalizer['normalize']>) {
    const data = this.normalizer.toPrismaData(txn);
    await prisma.customer.upsert({
      where: { id: txn.customerId },
      create: { id: txn.customerId, optedOut: txn.customerOptedOut ?? false },
      update: { optedOut: txn.customerOptedOut ?? false },
    });
    const existing = await prisma.transaction.findUnique({ where: { id: txn.id } });
    if (existing?.processed) {
      return;
    }
    await prisma.transaction.upsert({
      where: { id: txn.id },
      create: data,
      update: { ...data, processed: false },
    });
  }

  getDemoScenarioIds(): string[] {
    return Object.values(DEMO_SCENARIO_IDS);
  }
}

export const syntheticBatchLoader = new SyntheticBatchLoader();
