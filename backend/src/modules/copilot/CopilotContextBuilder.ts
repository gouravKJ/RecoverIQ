import { prisma } from '../../lib/prisma';
import { dashboardAggregator } from '../../dashboard/DashboardAggregator';
import { aiOrchestrator } from '../../ai/AIOrchestrator';
import { RecoveryConstitution } from '../../policy/RecoveryConstitution';
import { copilotAnalyticsService, parseDateFilter } from './CopilotAnalyticsService';
import type { ChatMessageMemory, CopilotFact } from './types';

function serializeBigInt(obj: unknown): unknown {
  return JSON.parse(
    JSON.stringify(obj, (_k, v) => (typeof v === 'bigint' ? Number(v) : v))
  );
}

// In-memory conversation store (10 messages max per conversationId)
const conversationMemoryStore = new Map<string, ChatMessageMemory[]>();

export class CopilotContextBuilder {
  getMemory(conversationId?: string): ChatMessageMemory[] {
    if (!conversationId) return [];
    return conversationMemoryStore.get(conversationId) || [];
  }

  saveMemory(
    conversationId: string,
    userMsg: string,
    assistantMsg: string,
    intent?: string,
    transactionId?: string,
    facts?: CopilotFact[]
  ) {
    if (!conversationId) return;
    const history = conversationMemoryStore.get(conversationId) || [];
    const timestamp = new Date().toISOString();

    history.push({ role: 'user', content: userMsg, timestamp });
    history.push({
      role: 'assistant',
      content: assistantMsg,
      intent: intent as any,
      transactionId,
      facts,
      timestamp,
    });

    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    conversationMemoryStore.set(conversationId, history);
  }

  getLastTransactionIdFromMemory(conversationId?: string): string | undefined {
    if (!conversationId) return undefined;
    const memory = this.getMemory(conversationId);
    for (let i = memory.length - 1; i >= 0; i--) {
      if (memory[i].transactionId) {
        return memory[i].transactionId;
      }
    }
    return undefined;
  }

  async buildContext(message: string, transactionId?: string, intent?: string) {
    const dateRange = parseDateFilter(message);
    const constitution = new RecoveryConstitution();
    const policy = await constitution.getPolicy();

    let analyticalFacts: CopilotFact[] = [];
    let analyticsResult: Record<string, unknown> | null = null;
    let dataSource = 'Database Analytics';

    // Route query intent to CopilotAnalyticsService database analytics
    switch (intent) {
      case 'TOP_FAILURE_REASON': {
        const res = await copilotAnalyticsService.getTopFailureReasons(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'TOP_PAYMENT_METHOD_FAILURE': {
        const res = await copilotAnalyticsService.getTopPaymentMethodFailures(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'REVENUE_RECOVERED': {
        const res = await copilotAnalyticsService.getRevenueRecovered(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'REVENUE_AT_RISK': {
        const res = await copilotAnalyticsService.getRevenueAtRisk(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'TOP_CUSTOMER_IMPACT': {
        const res = await copilotAnalyticsService.getCustomerImpact(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'RECOVERY_PERFORMANCE': {
        const res = await copilotAnalyticsService.getRevenueRecovered(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'RECOVERY_ACTION_PERFORMANCE': {
        const res = await copilotAnalyticsService.getRecoveryActionPerformance(dateRange);
        analyticsResult = res;
        analyticalFacts = res.facts;
        break;
      }
      case 'FAILURE_PATTERNS': {
        const res = await aiOrchestrator.getBatchPatternInsights();
        analyticsResult = serializeBigInt(res) as Record<string, unknown>;
        dataSource = 'Groq AI Pattern Detection';
        break;
      }
      default: {
        const summary = await dashboardAggregator.getSummary();
        const leakage = await dashboardAggregator.getLeakage();
        analyticsResult = { summary: serializeBigInt(summary), leakage: serializeBigInt(leakage) };
      }
    }

    let transactionContext: Record<string, unknown> | null = null;
    let aiTrace: Record<string, unknown> | null = null;

    if (transactionId) {
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

      if (txn) {
        const auditEvents = await prisma.auditEvent.findMany({
          where: { transactionId },
          orderBy: { createdAt: 'desc' },
          take: 8,
        });

        transactionContext = serializeBigInt({
          transaction: txn,
          auditEvents,
        }) as Record<string, unknown>;

        aiTrace = (await aiOrchestrator.getTransactionAnalysis(transactionId)) as unknown as Record<
          string,
          unknown
        >;
      }
    }

    return {
      queryIntent: intent,
      timePeriod: dateRange.label,
      dataSource,
      analyticalFacts,
      analyticsResult,
      merchantPolicy: serializeBigInt(policy),
      transactionContext,
      aiTrace,
    };
  }
}

export const copilotContextBuilder = new CopilotContextBuilder();
