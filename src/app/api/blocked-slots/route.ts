import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const slotsCache = new Map<string, { data: any; expiresAt: number }>();
const SLOTS_CACHE_TTL_MS = 30_000;

export function invalidateSlotsCache(userId?: string) {
  if (userId) {
    slotsCache.delete(userId);
  } else {
    slotsCache.clear();
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const cached = slotsCache.get(user.id);
  if (cached && Date.now() < cached.expiresAt) {
    return NextResponse.json(cached.data);
  }

  const rules = await prisma.availabilityRule.findMany({
    where: { userId: user.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  const payload = { rules, slots: rules };
  slotsCache.set(user.id, { data: payload, expiresAt: Date.now() + SLOTS_CACHE_TTL_MS });

  return NextResponse.json(payload);
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, startTime, endTime, dayOfWeek, daysToCreate, isAvailable } = await req.json();

    if (!title || !startTime || !endTime) {
      return NextResponse.json({ error: "Thiếu thông tin tiêu đề hoặc khung giờ" }, { status: 400 });
    }

    const available = isAvailable !== undefined ? !!isAvailable : false; // Default to blocked/busy if created from blocked-slots

    if (daysToCreate && Array.isArray(daysToCreate) && daysToCreate.length > 0) {
      await prisma.$transaction(
        daysToCreate.map((dow: number) =>
          prisma.availabilityRule.create({
            data: {
              userId: user.id,
              title,
              startTime,
              endTime,
              dayOfWeek: dow,
              isAvailable: available,
              timezone: "Asia/Ho_Chi_Minh",
            },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    const rule = await prisma.availabilityRule.create({
      data: {
        userId: user.id,
        title,
        startTime,
        endTime,
        dayOfWeek: dayOfWeek !== undefined ? parseInt(dayOfWeek, 10) : 1,
        isAvailable: available,
        timezone: "Asia/Ho_Chi_Minh",
      },
    });

    return NextResponse.json({ success: true, rule, slot: rule });
  } catch (err: any) {
    console.error("Create availability rule error:", err);
    return NextResponse.json({ error: "Lỗi tạo khung giờ khả dụng" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing rule id" }, { status: 400 });

  await prisma.availabilityRule.delete({
    where: { id, userId: user.id },
  });

  return NextResponse.json({ success: true });
}
