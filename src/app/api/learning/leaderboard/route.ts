import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Fetch top users ordered by XP desc
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        xp: true,
        streakDays: true,
        quizAttempts: {
          select: {
            score: true,
          },
        },
      },
      orderBy: { xp: "desc" },
      take: 25,
    });

    const leaderboard = users.map((u, idx) => {
      const attempts = u.quizAttempts || [];
      const totalAttempts = attempts.length;
      const avgScore =
        totalAttempts > 0
          ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts)
          : 0;

      // Privacy: Display friendly name without exposing email or private info
      const displayName = u.name?.trim() || `Học viên #${u.id.slice(-4)}`;

      return {
        rank: idx + 1,
        userId: u.id,
        displayName,
        xp: u.xp || 0,
        quizzesCompleted: totalAttempts,
        accuracy: avgScore,
        streakDays: u.streakDays || 1,
        isCurrentUser: u.id === currentUser.id,
      };
    });

    return NextResponse.json({
      leaderboard,
      rankingRules:
        "Bảng xếp hạng tính theo tổng điểm kinh nghiệm (XP) tích lũy được từ việc hoàn thành bài học, trả lời đúng câu hỏi và chuỗi học tập (Streak). Điểm số được tính toán 100% server-side.",
    });
  } catch (err: any) {
    console.error("Fetch leaderboard error:", err);
    return NextResponse.json({ error: "Lỗi tải bảng xếp hạng" }, { status: 500 });
  }
}
