import { PrismaClient } from '@prisma/client';
import { executeTaskRedistribution } from '../intelligence/redistribution-engine/index.js';
import { evaluateHistoricalOutcomes } from '../intelligence/feedback-engine/index.js';

const prisma = new PrismaClient();

async function runTest() {
  console.log('=== SCPGMS END-TO-END DEMO TEST ===');

  // 1. Fetch Manager User
  const manager = await prisma.user.findFirst({ where: { role: 'MANAGER' } });

  // 2. Fetch Pending Recommendation
  const rec = await prisma.recommendation.findFirst({
    where: { status: 'PENDING' },
    include: {
      task: true,
      targetEmployee: true
    }
  });

  if (!rec) {
    console.error('No pending recommendation found!');
    process.exit(1);
  }

  console.log(`Found pending recommendation ID: ${rec.id}`);
  console.log(`Task: ${rec.task?.title}`);
  console.log(`Reassigning to: ${rec.targetEmployee?.name}`);

  // 3. Execute Task Redistribution
  const result = await executeTaskRedistribution(prisma, rec.id, manager.id);
  console.log('Redistribution Executed Successfully!');
  console.log('Previous State:', result.previousState);
  console.log('New State:', result.newState);
  console.log('Outcome Result:', result.outcome);

  // 4. Verify Feedback Summary
  const summary = await evaluateHistoricalOutcomes(prisma);
  console.log('Feedback Summary:', summary);

  console.log('=== TEST COMPLETED CLEANLY! ===');
}

runTest()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
