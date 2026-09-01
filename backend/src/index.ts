import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { RecoveryConstitution } from './policy/RecoveryConstitution';
import {
  webhooksRouter,
  batchRouter,
  transactionsRouter,
  decisionsRouter,
  policyRouter,
  auditRouter,
  dashboardRouter,
  healthRouter,
  aiRouter,
  copilotRouter,
  recoveryRouter,
} from './api/routes';

(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();

app.use(helmet());
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'] }));
app.use(express.json());

app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/batch', batchRouter);
app.use('/api/v1/transactions', transactionsRouter);
app.use('/api/v1/decisions', decisionsRouter);
app.use('/api/v1/policy', policyRouter);
app.use('/api/v1/audit', auditRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/health', healthRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/copilot', copilotRouter);
app.use('/api/v1/recovery', recoveryRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: { message: err.message } });
});

async function bootstrap() {
  const constitution = new RecoveryConstitution();
  await constitution.ensureDefault();

  app.listen(env.PORT, () => {
    console.log(`RecoverIQ backend running on http://localhost:${env.PORT}`);
  });
}

if (process.env.NODE_ENV !== 'test') {
  bootstrap().catch(console.error);
}

export default app;
