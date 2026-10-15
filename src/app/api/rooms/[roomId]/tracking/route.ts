import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth } from "@/lib/rooms/room-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const { searchParams } = new URL(req.url);
    const filterGroupId = searchParams.get("groupId");

    const whereClause: any = {
      roomId: auth.room.id,
      archivedAt: null,
    };
    if (filterGroupId) {
      whereClause.groupId = filterGroupId;
    }

    const now = new Date();

    const [columns, allCards, members, groups] = await Promise.all([
      prisma.boardColumn.findMany({
        where: { roomId: auth.room.id },
        orderBy: { sortOrder: "asc" },
      }),
      prisma.taskCard.findMany({
        where: whereClause,
        include: {
          column: { select: { id: true, name: true, key: true } },
          group: { select: { id: true, name: true, color: true } },
          assignees: {
            select: { membershipId: true },
          },
        },
      }),
      prisma.roomMembership.findMany({
        where: { roomId: auth.room.id, status: "ACTIVE" },
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      }),
      prisma.roomGroup.findMany({
        where: { roomId: auth.room.id },
        select: { id: true, name: true, color: true },
      }),
    ]);

    const totalTasks = allCards.length;
    const completedTasks = allCards.filter((c) => c.isCompleted || c.column.key === "COMPLETED").length;
    const inProgressTasks = allCards.filter((c) => !c.isCompleted && c.column.key === "IN_PROGRESS").length;
    const overdueTasks = allCards.filter((c) => !c.isCompleted && c.dueAt && new Date(c.dueAt) < now).length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Breakdown by column
    const columnBreakdown = columns.map((col) => {
      const count = allCards.filter((c) => c.columnId === col.id).length;
      return {
        id: col.id,
        name: col.name,
        key: col.key,
        color: col.color,
        count,
        percentage: totalTasks > 0 ? Math.round((count / totalTasks) * 100) : 0,
      };
    });

    // Workload by member
    const memberWorkload = members.map((m) => {
      const assignedCards = allCards.filter((c) =>
        c.assignees.some((a) => a.membershipId === m.id)
      );
      const total = assignedCards.length;
      const completed = assignedCards.filter((c) => c.isCompleted || c.column.key === "COMPLETED").length;
      const overdue = assignedCards.filter((c) => !c.isCompleted && c.dueAt && new Date(c.dueAt) < now).length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        membershipId: m.id,
        userId: m.user.id,
        name: m.user.name || "Thành viên",
        email: m.user.email,
        image: m.user.image,
        role: m.role,
        totalTasks: total,
        completedTasks: completed,
        overdueTasks: overdue,
        completionRate: rate,
      };
    });

    // Breakdown by group
    const groupProgress = groups.map((g) => {
      const groupCards = allCards.filter((c) => c.groupId === g.id);
      const total = groupCards.length;
      const completed = groupCards.filter((c) => c.isCompleted || c.column.key === "COMPLETED").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: g.id,
        name: g.name,
        color: g.color,
        totalTasks: total,
        completedTasks: completed,
        completionRate: rate,
      };
    });

    return NextResponse.json({
      summary: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        completionRate,
      },
      columnBreakdown,
      memberWorkload,
      groupProgress,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Get tracking error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải số liệu tracking" }, { status: 500 });
  }
}
