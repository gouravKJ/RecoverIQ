import { z } from 'zod';

export const failureAnalysisSchema = z.object({
  primaryCause: z.enum([
    'temporary_bank_issue',
    'insufficient_funds',
    'mandate_expired',
    'network_timeout',
    'suspected_abandonment',
    'repeated_failure',
    'unknown',
  ]),
  confidence: z.number().min(0).max(1),
  signals: z.array(z.string()),
  explanation: z.string(),
  recommendedRecoveryContext: z.string(),
});

export const customerIntelligenceSchema = z.object({
  customerSegment: z.string(),
  behaviorSummary: z.string(),
  recoveryContext: z.string(),
  riskSignals: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const recoveryStrategySchema = z.object({
  recommendation: z.enum([
    'retry',
    'send_reminder',
    'offer_discount',
    'escalate_human',
    'do_nothing',
  ]),
  reasoning: z.string(),
  supportingSignals: z.array(z.string()),
  confidence: z.number().min(0).max(1),
});

export const patternDetectionSchema = z.object({
  patterns: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
      supportingMetrics: z.array(z.string()),
    })
  ),
});

export const decisionExplanationSchema = z.object({
  summary: z.string(),
  whySelected: z.string(),
  whyAlternativesWereRejected: z.array(z.string()),
  policyExplanation: z.string(),
  riskExplanation: z.string(),
});
