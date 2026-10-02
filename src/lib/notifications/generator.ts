import { prisma } from "@/lib/prisma";
import { getDateKeyVN, getVNTodayKey } from "@/lib/date-utils";

export async function checkAndGenerateNotifications(userId: string) {
  const now = new Date();
  const createdNotifications: any[] = [];
  const todayKey = getVNTodayKey();

  // 1. Check for upcoming Deadlines (within 48 hours)
  const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const urgentTasks = await prisma.task.findMany({
    where: {
      userId,
      isCompleted: false,
      status: { not: "DONE" },
      deadline: {
        gte: now,
        lte: in48Hours,
      },
    },
    include: { subject: true },
    take: 5,
  });

  for (const task of urgentTasks) {
    // Check if notification already sent in past 24 hours
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "DEADLINE",
        title: { contains: task.title },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      const hoursLeft = Math.max(1, Math.round((task.deadline!.getTime() - now.getTime()) / (1000 * 60 * 60)));
      const notif = await prisma.notification.create({
        data: {
          userId,
          title: `Hạn chót sắp tới: ${task.title}`,
          message: `Nhiệm vụ thuộc môn ${task.subject?.name || "Chung"} chỉ còn ${hoursLeft} giờ nữa là đến hạn!`,
          type: "DEADLINE",
          link: "/tasks",
        },
      });
      createdNotifications.push(notif);
    }
  }

  // 2. Check for upcoming Exams in next 5 days
  const in5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const upcomingExams = await prisma.calendarEvent.findMany({
    where: {
      userId,
      type: "EXAM",
      startTime: {
        gte: now,
        lte: in5Days,
      },
    },
    include: { subject: true },
    take: 3,
  });

  for (const exam of upcomingExams) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "EXAM",
        title: { contains: exam.title },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      const daysLeft = Math.max(1, Math.ceil((exam.startTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const notif = await prisma.notification.create({
        data: {
          userId,
          title: `Kỳ thi sắp diễn ra: ${exam.title}`,
          message: `Bạn có kỳ thi môn ${exam.subject?.name || ""} sau ${daysLeft} ngày nữa. Đừng quên ôn tập flashcard và làm quiz!`,
          type: "EXAM",
          link: "/calendar",
        },
      });
      createdNotifications.push(notif);
    }
  }

  // 3. Check for Missed Sessions in the last 24 hours that were never rescheduled
  const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const missedEvents = await prisma.calendarEvent.findMany({
    where: {
      userId,
      type: { in: ["STUDY", "SELF_STUDY"] },
      endTime: {
        gte: past24Hours,
        lte: now,
      },
      studySession: null,
    },
    include: { subject: true },
    take: 3,
  });

  for (const ev of missedEvents) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        type: "MISSED_SESSION",
        title: { contains: ev.title },
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
      },
    });

    if (!existing) {
      const notif = await prisma.notification.create({
        data: {
          userId,
          title: `Bỏ lỡ phiên học: ${ev.title}`,
          message: `Phiên học môn ${ev.subject?.name || ""} chưa được thực hiện. Sử dụng AI Rescheduler để khôi phục ngay!`,
          type: "MISSED_SESSION",
          link: "/calendar",
        },
      });
      createdNotifications.push(notif);
    }
  }

  // 4. Streak reminder if user hasn't studied today and it's after 18:00 (6 PM) in VN
  const hourVN = parseInt(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    }).format(now),
    10
  );

  if (hourVN >= 18) {
    const todaySessionsCount = await prisma.studySession.count({
      where: {
        userId,
        status: "COMPLETED",
        actualStart: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        },
      },
    });

    if (todaySessionsCount === 0) {
      const existing = await prisma.notification.findFirst({
        where: {
          userId,
          type: "STREAK",
          createdAt: { gte: new Date(now.setHours(0, 0, 0, 0)) },
        },
      });

      if (!existing) {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { streakDays: true },
        });

        const notif = await prisma.notification.create({
          data: {
            userId,
            title: `Bảo vệ chuỗi Streak 🔥`,
            message: `Bạn chưa học phiên nào hôm nay! Bật một phiên Pomodoro 25 phút để giữ chuỗi ${user?.streakDays || 1} ngày kỷ luật.`,
            type: "STREAK",
            link: "/study-sessions",
          },
        });
        createdNotifications.push(notif);
      }
    }
  }

  return createdNotifications;
}
