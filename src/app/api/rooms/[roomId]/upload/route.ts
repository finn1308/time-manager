import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { requireRoomAuth } from "@/lib/rooms/room-auth";
import fs from "fs";
import path from "path";
import crypto from "crypto";

// Allowed mime types for image uploads
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES_PER_UPLOAD = 10; // Supports up to 10 images at once

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

    const formData = await req.formData();
    // Support either multiple entries under "files" or single "file"
    const files: File[] = [];

    const fileEntries = formData.getAll("files");
    if (fileEntries.length > 0) {
      for (const entry of fileEntries) {
        if (entry instanceof File && entry.size > 0) {
          files.push(entry);
        }
      }
    }

    const singleFile = formData.get("file");
    if (singleFile instanceof File && singleFile.size > 0 && !files.includes(singleFile)) {
      files.push(singleFile);
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "Vui lòng chọn ít nhất một hình ảnh để tải lên" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES_PER_UPLOAD) {
      return NextResponse.json(
        { error: `Tối đa ${MAX_FILES_PER_UPLOAD} hình ảnh cho mỗi lần tải lên` },
        { status: 400 }
      );
    }

    // Validate file sizes and types
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Ảnh "${file.name}" vượt quá dung lượng tối đa cho phép (10MB)` },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json(
          { error: `File "${file.name}" không phải định dạng ảnh hợp lệ (chỉ chấp nhận JPEG, PNG, WEBP, GIF)` },
          { status: 400 }
        );
      }
    }

    // Target upload directory: public/uploads/rooms/[publicId]
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "rooms",
      auth.room.publicId
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const uploadedUrls: string[] = [];
    const uploadedFiles: Array<{ name: string; url: string; size: number; type: string }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = path.extname(file.name) || ".jpg";
      const randomSuffix = crypto.randomBytes(6).toString("hex");
      const safeName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, "_")
        .slice(0, 40);
      const fileName = `${Date.now()}_${randomSuffix}_${safeName}`;
      const filePath = path.join(uploadDir, fileName);

      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/rooms/${auth.room.publicId}/${fileName}`;
      uploadedUrls.push(publicUrl);
      uploadedFiles.push({
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Đã tải lên thành công ${uploadedUrls.length} hình ảnh`,
      count: uploadedUrls.length,
      urls: uploadedUrls,
      files: uploadedFiles,
    });
  } catch (err: any) {
    if (err.message === "UNAUTHORIZED_ROOM_ACCESS") {
      return NextResponse.json({ error: "Không có quyền truy cập phòng họp" }, { status: 403 });
    }
    console.error("Room image upload error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi tải ảnh lên phòng họp" }, { status: 500 });
  }
}
