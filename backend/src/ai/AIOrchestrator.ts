import { prisma } from '../lib/prisma';
import { auditTrail } from '../lib/services';
import { aiContextBuilder } from './AIContextBuilder';
import { aiService } from './AIService';
import { aiStatusService } from './AIStatusService';
import { MockLLMProvider } from './providers/MockLLMProvider';
import { FailureAnalysisAgent } from './agents/FailureAnalysisAgent';
import { CustomerIntelligenceAgent } from './agents/CustomerIntelligenceAgent';
import { RecoveryStrategyAgent } from './agents/RecoveryStrategyAgent';
import { PatternDetectionAgent } from './agents/PatternDetectionAgent';
import { DecisionExplanationAgent } from './agents/DecisionExplanationAgent';
import type {
  TransactionAIAnalysisResponse,
  PatternDetectionResult,
} from './types';
import type { Prisma } from '@prisma/client';

export class AIOrchestrator {
  async runPreDecisionPipeline(transactionId: string) {
    const provider = aiService.getProvider();
    const isRealLLM = aiService.isUsingRealLLM();
    const mode = isRealLLM ? 'LLM' : 'DETERMINISTIC_FALLBACK';

    const failureAgent = new FailureAnalysisAgent(provider);
    const customerAgent = new CustomerIntelligenceAgent(provider);
    const strategyAgent = new RecoveryStrategyAgent(provider);

    try {
      const context = await aiContextBuilder.buildTransactionContext(transactionId);

      const [failureAnalysis, customerIntel, strategyRec] = await Promise.all([
        failureAgent.analyze(context).catch(async (e) => {
          await auditTrail.log('LLM_FALLBACK', { agent: 'FailureAnalysisAgent', error: String(e) }, transactionId);
          return failureAgent.analyze(context);
        }),
        customerAgent.analyze(context).catch(async (e) => {
          await auditTrail.log('LLM_FALLBACK', { agent: 'CustomerIntelligenceAgent', error: String(e) }, transactionId);
          return customerAgent.analyze(context);
        }),
        strategyAgent.recommend(context).catch(async (e) => {
          await auditTrail.log('LLM_FALLBACK', { agent: 'RecoveryStrategyAgent', error: String(e) }, transactionId);
          return strategyAgent.recommend(context);
        }),
      ]);

      // Save analyses in LLMAnalysis DB table
      await Promise.all([
        prisma.lLMAnalysis.create({
          data: {
            transactionId,
            analysisType: 'FAILURE_ANALYSIS',
            provider: provider.name,
            model: provider.model,
            outputJson: failureAnalysis as unknown as Prisma.InputJsonValue,
            confidence: failureAnalysis.confidence,
          },
        }),
        prisma.lLMAnalysis.create({
          data: {
            transactionId,
            analysisType: 'CUSTOMER_INTELLIGENCE',
            provider: provider.name,
            model: provider.model,
            outputJson: customerIntel as unknown as Prisma.InputJsonValue,
            confidence: customerIntel.confidence,
          },
        }),
        prisma.lLMAnalysis.create({
          data: {
            transactionId,
            analysisType: 'RECOVERY_RECOMMENDATION',
            provider: provider.name,
            model: provider.model,
            outputJson: strategyRec as unknown as Prisma.InputJsonValue,
            confidence: strategyRec.confidence,
          },
        }),
      ]);

      // Audit events
      await auditTrail.log(
        'LLM_FAILURE_ANALYSIS',
        { ...failureAnalysis, provider: provider.name, model: provider.model, mode },
        transactionId
      );
      await auditTrail.log(
        'LLM_CUSTOMER_ANALYSIS',
        { ...customerIntel, provider: provider.name, model: provider.model, mode },
        transactionId
      );
      await auditTrail.log(
        'LLM_RECOVERY_RECOMMENDATION',
        { ...strategyRec, provider: provider.name, model: provider.model, mode },
        transactionId
      );

      return { failureAnalysis, customerIntel, strategyRec };
    } catch (err) {
      await auditTrail.log(
        'LLM_FALLBACK',
        { error: err instanceof Error ? err.message : 'Unknown AI pipeline error' },
        transactionId
      );
      return null;
    }
  }

