import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst();
  console.log("User:", user?.id);
  const skills = await prisma.skill.findMany({
    where: { userId: user!.id },
    include: {
      phases: true,
    },
    orderBy: { updatedAt: "desc" },
  });
  console.log("Success:", skills.length);
}
main().catch(console.error);
