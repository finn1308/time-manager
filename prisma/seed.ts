import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 ChronoMind: Running optional development seed...");

  // 1. Clean existing test data
  await prisma.studySession.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.availabilityRule.deleteMany();
  await prisma.aiPreferences.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.userApiKey.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create seed user
  const passwordHash = await bcrypt.hash("ChronoMind123!", 10);
  const user = await prisma.user.create({
    data: {
      name: "Huy Nguyen",
      email: "huy@example.com",
      passwordHash,
      role: "USER",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  console.log(`👤 Seed user created: ${user.email} / ChronoMind123!`);

  // 3. Create initial subjects
  const ielts = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "IELTS Academic",
      code: "IELTS",
      color: "#2d6a4f", // Botanical green
      description: "Writing Task 2 & Reading Cambridge 19",
      targetHours: 20.0,
      completedHours: 0.0,
      priority: 5,
    },
  });

  const math = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Giải tích & Đại số tuyến tính",
      code: "MATH",
      color: "#52b788", // Fresh sage green
      description: "Ma trận, Không gian vector & Tích phân suy rộng",
      targetHours: 15.0,
      completedHours: 0.0,
      priority: 4,
    },
  });

  // 4. Create goals
  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);

  await prisma.goal.create({
    data: {
      userId: user.id,
      subjectId: ielts.id,
      title: "Đạt band 7.5 IELTS Writing",
      description: "Hoàn thành 20 giờ luyện viết và chữa bài chi tiết",
      targetHours: 20.0,
      deadline,
      status: "ACTIVE",
    },
  });

  // 5. Create availability rules (Giờ rảnh)
  for (let day = 1; day <= 6; day++) {
    await prisma.availabilityRule.create({
      data: {
        userId: user.id,
        title: "Khung giờ học tối",
        dayOfWeek: day,
        startTime: "19:00",
        endTime: "22:00",
        isAvailable: true,
        timezone: "Asia/Ho_Chi_Minh",
      },
    });
  }

  // 6. Settings & AI preferences
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      timezone: "Asia/Ho_Chi_Minh",
      weekStartDay: 1,
      language: "vi",
    },
  });

  await prisma.aiPreferences.create({
    data: {
      userId: user.id,
      preferredStudyDuration: 90,
      preferredBreakDuration: 15,
      preferredStudyDays: "1,2,3,4,5,6",
      preferredTimeRanges: "19:00-22:00",
      maxDailyStudyHours: 4.0,
    },
  });

  console.log("✅ Optional development seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
