import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import express from 'express';
import request from 'supertest';
import { webhooksRouter } from '../../src/api/routes/index';

function sign(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex');
}

describe('Webhook signature validation', () => {
  const secret = 'test_webhook_secret';
  const app = express();
  app.use('/api/v1/webhooks', webhooksRouter);

  it('rejects invalid signature when secret configured', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      id: 'evt_test_1',
      event: 'payment.failed',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: 'pay_test_1',
            amount: 10000,
            currency: 'INR',
            status: 'failed',
            method: 'upi',
            error_code: 'GATEWAY_ERROR',
            error_description: 'timeout',
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    });

    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', 'invalid')
      .send(body);

    expect(res.status).toBe(400);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });

  it('accepts valid signature', async () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = secret;
    const body = JSON.stringify({
      id: 'evt_test_2',
      event: 'payment.failed',
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: 'pay_test_2',
            amount: 10000,
            currency: 'INR',
            status: 'failed',
            method: 'upi',
            error_code: 'GATEWAY_ERROR',
            error_description: 'timeout',
            created_at: Math.floor(Date.now() / 1000),
          },
        },
      },
    });

    const res = await request(app)
      .post('/api/v1/webhooks/razorpay')
      .set('Content-Type', 'application/json')
      .set('X-Razorpay-Signature', sign(body, secret))
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    delete process.env.RAZORPAY_WEBHOOK_SECRET;
  });
});
