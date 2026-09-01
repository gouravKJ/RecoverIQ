import { z } from 'zod';

export const copilotResponseSchema = z.object({
  intent: z.enum([
    'REVENUE_RECOVERED',
    'REVENUE_AT_RISK',
    'TOP_FAILURE_REASON',
    'TOP_PAYMENT_METHOD_FAILURE',
    'TOP_CUSTOMER_IMPACT',
    'RECOVERY_PERFORMANCE',
    'RECOVERY_ACTION_PERFORMANCE',
    'FAILURE_PATTERNS',
    'TRANSACTION_EXPLANATION',
    'CUSTOMER_EXPLANATION',
    'DECISION_EXPLANATION',
    'POLICY_EXPLANATION',
    'RECOVERY_SUMMARY',
    'BATCH_SUMMARY',
    'SYSTEM_STATUS',
    'COMPARE_TRANSACTIONS',
    'GENERAL_RECOVERIQ_QUESTION',
    'UNKNOWN',
  ]),
  message: z.string(),
  sources: z.array(z.string()),
  dataSource: z.string().optional(),
  facts: z
    .array(
      z.object({
        label: z.string(),
        value: z.union([z.string(), z.number()]),
      })
    )
    .optional(),
  structuredData: z
    .object({
      transactionId: z.string().optional(),
      cause: z.string().optional(),
      aiRecommendation: z.string().optional(),
      expectedValue: z.string().optional(),
      finalDecision: z.string().optional(),
      policyResult: z.string().optional(),
      executionMode: z.string().optional(),
      recoveredAmount: z.string().optional(),
    })
    .optional(),
  suggestedNavigation: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .optional(),
});
