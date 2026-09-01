import { describe, it, expect } from 'vitest';
import { RootCauseClassifier } from '../../src/engines/RootCauseClassifier';

describe('RootCauseClassifier', () => {
  const classifier = new RootCauseClassifier();

  it('classifies network timeout', () => {
    const result = classifier.classify({
      failureReasonCode: 'GATEWAY_ERROR',
      failureDescription: 'Payment gateway timeout',
      retryCount: 0,
      paymentMethod: 'upi',
    });
    expect(result.cause).toBe('network_timeout');
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.label).toBe('Rule-Based Root Cause Classification');
  });

  it('classifies insufficient funds', () => {
    const result = classifier.classify({
      failureReasonCode: 'INSUFFICIENT_FUNDS',
      failureDescription: 'Insufficient balance',
      retryCount: 0,
      paymentMethod: 'card',
    });
    expect(result.cause).toBe('insufficient_funds');
  });

  it('classifies repeated failure', () => {
    const result = classifier.classify(
      { failureReasonCode: 'BAD_REQUEST_ERROR', failureDescription: 'Failed', retryCount: 2, paymentMethod: 'upi' },
      { failedTransactions: 4, previousRetryCount: 3 }
    );
    expect(result.cause).toBe('repeated_failure');
  });
});
