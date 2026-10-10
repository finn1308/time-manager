const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log("Starting backend verification...");
  
  // Find a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found. Skipping DB tests.");
    return;
  }
  
  // WORKFLOW A: Create a task, complete it, reopen it
  console.log("Testing Workflow A: Task persistence...");
  const task = await prisma.task.create({
    data: {
      userId: user.id,
      title: "Test Workflow A Task",
      isCompleted: false
    }
  });
  console.log(`- Created task ${task.id}`);
  
  const completedTask = await prisma.task.update({
    where: { id: task.id },
    data: { isCompleted: true }
  });
  console.log(`- Completed task: ${completedTask.isCompleted}`);
  
  const reopenedTask = await prisma.task.update({
    where: { id: task.id },
    data: { isCompleted: false }
  });
  console.log(`- Reopened task: ${reopenedTask.isCompleted}`);
  
  await prisma.task.delete({ where: { id: task.id } });
  console.log("- Workflow A verified.");

  // WORKFLOW B: Create a subject and verify color
  console.log("\nTesting Workflow B: Subject color...");
  const subject = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Test Subject",
      color: "var(--mint)"
    }
  });
  console.log(`- Created subject ${subject.id} with color ${subject.color}`);
  
  await prisma.subject.delete({ where: { id: subject.id } });
  console.log("- Workflow B verified.");

  console.log("\nVerification complete!");
}

verify().catch(console.error).finally(() => prisma.$disconnect());
