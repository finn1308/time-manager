import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { encryptApiKey } from "@/lib/crypto";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.userApiKey.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      provider: true,
      isActive: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "Vui lòng chọn nhà cung cấp và nhập API key" }, { status: 400 });
    }

    if (apiKey.length < 8) {
      return NextResponse.json({ error: "API Key quá ngắn" }, { status: 400 });
    }

    // Encrypt with AES-256-GCM
    const { encryptedKey, iv, authTag } = encryptApiKey(apiKey);

    const saved = await prisma.userApiKey.upsert({
      where: {
        userId_provider: {
          userId: user.id,
          provider,
        },
      },
      update: {
        encryptedKey,
        iv,
        authTag,
        isActive: true,
      },
      create: {
        userId: user.id,
        provider,
        encryptedKey,
        iv,
        authTag,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: saved.id,
        provider: saved.provider,
        isActive: saved.isActive,
        updatedAt: saved.updatedAt,
      },
    });
  } catch (err: any) {
    console.error("Save API key error:", err);
    return NextResponse.json({ error: "Lỗi mã hóa và lưu trữ API Key" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider");
  if (!provider) return NextResponse.json({ error: "Missing provider" }, { status: 400 });

  await prisma.userApiKey.deleteMany({
    where: { userId: user.id, provider },
  });

  return NextResponse.json({ success: true });
}
