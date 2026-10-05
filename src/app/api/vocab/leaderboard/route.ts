import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();

  try {
    const topUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        xp: true,
        coins: true,
        streakDays: true,
        isPro: true,
        _count: {
          select: {
            vocabWordProgresses: {
              where: { status: "MASTERED" },
            },
          },
        },
      },
      orderBy: [{ xp: "desc" }, { streakDays: "desc" }],
      take: 20,
    });

    const leaderboard = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u.id,
      name: u.name || u.email.split("@")[0],
      avatar: u.image,
      xp: u.xp,
      coins: u.coins,
      streakDays: u.streakDays,
      isPro: u.isPro,
      wordsMastered: u._count.vocabWordProgresses,
      isCurrentUser: user ? user.id === u.id : false,
    }));

    return NextResponse.json({
      success: true,
      leaderboard,
    });
  } catch (error: any) {
    console.error("GET /api/vocab/leaderboard error:", error);
    return NextResponse.json(
      { error: "Lỗi tải bảng xếp hạng: " + error.message },
      { status: 500 }
    );
  }
}
