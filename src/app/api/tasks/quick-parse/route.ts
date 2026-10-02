import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseNaturalLanguageTask } from "@/lib/tasks/nlp-task-parser";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { text, autoCreate = false } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập nội dung task" }, { status: 400 });
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, code: true },
    });

    const parsed = parseNaturalLanguageTask(text, subjects);

    if (autoCreate) {
      const task = await prisma.task.create({
        data: {
          userId: user.id,
          title: parsed.title,
          subjectId: parsed.subjectId,
          deadline: parsed.deadline,
          estimatedMinutes: parsed.estimatedMinutes,
          priority: parsed.priority,
          status: "INBOX",
        },
        include: {
          subject: true,
        },
      });

      return NextResponse.json({ success: true, task, parsed });
    }

    return NextResponse.json({ success: true, parsed });
  } catch (err: any) {
    console.error("POST /api/tasks/quick-parse error:", err);
    return NextResponse.json({ error: "Lỗi phân tích cú pháp task" }, { status: 500 });
  }
}
