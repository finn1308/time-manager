import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const certificates = await prisma.certificate.findMany({
      where: { userId: user.id },
      orderBy: [{ issueDate: "desc" }],
    });

    return NextResponse.json({ success: true, certificates });
  } catch (error: any) {
    console.error("GET /api/career/certificates error:", error);
    return NextResponse.json({ error: "Lỗi tải chứng chỉ: " + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      name,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      score,
      status = "ACTIVE",
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên chứng chỉ không được để trống" }, { status: 400 });
    }
    if (!issuer?.trim()) {
      return NextResponse.json({ error: "Đơn vị cấp không được để trống" }, { status: 400 });
    }

    const certificate = await prisma.certificate.create({
      data: {
        userId: user.id,
        name: name.trim(),
        issuer: issuer.trim(),
        issueDate: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId: credentialId?.trim() || null,
        credentialUrl: credentialUrl?.trim() || null,
        score: score?.trim() || null,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "CERTIFICATE",
        entityId: certificate.id,
        action: "CREATE",
        detailsJson: JSON.stringify({ name: certificate.name, issuer: certificate.issuer }),
      },
    });

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    console.error("POST /api/career/certificates error:", error);
    return NextResponse.json({ error: "Lỗi tạo chứng chỉ: " + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const {
      id,
      name,
      issuer,
      issueDate,
      expiryDate,
      credentialId,
      credentialUrl,
      score,
      status,
    } = body;

    if (!id) return NextResponse.json({ error: "Thiếu ID chứng chỉ" }, { status: 400 });

    const certificate = await prisma.certificate.update({
      where: { id, userId: user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(issuer && { issuer: issuer.trim() }),
        ...(issueDate && { issueDate: new Date(issueDate) }),
        ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
        ...(credentialId !== undefined && { credentialId: credentialId?.trim() || null }),
        ...(credentialUrl !== undefined && { credentialUrl: credentialUrl?.trim() || null }),
        ...(score !== undefined && { score: score?.trim() || null }),
        ...(status && { status }),
      },
    });

    return NextResponse.json({ success: true, certificate });
  } catch (error: any) {
    console.error("PUT /api/career/certificates error:", error);
    return NextResponse.json({ error: "Lỗi cập nhật chứng chỉ: " + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Thiếu ID chứng chỉ" }, { status: 400 });

  try {
    await prisma.certificate.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/career/certificates error:", error);
    return NextResponse.json({ error: "Lỗi xóa chứng chỉ: " + error.message }, { status: 500 });
  }
}
