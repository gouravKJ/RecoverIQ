import { describe, it, expect } from 'vitest';
import { copilotIntentClassifier } from '../../src/modules/copilot/CopilotIntentClassifier';
import { copilotContextBuilder } from '../../src/modules/copilot/CopilotContextBuilder';

describe('Copilot Intent Classifier Unit Tests', () => {
  it('classifies transaction explanation intent with extracted ID', () => {
    const res = copilotIntentClassifier.classify('Why did transaction txn_demo_s1_retry_success fail?');
    expect(res.intent).toBe('TRANSACTION_EXPLANATION');
    expect(res.extractedTxnId).toBe('txn_demo_s1_retry_success');
  });

  it('classifies Hinglish questions correctly', () => {
    const res1 = copilotIntentClassifier.classify('Ye transaction retry kyun hua?', 'txn_demo_s1_retry_success');
    expect(['DECISION_EXPLANATION', 'TRANSACTION_EXPLANATION']).toContain(res1.intent);
    expect(res1.extractedTxnId).toBe('txn_demo_s1_retry_success');

    const res2 = copilotIntentClassifier.classify('Kitna revenue recover hua?');
    expect(['REVENUE_RECOVERED', 'RECOVERY_SUMMARY']).toContain(res2.intent);

    const res3 = copilotIntentClassifier.classify('Kaunsa payment method sabse zyada fail ho raha hai?');
    expect(['TOP_PAYMENT_METHOD_FAILURE', 'FAILURE_PATTERNS']).toContain(res3.intent);
  });

  it('classifies top failure reason queries correctly', () => {
    const res = copilotIntentClassifier.classify('sabse bada loss kis karan hua?');
    expect(res.intent).toBe('TOP_FAILURE_REASON');
  });

  it('classifies payment method queries correctly', () => {
    const res = copilotIntentClassifier.classify('Which payment method fails most?');
    expect(res.intent).toBe('TOP_PAYMENT_METHOD_FAILURE');
  });

  it('classifies action performance queries correctly', () => {
    const res = copilotIntentClassifier.classify('retry vs reminder?');
    expect(res.intent).toBe('RECOVERY_ACTION_PERFORMANCE');
  });

  it('classifies policy block & discount queries correctly', () => {
    const res = copilotIntentClassifier.classify('Why was discount blocked?');
    expect(res.intent).toBe('POLICY_EXPLANATION');
  });

  it('classifies revenue risk queries correctly', () => {
    const res = copilotIntentClassifier.classify('Where are we losing the most revenue?');
    expect(['TOP_FAILURE_REASON', 'REVENUE_AT_RISK']).toContain(res.intent);
  });

  it('classifies pattern queries correctly', () => {
    const res = copilotIntentClassifier.classify('What are the biggest failure patterns?');
    expect(res.intent).toBe('FAILURE_PATTERNS');
  });

  it('handles memory persistence across conversation turns', () => {
    const session = 'test_session_123';
    copilotContextBuilder.saveMemory(session, 'Why did this fail?', 'Failure explanation', 'TRANSACTION_EXPLANATION', 'txn_demo_s1_retry_success');

    const memory = copilotContextBuilder.getMemory(session);
    expect(memory.length).toBe(2);

    const lastTxn = copilotContextBuilder.getLastTransactionIdFromMemory(session);
    expect(lastTxn).toBe('txn_demo_s1_retry_success');
  });
});
