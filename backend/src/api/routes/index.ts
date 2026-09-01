import { Router, json, raw } from 'express';
import Razorpay from 'razorpay';
import { env } from '../../config/env';
import { prisma } from '../../lib/prisma';
import { syntheticBatchLoader } from '../../ingestion/SyntheticBatchLoader';
import { revenueRiskEngine } from '../../engines/RevenueRiskEngine';
import { dashboardAggregator } from '../../dashboard/DashboardAggregator';
import { auditTrail } from '../../lib/services';
import { PolicyGate } from '../../policy/PolicyGate';
import { razorpayWebhookIngestor } from '../../ingestion/RazorpayWebhookIngestor';
import { aiRouter } from './aiRouter';
import { copilotRouter } from './copilotRouter';
import { recoveryRouter } from './recoveryRouter';
import { z } from 'zod';

export { aiRouter, copilotRouter, recoveryRouter };

const policyGate = new PolicyGate();

export const webhooksRouter = Router();

webhooksRouter.post(
  '/razorpay',
  raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;
      const body = req.body as Buffer;
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET ?? env.RAZORPAY_WEBHOOK_SECRET;

      if (webhookSecret && signature) {
        const valid = Razorpay.validateWebhookSignature(
          body.toString(),
          signature,
          webhookSecret
        );
        if (!valid) {
          return res.status(400).json({ error: { code: 'INVALID_SIGNATURE', message: 'Invalid webhook signature' } });
        }
      }

      const event = JSON.parse(body.toString()) as Record<string, unknown>;

      if (event.created_at) {
        const age = Date.now() / 1000 - Number(event.created_at);
        if (age > env.WEBHOOK_STALE_EVENT_SECONDS) {
          return res.status(200).json({ received: true, stale: true });
        }
      }

      res.status(200).json({ received: true });

      setImmediate(() => {
        razorpayWebhookIngestor.processEvent(event).catch(console.error);
      });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(500).json({ error: { code: 'WEBHOOK_ERROR', message: 'Webhook processing failed' } });
    }
  }
);

export const batchRouter = Router();
batchRouter.use(json());

batchRouter.post('/load', async (_req, res) => {
  try {
    const result = await syntheticBatchLoader.loadFromFile();
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Load failed' } });
  }
});

batchRouter.post('/process', async (req, res) => {
  try {
    const limit = Number(req.body?.limit ?? 500);
    const result = await revenueRiskEngine.processBatch(limit);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Process failed' } });
  }
});

batchRouter.get('/runs', async (_req, res) => {
  const runs = await prisma.batchRun.findMany({ orderBy: { startedAt: 'desc' }, take: 20 });
  res.json({ data: runs });
});

export const transactionsRouter = Router();

transactionsRouter.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { customerId: { contains: search, mode: 'insensitive' } },
      { paymentMethod: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { timestamp: 'desc' },
      include: { recoveryOutcome: true, diagnosis: true },
    }),
    prisma.transaction.count({ where }),
  ]);

  res.json({ data: transactions, meta: { page, limit, total } });
});

transactionsRouter.get('/:id', async (req, res) => {
  let txn = await prisma.transaction.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      diagnosis: true,
      recoveryDecision: {
        include: {
          candidateActions: true,
          policyDecision: true,
          executions: true,
        },
      },
      recoveryOutcome: true,
      riskRecord: true,
    },
  });

  if (!txn) return res.status(404).json({ error: { message: 'Transaction not found' } });

  // Ensure Customer 360 profile is dynamically computed from database records
  if (!txn.customer || txn.customer.totalTransactions === 0) {
    const { CustomerIntelligence } = await import('../../engines/CustomerIntelligence');
    const customerIntel = new CustomerIntelligence();
    await customerIntel.computeForCustomer(txn.customerId);
    txn = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        diagnosis: true,
        recoveryDecision: {
          include: {
            candidateActions: true,
            policyDecision: true,
            executions: true,
          },
        },
        recoveryOutcome: true,
        riskRecord: true,
      },
    });
  }

  const auditEvents = await auditTrail.getByTransaction(req.params.id);

  res.json({ data: { ...txn, auditEvents } });
});

transactionsRouter.post('/:id/reprocess', async (req, res) => {
  try {
    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { processed: false },
    });
    await revenueRiskEngine.run(req.params.id, true);
    const txn = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        recoveryDecision: { include: { candidateActions: true, policyDecision: true, executions: true } },
        recoveryOutcome: true,
        diagnosis: true,
      },
    });
    res.json({ data: txn });
  } catch (err) {
    res.status(500).json({ error: { message: err instanceof Error ? err.message : 'Reprocess failed' } });
  }
});

export const decisionsRouter = Router();

decisionsRouter.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const [decisions, total] = await Promise.all([
    prisma.recoveryDecision.findMany({
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { decidedAt: 'desc' },
      include: {
        candidateActions: true,
        policyDecision: true,
        transaction: { select: { id: true, amount: true, paymentMethod: true, status: true } },
      },
    }),
    prisma.recoveryDecision.count(),
  ]);
  res.json({ data: decisions, meta: { page, limit, total } });
});

decisionsRouter.get('/:id', async (req, res) => {
  const decision = await prisma.recoveryDecision.findUnique({
    where: { id: req.params.id },
    include: {
      candidateActions: true,
      policyDecision: true,
      executions: true,
      transaction: true,
    },
  });
  if (!decision) return res.status(404).json({ error: { message: 'Decision not found' } });
  res.json({ data: decision });
});

export const policyRouter = Router();
policyRouter.use(json());

const policySchema = z.object({
  maxRetries: z.number().int().min(0).optional(),
  maxReminders: z.number().int().min(0).optional(),
  minReminderIntervalMinutes: z.number().int().min(0).optional(),
  maxDiscountPercentage: z.number().min(0).max(100).optional(),
  humanApprovalAbove: z.number().int().min(0).optional(),
  neverContactOptedOut: z.boolean().optional(),
});

policyRouter.get('/', async (_req, res) => {
  const policy = await policyGate.getPolicy();
  res.json({ data: policy });
});

policyRouter.put('/', async (req, res) => {
  try {
    const parsed = policySchema.parse(req.body);
    const updates = {
      ...parsed,
      humanApprovalAbove: parsed.humanApprovalAbove,
    };
    const policy = await policyGate.updatePolicy(updates);
    res.json({ data: policy });
  } catch (err) {
    res.status(400).json({ error: { message: err instanceof Error ? err.message : 'Invalid policy' } });
  }
});

export const auditRouter = Router();

auditRouter.get('/', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 50);
  const eventType = req.query.eventType as string | undefined;
  const result = await auditTrail.getAll(page, limit, eventType);
  res.json({ data: result.events, meta: { page: result.page, limit: result.limit, total: result.total } });
});

auditRouter.get('/transactions/:id', async (req, res) => {
  const events = await auditTrail.getByTransaction(req.params.id);
  res.json({ data: events });
});

export const dashboardRouter = Router();

dashboardRouter.get('/summary', async (_req, res) => {
  const summary = await dashboardAggregator.getSummary();
  res.json({ data: summary });
});

dashboardRouter.get('/leakage', async (_req, res) => {
  const leakage = await dashboardAggregator.getLeakage();
  res.json({ data: leakage });
});

export const healthRouter = Router();
healthRouter.get('/', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ data: { status: 'ok', timestamp: new Date().toISOString() } });
  } catch {
    res.status(503).json({ data: { status: 'degraded', database: false } });
  }
});
