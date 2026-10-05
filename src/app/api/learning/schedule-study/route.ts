import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes, addDays, parseISO } from "date-fns";
import { getDateKeyVN, makeVNDate } from "@/lib/date-utils";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { topic, durationMinutes = 45, startTime, subjectId } = await req.json();

    if (!topic?.trim()) {
      return NextResponse.json({ error: "Thiếu tên chủ đề cần lên lịch ôn tập" }, { status: 400 });
    }

    let start = startTime ? new Date(startTime) : null;

    if (!start || isNaN(start.getTime())) {
      // Pick a prime study slot tonight (19:30 VN) or tomorrow evening (19:30 VN)
      const todayKey = getDateKeyVN(new Date());
      let candidateStart = makeVNDate(todayKey, "19:30");
      if (candidateStart <= new Date()) {
        const tomorrowKey = getDateKeyVN(addDays(parseISO(todayKey), 1));
        candidateStart = makeVNDate(tomorrowKey, "19:30");
      }
      start = candidateStart;
    }

    const end = addMinutes(start, durationMinutes);

    const event = await prisma.calendarEvent.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: `Ôn tập trọng tâm: ${topic.slice(0, 50)}`,
        description: `Buổi ôn tập củng cố kiến thức được AI đề xuất từ kết quả phân tích câu sai trong Quiz.`,
        startTime: start,
        endTime: end,
        type: "STUDY",
        isAiGenerated: true,
        timezone: "Asia/Ho_Chi_Minh",
        plannedDurationMinutes: durationMinutes,
        completed: false,
      },
      include: {
        subject: {
          select: { id: true, name: true, color: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      event,
      message: `Đã tự động thêm buổi ôn tập "${topic}" vào Lịch học (19:30, ${durationMinutes} phút)!`,
    });
  } catch (err: any) {
    console.error("Schedule study error:", err);
    return NextResponse.json({ error: "Lỗi lên lịch ôn tập" }, { status: 500 });
  }
}
