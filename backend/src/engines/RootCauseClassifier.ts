import type { Transaction } from '@prisma/client';
import type { DiagnosisResult, CustomerProfile } from '@recoveriq/shared';
import {
  TIMEOUT_KEYWORDS,
  INSUFFICIENT_FUNDS_KEYWORDS,
  MANDATE_KEYWORDS,
  ABANDONMENT_KEYWORDS,
} from '@recoveriq/shared';

export class RootCauseClassifier {
  classify(
    txn: Pick<
      Transaction,
      'failureReasonCode' | 'failureDescription' | 'retryCount' | 'paymentMethod'
    >,
    customer?: Pick<CustomerProfile, 'failedTransactions' | 'previousRetryCount'>
  ): DiagnosisResult {
    const signals: string[] = [];
    const code = (txn.failureReasonCode || '').toLowerCase();
    const desc = (txn.failureDescription || '').toLowerCase();
    const combined = `${code} ${desc}`;

    if (txn.retryCount >= 2 || (customer?.failedTransactions ?? 0) >= 3) {
      signals.push('multiple prior failures on account');
      signals.push(`retry_count=${txn.retryCount}`);
      return {
        cause: 'repeated_failure',
        confidence: 0.88,
        signals,
        explanation:
          'Multiple prior failures indicate repeated_failure pattern; retry effectiveness is diminished.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    if (this.matches(combined, TIMEOUT_KEYWORDS) || code.includes('timeout') || code.includes('gateway')) {
      signals.push('timeout or gateway error code');
      if (txn.retryCount === 0) signals.push('no previous balance failures');
      return {
        cause: 'network_timeout',
        confidence: 0.91,
        signals,
        explanation:
          'Explicit timeout signal strongly indicates temporary network/payment gateway degradation.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    if (this.matches(combined, INSUFFICIENT_FUNDS_KEYWORDS)) {
      signals.push('insufficient funds error');
      return {
        cause: 'insufficient_funds',
        confidence: 0.93,
        signals,
        explanation: 'Explicit insufficient funds signal from payment processor.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    if (this.matches(combined, MANDATE_KEYWORDS)) {
      signals.push('mandate expired or revoked');
      return {
        cause: 'mandate_expired',
        confidence: 0.9,
        signals,
        explanation: 'Mandate-related failure indicates subscription authorization issue.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    if (this.matches(combined, ABANDONMENT_KEYWORDS)) {
      signals.push('payment cancelled by user');
      return {
        cause: 'suspected_abandonment',
        confidence: 0.72,
        signals,
        explanation: 'Behavioural inference suggests customer abandoned checkout.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    if (code.includes('bank') || desc.includes('decline')) {
      signals.push('bank decline code');
      return {
        cause: 'temporary_bank_issue',
        confidence: 0.85,
        signals,
        explanation: 'Bank decline may be temporary; retry could succeed after issuer recovery.',
        label: 'Rule-Based Root Cause Classification',
      };
    }

    signals.push('no strong explicit signal');
    return {
      cause: 'unknown',
      confidence: 0.45,
      signals,
      explanation: 'Insufficient explicit signals; classified as unknown with lower confidence.',
      label: 'Rule-Based Root Cause Classification',
    };
  }

  private matches(text: string, keywords: string[]): boolean {
    return keywords.some((k) => text.includes(k));
  }
}