  async runPostDecisionExplanation(transactionId: string) {
    const provider = aiService.getProvider();
    const isRealLLM = aiService.isUsingRealLLM();
    const mode = isRealLLM ? 'LLM' : 'DETERMINISTIC_FALLBACK';
    const explanationAgent = new DecisionExplanationAgent(provider);

    try {
      const context = await aiContextBuilder.buildTransactionContext(transactionId);
      const explanation = await explanationAgent.explain(context);

      await prisma.lLMAnalysis.create({
        data: {
          transactionId,
          analysisType: 'DECISION_EXPLANATION',
          provider: provider.name,
          model: provider.model,
          outputJson: explanation as unknown as Prisma.InputJsonValue,
          confidence: 0.95,
        },
      });

      await auditTrail.log(
        'LLM_DECISION_EXPLANATION',
        { ...explanation, provider: provider.name, model: provider.model, mode },
        transactionId
      );

      return explanation;
    } catch (err) {
      await auditTrail.log(
        'LLM_FALLBACK',
        { error: err instanceof Error ? err.message : 'Explanation generation failed' },
        transactionId
      );
      return null;
    }
  }

  async getBatchPatternInsights(): Promise<PatternDetectionResult> {
    const provider = aiService.getProvider();
    const patternAgent = new PatternDetectionAgent(provider);

    try {
      const context = await aiContextBuilder.buildBatchMetricsContext();
      const result = await patternAgent.detectPatterns(context);

      await prisma.lLMAnalysis.create({
        data: {
          analysisType: 'PATTERN_DETECTION',
          provider: provider.name,
          model: provider.model,
          outputJson: result as unknown as Prisma.InputJsonValue,
          confidence: 0.9,
        },
      });

      await auditTrail.log('LLM_PATTERN_DETECTION', {
        patternCount: result.patterns.length,
        provider: provider.name,
        model: provider.model,
      });

      return result;
    } catch (err) {
      const fallback = new PatternDetectionAgent(new MockLLMProvider());
      const context = await aiContextBuilder.buildBatchMetricsContext();
      return fallback.detectPatterns(context);
    }
  }

  async getTransactionAnalysis(transactionId: string): Promise<TransactionAIAnalysisResponse> {
    const status = aiStatusService.getStatus();
    const analyses = await prisma.lLMAnalysis.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'desc' },
    });

    const findType = (type: string) => {
      const record = analyses.find((a) => a.analysisType === type);
      return record ? (record.outputJson as unknown) : undefined;
    };

    let failureAnalysis = findType('FAILURE_ANALYSIS');
    let customerIntelligence = findType('CUSTOMER_INTELLIGENCE');
    let recoveryRecommendation = findType('RECOVERY_RECOMMENDATION');
    let decisionExplanation = findType('DECISION_EXPLANATION');

    // If missing from DB, run analysis live
    if (!failureAnalysis || !customerIntelligence || !recoveryRecommendation) {
      const live = await this.runPreDecisionPipeline(transactionId);
      if (live) {
        failureAnalysis = live.failureAnalysis;
        customerIntelligence = live.customerIntel;
        recoveryRecommendation = live.strategyRec;
      }
    }

    if (!decisionExplanation) {
      const liveExp = await this.runPostDecisionExplanation(transactionId);
      if (liveExp) decisionExplanation = liveExp;
    }

    return {
      transactionId,
      aiMode: status.mode,
      provider: status.provider,
      model: status.model,
      failureAnalysis: failureAnalysis as any,
      customerIntelligence: customerIntelligence as any,
      recoveryRecommendation: recoveryRecommendation as any,
      decisionExplanation: decisionExplanation as any,
    };
  }
}

export const aiOrchestrator = new AIOrchestrator();
