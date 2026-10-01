import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const slots = await prisma.blockedSlot.findMany({
    where: { userId: user.id },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json({ slots });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, startTime, endTime, dayOfWeek, daysToCreate, specificDate, isLocked } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    if (daysToCreate && Array.isArray(daysToCreate) && daysToCreate.length > 0) {
      // Batch create for all specified days of week
      await prisma.$transaction(
        daysToCreate.map((dow: number) =>
          prisma.blockedSlot.create({
            data: {
              userId: user.id,
              title,
              startTime,
              endTime,
              dayOfWeek: dow,
              isRecurring: true,
              isLocked: isLocked ?? true,
            },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    const slot = await prisma.blockedSlot.create({
      data: {
        userId: user.id,
        title,
        startTime,
        endTime,
        dayOfWeek: dayOfWeek !== undefined ? dayOfWeek : null,
        specificDate: specificDate ? new Date(specificDate) : null,
        isRecurring: true,
        isLocked: isLocked ?? true,
      },
    });

    return NextResponse.json({ success: true, slot });
  } catch (err) {
    return NextResponse.json({ error: "Lỗi tạo khung giờ bận" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing slot id" }, { status: 400 });

  await prisma.blockedSlot.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
