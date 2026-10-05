import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWeeks, addDays } from "date-fns";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { goalPrompt, subjectId, targetMonths = 3, commit = false } = await req.json();

    if (!goalPrompt || goalPrompt.trim().length < 5) {
      return NextResponse.json({ error: "Vui lòng nhập mục tiêu học tập cụ thể" }, { status: 400 });
    }

    const now = new Date();
    const months = Number(targetMonths) || 3;
    const deadline = addWeeks(now, months * 4);

    // Synthesize structured milestones
    const milestones = [
      {
        order: 1,
        title: `Cột mốc 1: Đánh giá trình độ ban đầu & Nền tảng cốt lõi`,
        targetDate: addWeeks(now, Math.max(1, Math.round(months * 4 * 0.25))),
        tasks: [
          "Làm bài kiểm tra đánh giá năng lực khởi điểm",
          "Tổng hợp tài liệu và lập danh mục chủ đề cần hoàn thành",
          "Thiết lập khung giờ học cố định mỗi ngày",
        ],
      },
      {
        order: 2,
        title: `Cột mốc 2: Luyện tập trọng tâm & Lấp đầy lỗ hổng`,
        targetDate: addWeeks(now, Math.max(2, Math.round(months * 4 * 0.55))),
        tasks: [
          "Hoàn thành các bài tập phân loại mức độ trung bình - khá",
          "Ôn tập 100% câu sai trong Ngân hàng lỗi sai (Mistake Bank)",
          "Đo lường tiến độ và điều chỉnh khối lượng học tập",
        ],
      },
      {
        order: 3,
        title: `Cột mốc 3: Luyện đề cường độ cao & Nâng cao phản xạ`,
        targetDate: addWeeks(now, Math.max(3, Math.round(months * 4 * 0.85))),
        tasks: [
          "Thực hiện bài thi thử mô phỏng thời gian thực",
          "Rèn luyện kỹ năng quản lý thời gian khi làm bài",
          "Tập trung khắc phục các dạng câu hỏi điểm 9-10",
        ],
      },
      {
        order: 4,
        title: `Cột mốc 4: Tự tin chinh phục mục tiêu: ${goalPrompt}`,
        targetDate: deadline,
        tasks: [
          "Tổng duyệt toàn bộ công thức và ghi chú quan trọng",
          "Giữ tâm lý thoải mái và sẵn sàng cho bài thi / cột mốc chính thức",
        ],
      },
    ];

    if (!commit) {
      // Just preview
      return NextResponse.json({
        success: true,
        preview: {
          goalTitle: goalPrompt,
          targetMonths: months,
          deadline: deadline.toISOString(),
          milestones,
          recommendedWeeklyHours: Math.min(20, Math.max(4, Math.round(120 / (months * 4)))),
        },
      });
    }

    // Commit to database
    const goal = await prisma.goal.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title: goalPrompt,
        description: `Mục tiêu được tạo tự động bởi AI Roadmap Engine (${months} tháng)`,
        targetHours: months * 4 * 6, // 6h per week
        deadline,
        status: "ACTIVE",
      },
    });

    for (const m of milestones) {
      const milestoneRecord = await prisma.milestone.create({
        data: {
          goalId: goal.id,
          title: m.title,
          targetDate: m.targetDate,
          order: m.order,
          isCompleted: false,
        },
      });

      for (let i = 0; i < m.tasks.length; i++) {
        await prisma.task.create({
          data: {
            userId: user.id,
            goalId: goal.id,
            milestoneId: milestoneRecord.id,
            subjectId: subjectId || null,
            title: m.tasks[i],
            deadline: m.targetDate,
            priority: i === 0 ? "HIGH" : "MEDIUM",
            status: "TODO",
            estimatedMinutes: 60,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã kích hoạt thành công lộ trình cho mục tiêu: "${goalPrompt}"`,
      goalId: goal.id,
    });
  } catch (err: any) {
    console.error("Error creating goal roadmap:", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo lộ trình mục tiêu" }, { status: 500 });
  }
}
