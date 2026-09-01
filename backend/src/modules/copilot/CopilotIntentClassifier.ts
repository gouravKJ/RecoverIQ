import type { CopilotIntent } from './types';

export class CopilotIntentClassifier {
  classify(message: string, contextTxnId?: string): { intent: CopilotIntent; extractedTxnId?: string } {
    const text = message.toLowerCase();

    // 1. Extract transaction ID via regex pattern
    const txnMatch = message.match(/txn_[a-zA-Z0-9_]+/i);
    const extractedTxnId = txnMatch ? txnMatch[0] : contextTxnId;

    // 2. Specific Analytical Intent Matching (Highest Priority)
    if (
      text.includes('recover') ||
      text.includes('revenue recover') ||
      text.includes('recovery kitni') ||
      text.includes('paisa recover')
    ) {
      return { intent: 'REVENUE_RECOVERED', extractedTxnId };
    }

    if (
      text.includes('sabse bada loss') ||
      text.includes('bada loss') ||
      text.includes('biggest loss') ||
      text.includes('most common failure') ||
      text.includes('failure causes the most') ||
      text.includes('highest revenue leakage cause') ||
      text.includes('kis karan hua') ||
      text.includes('kis waja se')
    ) {
      return { intent: 'TOP_FAILURE_REASON', extractedTxnId };
    }

    if (
      text.includes('payment method') ||
      text.includes('upi ya card') ||
      text.includes('upi vs card') ||
      text.includes('kis payment method') ||
      text.includes('failing the most') ||
      text.includes('card vs upi')
    ) {
      return { intent: 'TOP_PAYMENT_METHOD_FAILURE', extractedTxnId };
    }

    if (
      text.includes('risk mein') ||
      text.includes('revenue is at risk') ||
      text.includes('revenue at risk') ||
      text.includes('total leakage') ||
      text.includes('losing the most revenue') ||
      text.includes('losing revenue') ||
      text.includes('losing money') ||
      text.includes('paisa lose hone')
    ) {
      return { intent: 'REVENUE_AT_RISK', extractedTxnId };
    }

    if (
      text.includes('customers are affected') ||
      text.includes('customers sabse zyada impact') ||
      text.includes('highest failure rate customer') ||
      text.includes('customer impact')
    ) {
      return { intent: 'TOP_CUSTOMER_IMPACT', extractedTxnId };
    }

    if (
      text.includes('recovery rate kya') ||
      text.includes('how effective is recoveriq') ||
      text.includes('recovery performance') ||
      text.includes('interventions working')
    ) {
      return { intent: 'RECOVERY_PERFORMANCE', extractedTxnId };
    }

    if (
      text.includes('action works best') ||
      text.includes('retry kitna successful') ||
      text.includes('intervention recovered the most') ||
      text.includes('retry vs reminder') ||
      text.includes('kaunsa action sabse effective')
    ) {
      return { intent: 'RECOVERY_ACTION_PERFORMANCE', extractedTxnId };
    }

    if (
      text.includes('pattern') ||
      text.includes('cluster') ||
      text.includes('spike') ||
      text.includes('failure pattern')
    ) {
      return { intent: 'FAILURE_PATTERNS', extractedTxnId };
    }

    if (
      text.includes('policy') ||
      text.includes('block') ||
      text.includes('constitution') ||
      text.includes('discount blocked') ||
      text.includes('why was discount')
    ) {
      return { intent: 'POLICY_EXPLANATION', extractedTxnId };
    }

    if (
      text.includes('customer') ||
      text.includes('ltv') ||
      text.includes('churn') ||
      text.includes('history kya')
    ) {
      return { intent: 'CUSTOMER_EXPLANATION', extractedTxnId };
    }

    if (
      text.includes('status') ||
      text.includes('online') ||
      text.includes('health') ||
      text.includes('system working')
    ) {
      return { intent: 'SYSTEM_STATUS', extractedTxnId };
    }

    if (
      text.includes('summary') ||
      text.includes('today recovery') ||
      text.includes('batch summary')
    ) {
      return { intent: 'RECOVERY_SUMMARY', extractedTxnId };
    }

    if (
      text.includes('why retry') ||
      text.includes('why choose retry') ||
      text.includes('why do nothing') ||
      text.includes('ev highest') ||
      text.includes('expected value') ||
      text.includes('decision') ||
      text.includes('retry kyun') ||
      text.includes('select kyun')
    ) {
      return { intent: 'DECISION_EXPLANATION', extractedTxnId };
    }

    if (extractedTxnId || text.includes('this transaction') || text.includes('ye payment') || text.includes('fail kyun')) {
      return { intent: 'TRANSACTION_EXPLANATION', extractedTxnId };
    }

    if (text.includes('compare') || text.includes('vs')) {
      return { intent: 'COMPARE_TRANSACTIONS', extractedTxnId };
    }

    if (text.includes('what is recoveriq') || text.includes('how does recoveriq work') || text.includes('help')) {
      return { intent: 'GENERAL_RECOVERIQ_QUESTION', extractedTxnId };
    }

    return { intent: 'UNKNOWN', extractedTxnId };
  }
}

export const copilotIntentClassifier = new CopilotIntentClassifier();
