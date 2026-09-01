import { PrismaClient } from '@prisma/client';
import { DEMO_SCENARIO_IDS } from '@recoveriq/shared';

const prisma = new PrismaClient();

async function main() {
  for (const [name, id] of Object.entries(DEMO_SCENARIO_IDS)) {
    const t = await prisma.transaction.findUnique({
      where: { id },
      include: {
        recoveryDecision: {
          include: { policyDecision: true, executions: true },
        },
        recoveryOutcome: true,
      },
    });
    console.log(name, {
      id,
      status: t?.status,
      selected: t?.recoveryDecision?.selectedAction,
      policy: t?.recoveryDecision?.policyDecision?.result,
      outcome: t?.recoveryOutcome?.finalStatus,
      executions: t?.recoveryDecision?.executions?.length ?? 0,
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
