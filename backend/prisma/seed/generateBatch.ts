import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

const failureProfiles = [
  { code: 'GATEWAY_ERROR', desc: 'Payment gateway timeout during UPI processing', method: 'upi' },
  { code: 'BAD_REQUEST_ERROR', desc: 'Payment processing failed due to timeout', method: 'upi' },
  { code: 'INSUFFICIENT_FUNDS', desc: 'Insufficient funds in customer account', method: 'card' },
  { code: 'BAD_REQUEST_ERROR', desc: 'Card declined by issuing bank', method: 'card' },
  { code: 'MANDATE_EXPIRED', desc: 'Subscription mandate expired', method: 'card' },
  { code: 'BAD_REQUEST_ERROR', desc: 'UPI payment declined failure@razorpay', method: 'upi' },
  { code: 'GATEWAY_ERROR', desc: 'Network timeout at payment gateway', method: 'netbanking' },
  { code: 'BAD_REQUEST_ERROR', desc: 'Customer cancelled payment at checkout', method: 'upi' },
  { code: 'INSUFFICIENT_FUNDS', desc: 'Insufficient balance for debit', method: 'upi' },
  { code: 'BAD_REQUEST_ERROR', desc: 'Bank declined transaction temporarily', method: 'card' },
];

const customers = Array.from({ length: 40 }, (_, i) => `C${1000 + i}`);

function generateBatch(): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];
  const baseDate = new Date('2025-08-01T00:00:00Z');

  for (let i = 0; i < 120; i++) {
    const profile = failureProfiles[i % failureProfiles.length];
    const customerId = customers[i % customers.length];
    const isSubscription = i % 7 === 0;
    const amount =
      i % 11 === 0 ? 2500000 : i % 5 === 0 ? 49900 : 150000 + (i % 20) * 25000;

    records.push({
      id: `txn_batch_${String(i + 1).padStart(4, '0')}`,
      customerId,
      amount,
      currency: 'INR',
      paymentMethod: profile.method,
      failureReasonCode: profile.code,
      failureDescription: profile.desc,
      timestamp: new Date(baseDate.getTime() + i * 3600000).toISOString(),
      retryCount: i % 9 === 0 ? 2 : i % 4 === 0 ? 1 : 0,
      type: isSubscription ? 'subscription' : 'payment',
      status: 'failed',
      source: 'batch',
    });
  }

  // Historical transactions for Demo Customer C1042 (Scenario 1)
  records.push({
    id: 'txn_hist_c1042_01',
    customerId: 'C1042',
    amount: 749900,
    currency: 'INR',
    paymentMethod: 'upi',
    timestamp: new Date('2025-06-15T10:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });
  records.push({
    id: 'txn_hist_c1042_02',
    customerId: 'C1042',
    amount: 749900,
    currency: 'INR',
    paymentMethod: 'upi',
    timestamp: new Date('2025-07-15T10:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });
  records.push({
    id: 'txn_hist_c1042_03',
    customerId: 'C1042',
    amount: 749900,
    currency: 'INR',
    paymentMethod: 'upi',
    timestamp: new Date('2025-08-01T10:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });

  // Historical transactions for Demo Customer C3010 (Scenario 3)
  records.push({
    id: 'txn_hist_c3010_01',
    customerId: 'C3010',
    amount: 800000,
    currency: 'INR',
    paymentMethod: 'card',
    timestamp: new Date('2025-06-10T12:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });
  records.push({
    id: 'txn_hist_c3010_02',
    customerId: 'C3010',
    amount: 800000,
    currency: 'INR',
    paymentMethod: 'card',
    timestamp: new Date('2025-07-10T12:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });

  // Historical transactions for Demo Customer C4012 (Scenario 4)
  records.push({
    id: 'txn_hist_c4012_01',
    customerId: 'C4012',
    amount: 600000,
    currency: 'INR',
    paymentMethod: 'card',
    timestamp: new Date('2025-06-20T14:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });
  records.push({
    id: 'txn_hist_c4012_02',
    customerId: 'C4012',
    amount: 600000,
    currency: 'INR',
    paymentMethod: 'card',
    timestamp: new Date('2025-07-20T14:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'captured',
    source: 'batch',
  });

  records.push({
    id: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY,
    customerId: 'C1042',
    amount: 749900,
    currency: 'INR',
    paymentMethod: 'upi',
    failureReasonCode: 'GATEWAY_ERROR',
    failureDescription: 'Payment gateway timeout during UPI processing',
    timestamp: new Date('2025-08-20T19:42:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'failed',
    source: 'batch',
    isDemoAnchor: true,
    demoScenario: 'successful_recovery',
  });

  records.push({
    id: DEMO_SCENARIO_IDS.DO_NOTHING,
    customerId: 'C2015',
    amount: 49900,
    currency: 'INR',
    paymentMethod: 'upi',
    failureReasonCode: 'INSUFFICIENT_FUNDS',
    failureDescription: 'Insufficient funds in customer account',
    timestamp: new Date('2025-08-20T14:00:00Z').toISOString(),
    retryCount: 1,
    type: 'payment',
    status: 'failed',
    source: 'batch',
    isDemoAnchor: true,
    demoScenario: 'do_nothing',
  });

  records.push({
    id: DEMO_SCENARIO_IDS.POLICY_BLOCK,
    customerId: 'C3010',
    amount: 800000,
    currency: 'INR',
    paymentMethod: 'card',
    failureReasonCode: 'INSUFFICIENT_FUNDS',
    failureDescription: 'Insufficient funds — discount recovery candidate',
    timestamp: new Date('2025-08-20T16:30:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'failed',
    source: 'batch',
    isDemoAnchor: true,
    demoScenario: 'policy_block',
  });

  records.push({
    id: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE,
    customerId: 'C4012',
    amount: 600000,
    currency: 'INR',
    paymentMethod: 'card',
    failureReasonCode: 'GATEWAY_ERROR',
    failureDescription: 'Temporary bank issue — retry candidate',
    timestamp: new Date('2025-08-20T18:00:00Z').toISOString(),
    retryCount: 0,
    type: 'payment',
    status: 'failed',
    source: 'batch',
    isDemoAnchor: true,
    demoScenario: 'graceful_failure',
  });

  return records;
}

const batch = generateBatch();
const outPath = resolve(__dirname, 'syntheticBatch.json');
writeFileSync(outPath, JSON.stringify(batch, null, 2));
console.log(`Generated ${batch.length} synthetic transactions → ${outPath}`);
