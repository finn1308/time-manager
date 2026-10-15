import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, requireRoomRole, recordRoomAudit } from "@/lib/rooms/room-auth";
import { ROOM_ROLES } from "@/lib/rooms/room-utils";
import { z } from "zod";

const createColumnSchema = z.object({
  name: z.string().min(1, "Tên cột không được để trống").max(50),
  color: z.string().default("slate"),
});

const reorderColumnsSchema = z.object({
  columns: z.array(
    z.object({
      id: z.string(),
      sortOrder: z.number(),
    })
  ),
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

    const columns = await prisma.boardColumn.findMany({
      where: { roomId: auth.room.id },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { cards: true } },
      },
    });

    return NextResponse.json({ columns });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List columns error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải cột" }, { status: 500 });
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
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const body = await req.json();
    const parsed = createColumnSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const maxSort = await prisma.boardColumn.aggregate({
      where: { roomId: auth.room.id },
      _max: { sortOrder: true },
    });
    const nextOrder = (maxSort._max.sortOrder ?? -1) + 1;

    const column = await prisma.boardColumn.create({
      data: {
        roomId: auth.room.id,
        name: parsed.data.name,
        color: parsed.data.color,
        key: `CUSTOM_${Date.now()}`,
        sortOrder: nextOrder,
        isDefault: false,
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "COLUMN_CREATED",
      entityType: "COLUMN",
      entityId: column.id,
      details: { name: column.name },
    });

    return NextResponse.json({ success: true, column });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Chỉ Host hoặc Admin mới có quyền tạo cột" }, { status: 403 });
    }
    console.error("Create column error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tạo cột" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId } = await params;
    const auth = await requireRoomRole(roomId, user.id, [ROOM_ROLES.ADMIN, ROOM_ROLES.HOST]);

    const body = await req.json();
    const parsed = reorderColumnsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    await prisma.$transaction(
      parsed.data.columns.map((col) =>
        prisma.boardColumn.update({
          where: { id: col.id, roomId: auth.room.id },
          data: { sortOrder: col.sortOrder },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err.message === "INSUFFICIENT_ROOM_PERMISSIONS") {
      return NextResponse.json({ error: "Không có quyền sắp xếp cột" }, { status: 403 });
    }
    console.error("Reorder columns error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi sắp xếp cột" }, { status: 500 });
  }
}
