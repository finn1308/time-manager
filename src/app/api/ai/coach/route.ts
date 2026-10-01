import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { decryptApiKey } from "@/lib/crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { question } = await req.json();
    if (!question?.trim()) {
      return NextResponse.json({ error: "Vui lòng nhập câu hỏi" }, { status: 400 });
    }

    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // 1. Gather 100% Real Database Context
    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      include: { goals: true },
    });

    const thisWeekSessions = await prisma.studySession.findMany({
      where: {
        userId: user.id,
        actualStart: { gte: weekStart, lte: weekEnd },
      },
      include: { subject: true },
    });

    const totalSeconds = thisWeekSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
    const weeklyActualHours = Math.round((totalSeconds / 3600) * 10) / 10;

    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const weeklyBudget = userSettings?.weeklyStudyBudgetHours || 20.0;
    const studyDebt = Math.max(0, Math.round((weeklyBudget - weeklyActualHours) * 10) / 10);

    // Subject breakdown
    const subjectProgress = subjects.map((sub) => {
      const subSessions = thisWeekSessions.filter((s) => s.subjectId === sub.id);
      const subSecs = subSessions.reduce((acc, s) => acc + s.actualDurationSeconds, 0);
      const subWeekH = Math.round((subSecs / 3600) * 10) / 10;
      const target = sub.targetHours || 10;
      const completed = sub.completedHours || 0;
      return {
        name: sub.name,
        weekHours: subWeekH,
        targetHours: target,
        completedHours: completed,
        remainingHours: Math.max(0, target - completed),
        priority: sub.priority,
      };
    });

    // Check goals nearing deadline
    const activeGoals = await prisma.goal.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      include: { subject: true },
      orderBy: { deadline: "asc" },
    });

    // 2. Check if user has personal AI API Key
    const apiKeyRecord = await prisma.userApiKey.findFirst({
      where: { userId: user.id, isActive: true },
    });

    let aiAnswer = "";

    if (apiKeyRecord) {
      try {
        const decryptedKey = decryptApiKey(
          apiKeyRecord.encryptedKey,
          apiKeyRecord.iv,
          apiKeyRecord.authTag
        );

        if (apiKeyRecord.provider === "GEMINI") {
          const prompt = `Bạn là AI Study Coach cá nhân trong ứng dụng ChronoMind. Dưới đây là dữ liệu học tập THỰC TẾ của người dùng từ database (KHÔNG được tự bịa số liệu):
- Tổng thời gian học tuần này: ${weeklyActualHours}h / Ngân sách tuần: ${weeklyBudget}h.
- Study Debt: ${studyDebt}h.
- Danh sách môn học và tiến độ:
${subjectProgress
  .map(
    (s) =>
      `+ ${s.name}: Tuần này học ${s.weekHours}h, Đã tích lũy ${s.completedHours}h / Chỉ tiêu ${s.targetHours}h (Còn thiếu ${s.remainingHours}h, Mức ưu tiên ${s.priority}/5)`
  )
  .join("\n")}
- Mục tiêu đang theo dõi:
${activeGoals
  .map(
    (g) =>
      `+ ${g.title}: Hạn chót ${g.deadline ? format(g.deadline, "dd/MM/yyyy") : "Chưa đặt"}, Chỉ tiêu ${g.targetHours}h`
  )
  .join("\n")}

Người dùng hỏi: "${question}"
Hãy trả lời cô đọng, tâm lý, có số liệu thực tế rõ ràng, đưa ra lời khuyên thiết thực và ngắn gọn bằng tiếng Việt.`;

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${decryptedKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            aiAnswer = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          }
        }
      } catch (err) {
        console.error("AI Provider call failed, falling back to local coach engine:", err);
      }
    }

    // 3. High-Quality Deterministic Fallback if AI Key not set or failed
    if (!aiAnswer) {
      const qLower = question.toLowerCase();
      if (qLower.includes("tuần này") || qLower.includes("thế nào")) {
        aiAnswer = `📊 **Đánh giá tuần này:** Bạn đã học được **${weeklyActualHours} giờ** trên tổng ngân sách **${weeklyBudget} giờ** (${Math.round(
          (weeklyActualHours / weeklyBudget) * 100
        )}%). ${
          studyDebt > 0
            ? `Hiện bạn đang có **${studyDebt} giờ nợ học tập (Study Debt)** cần bù trước cuối tuần.`
            : "Bạn đang theo rất sát tiến độ ngân sách tuần!"
        }\n\n${subjectProgress
          .map((s) => `• **${s.name}**: ${s.weekHours}h tuần này (còn thiếu ${s.remainingHours}h tổng thể)`)
          .join("\n")}`;
      } else if (qLower.includes("thiếu") || qLower.includes("môn")) {
        const sortedByRemaining = [...subjectProgress].sort((a, b) => b.remainingHours - a.remainingHours);
        const topDeficit = sortedByRemaining[0];
        aiAnswer = `⚠️ **Môn học cần tập trung bù giờ:**\n${sortedByRemaining
          .slice(0, 3)
          .map(
            (s, idx) =>
              `${idx + 1}. **${s.name}**: còn thiếu **${s.remainingHours}h** (Ưu tiên mức ${s.priority}/5)`
          )
          .join("\n")}\n\n👉 Khuyên bạn: Hãy ưu tiên phân bổ 90 phút cho môn **${topDeficit?.name || "trọng tâm"}** vào khung giờ rảnh tối nay.`;
      } else if (qLower.includes("deadline") || qLower.includes("mục tiêu")) {
        aiAnswer = `🎯 **Tình trạng mục tiêu và thời hạn:**\n${
          activeGoals.length > 0
            ? activeGoals
                .map(
                  (g) =>
                    `• **${g.title}**: ${g.deadline ? `Hạn chót ngày ${format(g.deadline, "dd/MM/yyyy")}` : "Chưa có deadline"} (${g.targetHours}h chỉ tiêu)`
                )
                .join("\n")
            : "Hiện chưa có mục tiêu nào được đặt deadline. Hãy vào trang Mục tiêu để tạo mới!"
        }`;
      } else {
        aiAnswer = `💡 **Gợi ý từ AI Study Coach:**\nHiện bạn có ${subjects.length} môn học đang theo dõi. Tuần này đã học ${weeklyActualHours}h. Để duy trì phong độ tối ưu, hãy duy trì các phiên học từ 45 - 90 phút và có khoảng nghỉ 10 phút giữa các buổi. Bạn có thể sử dụng tính năng **'AI Tự động lập lịch tuần'** để hệ thống tự lấp đầy các khoảng thời gian trống mà không lo trùng lịch!`;
      }
    }

    return NextResponse.json({
      success: true,
      answer: aiAnswer,
      context: {
        weeklyActualHours,
        weeklyBudget,
        studyDebt,
      },
    });
  } catch (err: any) {
    console.error("Coach API Error:", err);
    return NextResponse.json({ error: "Lỗi kết nối AI Coach" }, { status: 500 });
  }
}
