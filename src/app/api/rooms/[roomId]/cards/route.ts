import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const createCardSchema = z.object({
  title: z.string().min(1, "Tiêu đề thẻ không được để trống").max(150),
  description: z.string().max(2000).optional(),
  columnId: z.string().min(1, "Vui lòng chọn cột"),
  groupId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  assigneeMembershipIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

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
    const columnId = searchParams.get("columnId");
    const groupId = searchParams.get("groupId");
    const search = searchParams.get("search");

    const whereClause: any = {
      roomId: auth.room.id,
      archivedAt: null,
    };

    if (columnId) whereClause.columnId = columnId;
    if (groupId) whereClause.groupId = groupId;
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const cards = await prisma.taskCard.findMany({
      where: whereClause,
      include: {
        column: { select: { id: true, name: true, key: true } },
        group: { select: { id: true, name: true, color: true } },
        assignees: {
          include: {
            membership: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
            },
          },
        },
        labelAssignments: {
          include: {
            label: true,
          },
        },
        checklistItems: {
          select: { id: true, isCompleted: true },
        },
        _count: {
          select: { comments: true, attachments: true },
        },
      },
      orderBy: [{ columnId: "asc" }, { sortOrder: "asc" }],
    });

    const formatted = cards.map((c) => {
      const totalChecklist = c.checklistItems.length;
      const completedChecklist = c.checklistItems.filter((i) => i.isCompleted).length;

      return {
        id: c.id,
        roomId: c.roomId,
        columnId: c.columnId,
        columnName: c.column.name,
        columnKey: c.column.key,
        groupId: c.groupId,
        group: c.group,
        title: c.title,
        description: c.description,
        dueAt: c.dueAt,
        sortOrder: c.sortOrder,
        isCompleted: c.isCompleted,
        creatorId: c.creatorId,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        assignees: c.assignees.map((a) => ({
          membershipId: a.membershipId,
          userId: a.membership.user.id,
          name: a.membership.user.name || "Thành viên",
          image: a.membership.user.image,
        })),
        labels: c.labelAssignments.map((la) => la.label),
        checklistProgress: {
          total: totalChecklist,
          completed: completedChecklist,
        },
        commentsCount: c._count.comments,
        attachmentsCount: c._count.attachments,
      };
    });

    return NextResponse.json({ cards: formatted });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List cards error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải thẻ công việc" }, { status: 500 });
  }
}

export async function POST(
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

    // Check if user must change password before creating cards
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mustChangePassword: true },
    });
    if (userDb?.mustChangePassword) {
      return NextResponse.json(
        {
          error: "Bạn cần đổi mật khẩu tạm trước khi tạo thẻ hoặc thao tác trong phòng họp.",
          mustChangePassword: true,
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const {
      title,
      description,
      columnId,
      groupId,
      dueAt,
      assigneeMembershipIds = [],
      labelIds = [],
    } = parsed.data;

    // Verify column belongs to room
    const column = await prisma.boardColumn.findUnique({
      where: { id: columnId },
    });
    if (!column || column.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Cột không thuộc phòng họp này" }, { status: 400 });
    }

    // If groupId provided, verify it belongs to room
    if (groupId) {
      const group = await prisma.roomGroup.findUnique({
        where: { id: groupId },
      });
      if (!group || group.roomId !== auth.room.id) {
        return NextResponse.json({ error: "Nhóm không thuộc phòng họp này" }, { status: 400 });
      }
    }

    // Determine next sortOrder in column
    const maxSort = await prisma.taskCard.aggregate({
      where: { roomId: auth.room.id, columnId },
      _max: { sortOrder: true },
    });
    const nextSortOrder = (maxSort._max.sortOrder ?? -1) + 1;

    // Transaction to create card, assignees, and label assignments
    const card = await prisma.$transaction(async (tx) => {
      const newCard = await tx.taskCard.create({
        data: {
          roomId: auth.room.id,
          columnId,
          groupId: groupId || null,
          creatorId: user.id,
          title,
          description: description || null,
          dueAt: dueAt ? new Date(dueAt) : null,
          sortOrder: nextSortOrder,
          isCompleted: column.key === "COMPLETED",
          completedAt: column.key === "COMPLETED" ? new Date() : null,
        },
      });

      // Add assignees
      if (assigneeMembershipIds.length > 0) {
        for (const membershipId of assigneeMembershipIds) {
          // Verify membership belongs to room
          const mem = await tx.roomMembership.findUnique({
            where: { id: membershipId },
          });
          if (mem && mem.roomId === auth.room.id) {
            await tx.taskAssignee.create({
              data: {
                taskId: newCard.id,
                membershipId,
              },
            });
          }
        }
      }

      // Add labels
      if (labelIds.length > 0) {
        for (const labelId of labelIds) {
          const lbl = await tx.taskLabel.findUnique({
            where: { id: labelId },
          });
          if (lbl && lbl.roomId === auth.room.id) {
            await tx.taskLabelAssignment.create({
              data: {
                taskId: newCard.id,
                labelId,
              },
            });
          }
        }
      }

      return newCard;
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "CARD_CREATED",
      entityType: "CARD",
      entityId: card.id,
      details: { title: card.title, columnId: card.columnId },
    });

    return NextResponse.json({ success: true, card });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Create card error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo thẻ" }, { status: 500 });
  }
}
