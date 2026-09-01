import { execSync } from 'child_process';
import { resolve } from 'path';
import { prisma } from '../../src/lib/prisma';
import { RecoveryConstitution } from '../../src/policy/RecoveryConstitution';
import { syntheticBatchLoader } from '../../src/ingestion/SyntheticBatchLoader';
import { revenueRiskEngine } from '../../src/engines/RevenueRiskEngine';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

async function resetDemoScenarios() {
  const demoIds = Object.values(DEMO_SCENARIO_IDS);
  for (const id of demoIds) {
    const decision = await prisma.recoveryDecision.findUnique({ where: { transactionId: id } });
    if (decision) {
      await prisma.execution.deleteMany({ where: { decisionId: decision.id } });
      await prisma.policyDecision.deleteMany({ where: { decisionId: decision.id } });
      await prisma.candidateAction.deleteMany({ where: { decisionId: decision.id } });
      await prisma.recoveryDecision.delete({ where: { id: decision.id } });
    }
    await prisma.recoveryOutcome.deleteMany({ where: { transactionId: id } });
    await prisma.diagnosis.deleteMany({ where: { transactionId: id } });
    await prisma.riskRecord.deleteMany({ where: { transactionId: id } });
    await prisma.auditEvent.deleteMany({ where: { transactionId: id } });
    await prisma.transaction.update({
      where: { id },
      data: { status: 'failed', processed: false },
    });
  }
}

async function main() {
  execSync('npx tsx prisma/seed/generateBatch.ts', {
    cwd: resolve(__dirname, '../..'),
    stdio: 'inherit',
  });

  const constitution = new RecoveryConstitution();
  await constitution.ensureDefault();

  console.log('Loading synthetic batch...');
  const { count } = await syntheticBatchLoader.loadFromFile();
  console.log(`Loaded ${count} transactions`);

  console.log('Resetting demo scenarios for deterministic outcomes...');
  await resetDemoScenarios();

  console.log('Processing batch through recovery pipeline...');
  const { processed, errors } = await revenueRiskEngine.processBatch(200);
  console.log(`Processed ${processed} transactions`);
  if (errors.length) {
    console.warn('Errors:', errors.slice(0, 5));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
