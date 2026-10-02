import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUserDriveClient,
  resolveStudyFolderHierarchy,
  checkFileExistsInFolder,
  uploadFileToDriveFolder,
} from "@/lib/drive/google-drive";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const subjectId = (formData.get("subjectId") as string) || null;
    let calendarEventId = (formData.get("calendarEventId") as string) || null;
    const subjectName = (formData.get("subjectName") as string) || "Chung";
    const sessionTitle = (formData.get("sessionTitle") as string) || "Buổi học";
    const duplicateAction = (formData.get("duplicateAction") as string) || "check"; // "check" | "use_existing" | "upload_anyway"

    if (!file) {
      return NextResponse.json({ error: "Không tìm thấy file tải lên" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF, JPG, PNG, WEBP." },
        { status: 400 }
      );
    }

    // Clean composite occurrence ID if applicable
    if (calendarEventId && calendarEventId.includes("_")) {
      calendarEventId = calendarEventId.split("_")[0];
    }

    // 1. Check Google Drive connection
    const drive = await getUserDriveClient(user.id);
    if (!drive) {
      return NextResponse.json(
        {
          error: "Chưa kết nối Google Drive",
          requiresDriveAuth: true,
          message: "Vui lòng kết nối Google Drive cá nhân để hệ thống tự động tải file và phân loại tài liệu vào thư mục riêng của bạn.",
        },
        { status: 400 }
      );
    }

    // 2. Resolve user settings for autoShare
    const userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id },
    });
    const autoShare = userSettings?.autoShareResources ?? false;

    // 3. Resolve folder hierarchy: Study Manager / [Subject] / [Session]
    const targetFolderId = await resolveStudyFolderHierarchy(drive, subjectName, sessionTitle);

    // 4. Duplicate file check
    const existingCheck = await checkFileExistsInFolder(drive, targetFolderId, file.name);

    if (existingCheck.exists && duplicateAction === "check") {
      return NextResponse.json({
        isDuplicate: true,
        fileName: file.name,
        existingFile: {
          id: existingCheck.file?.id,
          name: existingCheck.file?.name,
          webViewLink: existingCheck.file?.webViewLink,
        },
      });
    }

    if (existingCheck.exists && duplicateAction === "use_existing" && existingCheck.file) {
      // Use existing Google Drive file: simply create resource metadata
      const existingLink =
        existingCheck.file.webViewLink ||
        `https://drive.google.com/file/d/${existingCheck.file.id}/view`;

      const resource = await prisma.resource.create({
        data: {
          userId: user.id,
          calendarEventId,
          subjectId,
          title: file.name,
          type: "STORAGE",
          subType: file.type.startsWith("image/") ? "FILE_IMAGE" : "FILE_PDF",
          url: existingLink,
          externalFileId: existingCheck.file.id,
          mimeType: existingCheck.file.mimeType || file.type,
          fileSize: parseInt(existingCheck.file.size || "0", 10) || file.size,
        },
      });

      return NextResponse.json({
        success: true,
        reused: true,
        resource,
      });
    }

    // 5. Upload file buffer to Google Drive
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let finalFileName = file.name;
    if (existingCheck.exists && duplicateAction === "upload_anyway") {
      const ext = file.name.lastIndexOf(".") !== -1 ? file.name.slice(file.name.lastIndexOf(".")) : "";
      const baseName = file.name.lastIndexOf(".") !== -1 ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
      finalFileName = `${baseName} (${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }).replace(":", "h")})${ext}`;
    }

    const uploadResult = await uploadFileToDriveFolder(drive, {
      folderId: targetFolderId,
      fileName: finalFileName,
      mimeType: file.type,
      buffer,
      autoShare,
    });

    // 6. Save metadata to database (NO BINARY DATA!)
    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        calendarEventId,
        subjectId,
        title: finalFileName,
        type: "STORAGE",
        subType: file.type.startsWith("image/") ? "FILE_IMAGE" : "FILE_PDF",
        url: uploadResult.webViewLink,
        externalFileId: uploadResult.fileId,
        mimeType: uploadResult.mimeType,
        fileSize: uploadResult.size,
      },
    });

    return NextResponse.json({
      success: true,
      resource,
    });
  } catch (err: any) {
    console.error("Drive upload error:", err);
    return NextResponse.json(
      {
        error: "Upload thất bại: " + (err.message || "Vui lòng kiểm tra lại quyền Google Drive"),
        canRetry: true,
      },
      { status: 500 }
    );
  }
}
