import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../src/index';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

describe('Live Recovery Pipeline Trace API Tests', () => {
  it('1. Live recovery endpoint returns 10 structured execution stages for Scenario 1 (Successful Recovery)', async () => {
    const res = await request(app)
      .post('/api/v1/recovery/run')
      .send({ transactionId: DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY, forceReprocess: true })
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.transactionId).toBe(DEMO_SCENARIO_IDS.SUCCESSFUL_RECOVERY);
    expect(res.body.data.normalizedStatus).toBe('RECOVERED');
    expect(res.body.data.stages).toHaveLength(10);

    const detectStage = res.body.data.stages.find((s: any) => s.id === 'DETECT');
    expect(detectStage).toBeDefined();
    expect(detectStage.data.amountFormatted).toBe('₹7,499.00');

    const evStage = res.body.data.stages.find((s: any) => s.id === 'EXPECTED_VALUE');
    expect(evStage).toBeDefined();
    expect(evStage.data.candidates).toHaveLength(5);
    expect(evStage.data.winningAction).toBe('retry');

    const policyStage = res.body.data.stages.find((s: any) => s.id === 'POLICY_GATE');
    expect(policyStage.data.policyResult).toBe('PASS');

    const finalStage = res.body.data.stages.find((s: any) => s.id === 'FINAL_RESULT');
    expect(finalStage.data.normalizedStatus).toBe('RECOVERED');
  });

  it('2. Live recovery endpoint handles Scenario 2 (Do Nothing) without showing FAILED', async () => {
    const res = await request(app)
      .post('/api/v1/recovery/run')
      .send({ transactionId: DEMO_SCENARIO_IDS.DO_NOTHING, forceReprocess: true })
      .expect(200);

    expect(res.body.data.normalizedStatus).toBe('NO_ACTION');
    const finalStage = res.body.data.stages.find((s: any) => s.id === 'FINAL_RESULT');
    expect(finalStage.data.normalizedStatus).toBe('NO_ACTION');
  });

  it('3. Live recovery endpoint handles Scenario 3 (Policy Block) cleanly showing BLOCKED', async () => {
    const res = await request(app)
      .post('/api/v1/recovery/run')
      .send({ transactionId: DEMO_SCENARIO_IDS.POLICY_BLOCK, forceReprocess: true })
      .expect(200);

    expect(res.body.data.normalizedStatus).toBe('BLOCKED');
    const policyStage = res.body.data.stages.find((s: any) => s.id === 'POLICY_GATE');
    expect(policyStage.data.policyResult).toBe('BLOCK');
  });

  it('4. Live recovery endpoint handles Scenario 4 (Graceful Escalation) cleanly showing ESCALATED', async () => {
    const res = await request(app)
      .post('/api/v1/recovery/run')
      .send({ transactionId: DEMO_SCENARIO_IDS.GRACEFUL_FAILURE, forceReprocess: true })
      .expect(200);

    expect(res.body.data.normalizedStatus).toBe('ESCALATED');
  });

  it('5. Live recovery endpoint fails gracefully with 404 for invalid transaction ID', async () => {
    const res = await request(app)
      .post('/api/v1/recovery/run')
      .send({ transactionId: 'invalid_txn_9999' })
      .expect(404);

    expect(res.body.error).toBeDefined();
  });
});
