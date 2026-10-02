import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMinutes, setHours, setMinutes, addDays } from "date-fns";

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
      // Pick a prime study slot tonight or tomorrow evening
      const now = new Date();
      start = setMinutes(setHours(now, 19), 30);
      if (start <= now) {
        start = setMinutes(setHours(addDays(now, 1), 19), 30);
      }
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
