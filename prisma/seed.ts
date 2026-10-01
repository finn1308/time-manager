import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ChronoMind database...");

  // 1. Clean existing demo data if any
  await prisma.studyLog.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.studyGoal.deleteMany();
  await prisma.blockedSlot.deleteMany();
  await prisma.userApiKey.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create default user
  const passwordHash = await bcrypt.hash("ChronoMind123!", 10);
  const user = await prisma.user.create({
    data: {
      name: "Huy Nguyen",
      email: "demo@chronomind.app",
      passwordHash,
      role: "USER",
      timezone: "Asia/Ho_Chi_Minh",
    },
  });

  console.log(`👤 Created user: ${user.email} (Password: ChronoMind123!)`);

  // 3. Create realistic subjects
  const cs102 = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Cấu trúc dữ liệu & Giải thuật",
      code: "CS102",
      color: "#3b82f6", // Blue
      icon: "Code",
      description: "Thuật toán đồ thị (Dijkstra, BFS/DFS), Cây nhị phân và Quy hoạch động",
    },
  });

  const eng301 = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "IELTS Academic Writing & Reading",
      code: "ENG301",
      color: "#10b981", // Emerald
      icon: "BookOpen",
      description: "Luyện giải đề Cam 18-19, Task 1 report và Task 2 essay",
    },
  });

  const math201 = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Giải tích & Xác suất thống kê",
      code: "MATH201",
      color: "#f59e0b", // Amber
      icon: "Calculator",
      description: "Xác suất có điều kiện, Định lý Bayes, Biến ngẫu nhiên và Ước lượng",
    },
  });

  const aiml = await prisma.subject.create({
    data: {
      userId: user.id,
      name: "Deep Learning & Generative AI",
      code: "AI_ML",
      color: "#8b5cf6", // Purple
      icon: "Cpu",
      description: "Transformer architecture, Attention mechanism, PyTorch & LLM fine-tuning",
    },
  });

  // 4. Create Goals
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  await prisma.studyGoal.createMany({
    data: [
      {
        userId: user.id,
        subjectId: cs102.id,
        targetHours: 24.0,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isAutoAlloc: true,
        priority: 5,
        notes: "Môn trọng tâm học kỳ này, cần hoàn thành 2 bài đồ án lớn",
      },
      {
        userId: user.id,
        subjectId: eng301.id,
        targetHours: 16.0,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isAutoAlloc: true,
        priority: 4,
        notes: "Luyện tối thiểu 3 đề Task 2 mỗi tuần",
      },
      {
        userId: user.id,
        subjectId: math201.id,
        targetHours: 12.0,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isAutoAlloc: false,
        priority: 3,
        notes: "Giải bài tập sách giáo trình các chương 4, 5, 6",
      },
      {
        userId: user.id,
        subjectId: aiml.id,
        targetHours: 20.0,
        startDate: startOfMonth,
        endDate: endOfMonth,
        isAutoAlloc: true,
        priority: 5,
        notes: "Đọc paper Attention Is All You Need và code implement PyTorch",
      },
    ],
  });

  // 5. Create Blocked Slots (AI must strictly avoid these!)
  // - Night Sleep: Everyday 23:30 -> 06:30
  for (let d = 0; d < 7; d++) {
    await prisma.blockedSlot.create({
      data: {
        userId: user.id,
        title: "Giờ ngủ & Nghỉ ngơi đêm",
        startTime: "23:30",
        endTime: "06:30",
        dayOfWeek: d,
        isRecurring: true,
        isLocked: true,
      },
    });
  }

  // - University Morning Lectures: Mon (1), Tue (2), Wed (3), Thu (4), Fri (5) from 07:30 -> 11:30
  for (let d = 1; d <= 5; d++) {
    await prisma.blockedSlot.create({
      data: {
        userId: user.id,
        title: "Lịch học trên giảng đường (Đại học)",
        startTime: "07:30",
        endTime: "11:30",
        dayOfWeek: d,
        isRecurring: true,
        isLocked: true,
      },
    });
  }

  // - Workout / Gym: Tue (2), Thu (4), Sat (6) from 17:30 -> 18:45
  for (const d of [2, 4, 6]) {
    await prisma.blockedSlot.create({
      data: {
        userId: user.id,
        title: "Thể thao & Tập Gym",
        startTime: "17:30",
        endTime: "18:45",
        dayOfWeek: d,
        isRecurring: true,
        isLocked: true,
      },
    });
  }

  // 6. Create realistic study schedule events and logs for today & recent days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Event 1: Today afternoon
  const event1Start = new Date(today);
  event1Start.setHours(14, 0, 0, 0);
  const event1End = new Date(today);
  event1End.setHours(15, 30, 0, 0);

  const event1 = await prisma.scheduleEvent.create({
    data: {
      userId: user.id,
      subjectId: cs102.id,
      title: "Luyện thuật toán Dijkstra & Heap tối ưu",
      description: "Làm 3 bài trên LeetCode / Codeforces về đồ thị có trọng số",
      startTime: event1Start,
      endTime: event1End,
      eventType: "STUDY",
      isAiGenerated: true,
      isCompleted: true,
    },
  });

  // Study log corresponding to event 1 (actual studied time)
  await prisma.studyLog.create({
    data: {
      userId: user.id,
      subjectId: cs102.id,
      scheduleEventId: event1.id,
      startTime: event1Start,
      endTime: event1End,
      durationMinutes: 90,
      notes: "Hoàn thành 3 bài đồ án, tối ưu độ phức tạp O(E log V)",
      productivityScore: 5,
      source: "PIP_TIMER",
    },
  });

  // Event 2: Today evening
  const event2Start = new Date(today);
  event2Start.setHours(19, 30, 0, 0);
  const event2End = new Date(today);
  event2End.setHours(21, 0, 0, 0);

  const event2 = await prisma.scheduleEvent.create({
    data: {
      userId: user.id,
      subjectId: aiml.id,
      title: "Cài đặt Multi-Head Attention trong PyTorch",
      description: "Code matrix multiplication và masking cho scaled dot-product attention",
      startTime: event2Start,
      endTime: event2End,
      eventType: "STUDY",
      isAiGenerated: true,
      isCompleted: true,
    },
  });

  await prisma.studyLog.create({
    data: {
      userId: user.id,
      subjectId: aiml.id,
      scheduleEventId: event2.id,
      startTime: event2Start,
      endTime: event2End,
      durationMinutes: 85,
      notes: "Đã hiểu rõ cơ chế mask của Decoder trong GPT-style decoder-only",
      productivityScore: 4,
      source: "PIP_TIMER",
    },
  });

  // Event 3: Tomorrow planned
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const event3Start = new Date(tomorrow);
  event3Start.setHours(14, 0, 0, 0);
  const event3End = new Date(tomorrow);
  event3End.setHours(16, 0, 0, 0);

  await prisma.scheduleEvent.create({
    data: {
      userId: user.id,
      subjectId: eng301.id,
      title: "IELTS Writing Task 2: Cause & Solution Essay",
      description: "Chủ đề Technology & Remote Learning, viết bài 300 từ",
      startTime: event3Start,
      endTime: event3End,
      eventType: "STUDY",
      isAiGenerated: true,
      isCompleted: false,
    },
  });

  // Past logs for the last 4 days to populate streak & analytics charts
  for (let i = 1; i <= 4; i++) {
    const pastDate = new Date(today);
    pastDate.setDate(pastDate.getDate() - i);

    const pastStart = new Date(pastDate);
    pastStart.setHours(19, 0, 0, 0);
    const pastEnd = new Date(pastDate);
    pastEnd.setHours(20, 45, 0, 0);

    const pastSubject = i % 2 === 0 ? math201 : cs102;

    await prisma.studyLog.create({
      data: {
        userId: user.id,
        subjectId: pastSubject.id,
        startTime: pastStart,
        endTime: pastEnd,
        durationMinutes: 105,
        notes: `Phiên học tự giác ngày ${pastDate.toLocaleDateString("vi-VN")}`,
        productivityScore: 4 + (i % 2),
        source: "PIP_TIMER",
      },
    });
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
