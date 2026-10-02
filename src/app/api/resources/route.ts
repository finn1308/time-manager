import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  let calendarEventId = searchParams.get("calendarEventId");
  const subjectId = searchParams.get("subjectId");

  if (calendarEventId && calendarEventId.includes("_")) {
    calendarEventId = calendarEventId.split("_")[0];
  }

  const whereClause: any = { userId: user.id };
  if (calendarEventId) whereClause.calendarEventId = calendarEventId;
  if (subjectId) whereClause.subjectId = subjectId;

  const resources = await prisma.resource.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ resources });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { title, url, type, subType, calendarEventId, subjectId, externalFileId, mimeType, fileSize } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập đường dẫn (URL)" }, { status: 400 });
    }

    let cleanEventId = calendarEventId;
    if (cleanEventId && cleanEventId.includes("_")) {
      cleanEventId = cleanEventId.split("_")[0];
    }

    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        calendarEventId: cleanEventId || null,
        subjectId: subjectId || null,
        title: title?.trim() || url,
        type: type || "OTHER",
        subType: subType || null,
        url: url.trim(),
        externalFileId: externalFileId || null,
        mimeType: mimeType || null,
        fileSize: fileSize || null,
      },
    });

    return NextResponse.json({ success: true, resource });
  } catch (err: any) {
    console.error("Create resource error:", err);
    return NextResponse.json({ error: "Lỗi lưu tài nguyên: " + (err.message || "Vui lòng thử lại") }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "Thiếu ID tài nguyên" }, { status: 400 });

  try {
    const existing = await prisma.resource.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Tài nguyên không tồn tại hoặc đã bị xóa" }, { status: 404 });
    }

    await prisma.resource.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Delete resource error:", err);
    return NextResponse.json({ error: "Lỗi xóa tài nguyên" }, { status: 500 });
  }
}
