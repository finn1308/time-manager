import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const updateCardSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().max(2000).optional().nullable(),
  columnId: z.string().optional(),
  groupId: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  isCompleted: z.boolean().optional(),
  assigneeMembershipIds: z.array(z.string()).optional(),
  labelIds: z.array(z.string()).optional(),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ roomId: string; cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, cardId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
      include: {
        column: true,
        group: true,
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
          include: { label: true },
        },
        checklistItems: {
          orderBy: { sortOrder: "asc" },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        attachments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    return NextResponse.json({ card });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Get card error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải chi tiết thẻ" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string; cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, cardId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
    });

    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = updateCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const {
      title,
      description,
      columnId,
      groupId,
      dueAt,
      isCompleted,
      assigneeMembershipIds,
      labelIds,
    } = parsed.data;

    // Check target column if changed
    let columnKey: string | null = null;
    if (columnId) {
      const col = await prisma.boardColumn.findUnique({
        where: { id: columnId },
      });
      if (!col || col.roomId !== auth.room.id) {
        return NextResponse.json({ error: "Cột đích không thuộc phòng họp này" }, { status: 400 });
      }
      columnKey = col.key;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (columnId !== undefined) updateData.columnId = columnId;
      if (groupId !== undefined) updateData.groupId = groupId;
      if (dueAt !== undefined) updateData.dueAt = dueAt ? new Date(dueAt) : null;
      if (isCompleted !== undefined) {
        updateData.isCompleted = isCompleted;
        updateData.completedAt = isCompleted ? new Date() : null;
      } else if (columnKey === "COMPLETED") {
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }

      const resCard = await tx.taskCard.update({
        where: { id: cardId },
        data: updateData,
      });

      // Update assignees if provided
      if (assigneeMembershipIds !== undefined) {
        await tx.taskAssignee.deleteMany({ where: { taskId: cardId } });
        for (const membershipId of assigneeMembershipIds) {
          const mem = await tx.roomMembership.findUnique({ where: { id: membershipId } });
          if (mem && mem.roomId === auth.room.id) {
            await tx.taskAssignee.create({
              data: { taskId: cardId, membershipId },
            });
          }
        }
      }

      // Update labels if provided
      if (labelIds !== undefined) {
        await tx.taskLabelAssignment.deleteMany({ where: { taskId: cardId } });
        for (const labelId of labelIds) {
          const lbl = await tx.taskLabel.findUnique({ where: { id: labelId } });
          if (lbl && lbl.roomId === auth.room.id) {
            await tx.taskLabelAssignment.create({
              data: { taskId: cardId, labelId },
            });
          }
        }
      }

      return resCard;
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "CARD_UPDATED",
      entityType: "CARD",
      entityId: cardId,
      details: { cardTitle: updated.title, updates: parsed.data },
    });

    return NextResponse.json({ success: true, card: updated });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Update card error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi cập nhật thẻ" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string; cardId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, cardId } = await params;
    const auth = await requireRoomAuth(roomId, user.id);

    const card = await prisma.taskCard.findUnique({
      where: { id: cardId },
    });

    if (!card || card.roomId !== auth.room.id) {
      return NextResponse.json({ error: "Không tìm thấy thẻ công việc" }, { status: 404 });
    }

    // Permission check: only card creator, Host, or Admin can delete
    const canDelete = card.creatorId === user.id || auth.isHost || auth.isAdmin;
    if (!canDelete) {
      return NextResponse.json(
        { error: "Bạn chỉ có thể xóa thẻ do chính mình tạo ra (hoặc cần quyền Host/Admin)" },
        { status: 403 }
      );
    }

    await prisma.taskCard.delete({
      where: { id: cardId },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "CARD_DELETED",
      entityType: "CARD",
      entityId: cardId,
      details: { title: card.title },
    });

    return NextResponse.json({ success: true, message: "Đã xóa thẻ công việc thành công" });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Delete card error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi xóa thẻ" }, { status: 500 });
  }
}
