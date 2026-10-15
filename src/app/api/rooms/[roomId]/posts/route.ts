import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireRoomAuth, recordRoomAudit } from "@/lib/rooms/room-auth";
import { z } from "zod";

const createPostSchema = z.object({
  content: z.string().min(1, "Nội dung bài viết không được để trống").max(3000),
  groupId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable().or(z.literal("")),
  imageUrls: z.array(z.string()).optional().default([]),
  attachmentUrl: z.string().optional().nullable().or(z.literal("")),
  attachmentName: z.string().max(100).optional().nullable(),
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
    const filter = searchParams.get("filter"); // "my" | "all"
    const groupId = searchParams.get("groupId");

    const whereClause: any = {
      roomId: auth.room.id,
    };

    if (filter === "my") {
      whereClause.authorId = user.id;
    }
    if (groupId) {
      whereClause.groupId = groupId;
    }

    const posts = await prisma.roomActivityPost.findMany({
      where: whereClause,
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        group: { select: { id: true, name: true, color: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = posts.map((p) => {
      const images = (p.imageUrls && p.imageUrls.length > 0)
        ? p.imageUrls
        : (p.imageUrl ? [p.imageUrl] : []);

      return {
        id: p.id,
        content: p.content,
        imageUrl: images.length > 0 ? images[0] : null,
        imageUrls: images,
        attachmentUrl: p.attachmentUrl,
        attachmentName: p.attachmentName,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        author: p.author,
        group: p.group,
        isOwner: p.authorId === user.id,
        canDelete: p.authorId === user.id || auth.isAdmin,
      };
    });

    return NextResponse.json({ posts: formatted });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("List posts error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải bài viết" }, { status: 500 });
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

    // Check if user must change password
    const userDb = await prisma.user.findUnique({
      where: { id: user.id },
      select: { mustChangePassword: true },
    });
    if (userDb?.mustChangePassword) {
      return NextResponse.json(
        { error: "Vui lòng đổi mật khẩu trước khi đăng bài", mustChangePassword: true },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { content, groupId, imageUrl, imageUrls, attachmentUrl, attachmentName } = parsed.data;

    // Combine imageUrl and imageUrls
    let allImages = imageUrls ? [...imageUrls] : [];
    if (imageUrl && !allImages.includes(imageUrl)) {
      allImages = [imageUrl, ...allImages];
    }
    const primaryImage = allImages.length > 0 ? allImages[0] : null;

    // If groupId, verify it belongs to room
    if (groupId) {
      const group = await prisma.roomGroup.findUnique({
        where: { id: groupId },
      });
      if (!group || group.roomId !== auth.room.id) {
        return NextResponse.json({ error: "Nhóm không thuộc phòng họp này" }, { status: 400 });
      }
    }

    const post = await prisma.roomActivityPost.create({
      data: {
        roomId: auth.room.id,
        authorId: user.id,
        groupId: groupId || null,
        content,
        imageUrl: primaryImage,
        imageUrls: allImages,
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
      },
      include: {
        author: { select: { id: true, name: true, image: true, email: true } },
        group: { select: { id: true, name: true, color: true } },
      },
    });

    await recordRoomAudit({
      roomId: auth.room.id,
      actorId: user.id,
      action: "POST_CREATED",
      entityType: "POST",
      entityId: post.id,
      details: { imageCount: allImages.length, hasAttachment: !!attachmentUrl },
    });

    return NextResponse.json({
      success: true,
      post: {
        ...post,
        isOwner: true,
        canDelete: true,
      },
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập" }, { status: 403 });
    }
    console.error("Create post error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đăng bài" }, { status: 500 });
  }
}
