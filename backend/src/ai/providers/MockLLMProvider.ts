import type { LLMProvider } from './LLMProvider';
import type { ZodSchema } from 'zod';

export class MockLLMProvider implements LLMProvider {
  name = 'MockLLM';
  model = 'deterministic-fallback';

  isAvailable(): boolean {
    return true;
  }

  async generateStructured<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: unknown
  ): Promise<T> {
    const zodSchema = schema as ZodSchema<T>;
    const sys = (systemPrompt || '').toLowerCase();
    const usr = (userPrompt || '').toLowerCase();

    if (sys.includes('copilot') || usr.includes('user message:')) {
      let intent = 'TRANSACTION_EXPLANATION';
      let msg =
        'Is transaction mein failure temporary bank issue jaisa identify hua tha. Customer ka previous success rate strong tha, isliye AI ne retry recommend kiya. Final decision Expected Value Engine ne liya because retry ka EV sabse high tha.';
      let facts: Array<{ label: string; value: string | number }> = [
        { label: 'Transaction ID', value: 'txn_demo_s1_retry_success' },
        { label: 'Root Cause', value: 'TEMPORARY BANK ISSUE' },
        { label: 'AI Recommendation', value: 'RETRY' },
        { label: 'Final Decision', value: 'RETRY' },
      ];

      if (usr.includes('sabse bada loss') || usr.includes('top_failure_reason') || usr.includes('kis karan hua')) {
        intent = 'TOP_FAILURE_REASON';
        msg =
          'Sabse bada revenue loss insufficient funds failures ki wajah se hua. Is category mein ₹42.5L ka failed transaction value hai across 318 transactions, jo total failed revenue ka 27.4% hai.';
        facts = [
          { label: 'Top Failure Cause', value: 'INSUFFICIENT FUNDS' },
          { label: 'Failed Revenue', value: '₹42.5L' },
          { label: 'Failed Transactions', value: '318' },
          { label: 'Share of Revenue Loss', value: '27.4%' },
        ];
      } else if (usr.includes('payment method') || usr.includes('top_payment_method_failure') || usr.includes('upi ya card')) {
        intent = 'TOP_PAYMENT_METHOD_FAILURE';
        msg =
          'Sabse zyada failures UPI payment method mein dekhe gaye hain across 412 transactions representing ₹31.8L of revenue at risk.';
        facts = [
          { label: 'Highest Failing Payment Method', value: 'UPI' },
          { label: 'Method Loss Amount', value: '₹31.8L' },
          { label: 'Failure Count', value: '412' },
        ];
      } else if (usr.includes('revenue recover') || usr.includes('revenue_recovered') || usr.includes('kitna revenue recover') || usr.includes('last 7 days')) {
        intent = 'REVENUE_RECOVERED';
        msg =
          'RecoverIQ database metrics ke mutabiq, Total Revenue Recovered ₹5.7L hai across 485 recovered transactions (Recovery Success Rate: 86.4%).';
        facts = [
          { label: 'Total Revenue Recovered', value: '₹5.7L' },
          { label: 'Recovered Transactions', value: '485' },
          { label: 'Recovery Success Rate', value: '86.4%' },
          { label: 'Time Period', value: usr.includes('7 days') ? 'Last 7 Days' : 'All Time' },
        ];
      } else if (usr.includes('revenue_at_risk') || usr.includes('risk mein hai') || usr.includes('total leakage')) {
        intent = 'REVENUE_AT_RISK';
        msg =
          'Total Revenue at Risk ₹6.6L hai across 562 failed transactions affecting 420 customers.';
        facts = [
          { label: 'Total Revenue at Risk', value: '₹6.6L' },
          { label: 'At-Risk Transactions', value: '562' },
          { label: 'Affected Customers', value: '420' },
        ];
      } else if (usr.includes('retry vs reminder') || usr.includes('recovery_action_performance') || usr.includes('action works best')) {
        intent = 'RECOVERY_ACTION_PERFORMANCE';
        msg =
          'Auto Retry sabse effective action raha hai with an 88.5% recovery success rate across 320 executions, followed by Smart Reminders.';
        facts = [
          { label: 'Best Performing Action', value: 'AUTO RETRY' },
          { label: 'Retry Executions', value: '320' },
          { label: 'Retry Recovery Rate', value: '88.5%' },
        ];
      } else if (usr.includes('pattern') || usr.includes('failure_patterns')) {
        intent = 'FAILURE_PATTERNS';
        msg =
          'Sabse prominent failure pattern UPI payment timeouts hai jo peak evening hours mein occur hota hai.';
        facts = [
          { label: 'Primary Pattern', value: 'UPI Evening Timeout Cluster' },
          { label: 'Severity', value: 'HIGH' },
        ];
      } else if (usr.includes('policy') || usr.includes('policy_explanation') || usr.includes('discount')) {
        intent = 'POLICY_EXPLANATION';
        msg =
          'AI agent ne 10% discount recommend kiya tha, lekin Merchant Recovery Constitution maximum discount cap 5% allow karta hai. Expected Value Engine ne action calculate karne ke baad Policy Gate ne action BLOCK kar diya.';
        facts = [
          { label: 'AI Recommendation', value: '10% DISCOUNT' },
          { label: 'Merchant Policy Limit', value: '5% MAX DISCOUNT' },
          { label: 'PolicyGate Result', value: 'BLOCK' },
        ];
      }

      const mock = {
        intent,
        message: msg,
        sources: ['Database Analytics'],
        dataSource: 'Database Analytics',
        facts,
        structuredData: {
          transactionId: 'txn_demo_s1_retry_success',
          cause: 'temporary_bank_issue',
          aiRecommendation: 'retry',
          expectedValue: '₹4,500',
          finalDecision: 'retry',
          policyResult: 'PASS',
          executionMode: 'DEMO',
        },
        suggestedNavigation: [{ label: 'View Transaction', url: '/transactions/txn_demo_s1_retry_success' }],
      };
      return zodSchema.parse(mock);
    }

    if (sys.includes('explanation') || sys.includes('explain') || usr.includes('whyselected') || usr.includes('completed decision')) {
      const mock = {
        summary: 'Deterministic decision completed with financial governance check.',
        whySelected: 'Winning action was selected by Expected Value Engine optimization.',
        whyAlternativesWereRejected: [
          'Alternative actions produced lower net Expected Value after friction and intervention costs.',
        ],
        policyExplanation: 'Merchant Recovery Constitution rules evaluated and verified.',
        riskExplanation: 'Risk bounds respected with full audit trail logging.',
      };
      return zodSchema.parse(mock);
    }

    if (sys.includes('pattern') || usr.includes('pattern') || usr.includes('batch metrics')) {
      const mock = {
        patterns: [
          {
            title: 'UPI Payment Timeout Cluster',
            description: 'Elevated rate of UPI timeouts observed during peak evening hours.',
            severity: 'medium' as const,
            supportingMetrics: ['18 UPI timeout records', 'Avg response latency > 4.5s'],
          },
          {
            title: 'High Value Card Decline Spike',
            description: 'Card transactions above ₹10,000 experiencing bank authorization holds.',
            severity: 'high' as const,
            supportingMetrics: ['12 high-value decline events'],
          },
        ],
      };
      return zodSchema.parse(mock);
    }

    if (sys.includes('failure analysis') || usr.includes('primarycause')) {
      let cause = 'temporary_bank_issue';
      if (usr.includes('network_timeout')) cause = 'network_timeout';
      else if (usr.includes('insufficient_funds')) cause = 'insufficient_funds';
      else if (usr.includes('mandate_expired')) cause = 'mandate_expired';
      else if (usr.includes('timeout') || usr.includes('gateway')) cause = 'network_timeout';

      const mock = {
        primaryCause: cause,
        confidence: 0.92,
        signals: ['Bank gateway response code', 'Transaction timeout signal'],
        explanation: `Deterministic classifier identified cause as ${cause}. AI analysis supports this diagnosis.`,
        recommendedRecoveryContext: 'Standard retry window candidate.',
      };
      return zodSchema.parse(mock);
    }

    if (sys.includes('customer behavior') || usr.includes('customersegment')) {
      const isZeroHistory = usr.includes('"successrate":0') || usr.includes('"successfultransactions":0');
      const mock = {
        customerSegment: isZeroHistory ? 'New / Low-History Customer' : 'Standard Active Customer',
        behaviorSummary: isZeroHistory
          ? 'Customer has no prior successful transactions recorded in database.'
          : 'Customer has history of successful recurring payments verified in database.',
        recoveryContext: isZeroHistory ? 'Higher churn risk profile.' : 'Low churn risk profile.',
        riskSignals: ['Recent transaction failure'],
        confidence: 0.88,
      };
      return zodSchema.parse(mock);
    }

    if (sys.includes('recommendation') || sys.includes('recovery strategy') || usr.includes('recommendation')) {
      let rec = 'retry';
      if (usr.includes('insufficient_funds')) rec = 'offer_discount';
      else if (usr.includes('policy_block')) rec = 'offer_discount';
      else if (usr.includes('do_nothing')) rec = 'do_nothing';

      const mock = {
        recommendation: rec,
        reasoning: `Recommended ${rec} based on deterministic signal heuristics.`,
        supportingSignals: ['High historical customer value', 'Temporary failure classification'],
        confidence: 0.89,
      };
      return zodSchema.parse(mock);
    }

    // Default Fallback
    const mock = {
      summary: 'Deterministic analysis completed.',
      whySelected: 'Winning action selected by Expected Value Engine.',
      whyAlternativesWereRejected: ['Suboptimal Expected Value'],
      policyExplanation: 'Merchant Recovery Constitution rules verified.',
      riskExplanation: 'Governance constraints enforced.',
    };

    return zodSchema.parse(mock);
  }
}
