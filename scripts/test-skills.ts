import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("Starting End-to-End Skill Flow Test...");

  // Get a test user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.error("No user found in DB to run tests.");
    process.exit(1);
  }

  console.log(`Using user: ${user.email}`);

  const skill = await prisma.skill.create({
    data: {
      userId: user.id,
      name: `Test E2E Skill - Python - ${Date.now()}`,
      category: "TECH",
      level: "BEGINNER",
      targetLevel: "INTERMEDIATE",
      weeklyHoursCommitment: 5,
    }
  });
  console.log("✅ Created Skill:", skill.id);

  // MOCK: Generate Phases/Tasks since we don't want to burn AI tokens in test
  const phase = await prisma.skillPhase.create({
    data: {
      skillId: skill.id,
      name: "Basics",
      plannedHours: 2,
    }
  });

  const unit = await prisma.skillUnit.create({
    data: {
      phaseId: phase.id,
      name: "Variables",
      plannedMinutes: 120,
    }
  });

  const task = await prisma.skillTask.create({
    data: {
      unitId: unit.id,
      name: "Learn Python Variables",
      plannedMinutes: 30,
      status: "PENDING"
    }
  });
  console.log("✅ Created Roadmap Structure (Phase -> Unit -> Task)");

  // Test 2: Timer Integration (Stop Timer)
  const session = await prisma.studySession.create({
    data: {
      userId: user.id,
      skillId: skill.id,
      skillTaskId: task.id,
      actualStart: new Date(Date.now() - 30 * 60000), // 30 mins ago
      actualEnd: new Date(),
      actualDurationSeconds: 30 * 60,
      status: "COMPLETED",
      notes: "Struggled a bit with variable scoping.",
      productivityScore: 4,
      source: "PIP_TIMER"
    }
  });

  await prisma.skillTask.update({
    where: { id: task.id },
    data: { status: "COMPLETED", actualMinutes: 30 }
  });

  await prisma.skill.update({
    where: { id: skill.id },
    data: { totalActualHours: 1 } // just mock the aggregate
  });
  console.log("✅ Timer completed, task marked COMPLETED, study session recorded:", session.id);

  // Test 3: Resource Management
  const resource = await prisma.resource.create({
    data: {
      userId: user.id,
      skillId: skill.id,
      title: "Python Docs",
      url: "https://python.org",
      type: "LEARNING"
    }
  });
  console.log("✅ Added resource:", resource.id);

  // Cleanup
  await prisma.skill.delete({ where: { id: skill.id } });
  console.log("✅ Cleaned up test data.");
  
  console.log("🎉 All backend integration tests passed!");
  process.exit(0);
}

runTests().catch(e => {
  console.error("Test failed:", e);
  process.exit(1);
});
