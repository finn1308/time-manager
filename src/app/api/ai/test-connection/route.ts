import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { provider, apiKey } = await req.json();

    let targetKey = apiKey;

    // If no direct key passed, check stored key in DB
    if (!targetKey) {
      const storedKey = await prisma.userApiKey.findUnique({
        where: {
          userId_provider: {
            userId: user.id,
            provider,
          },
        },
      });

      if (!storedKey) {
        return NextResponse.json({ error: "Chưa có API key nào được lưu cho nhà cung cấp này" }, { status: 404 });
      }

      targetKey = decryptApiKey(storedKey.encryptedKey, storedKey.iv, storedKey.authTag);
    }

    if (!targetKey) {
      return NextResponse.json({ error: "API Key không hợp lệ" }, { status: 400 });
    }

    // Ping the corresponding AI provider
    if (provider === "GEMINI") {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${targetKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: "ping" }] }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Gemini API trả về lỗi: ${res.status} - ${errText.slice(0, 120)}` }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Kết nối Google Gemini thành công!" });
    } else if (provider === "OPENAI") {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${targetKey}` },
      });

      if (!res.ok) {
        return NextResponse.json({ error: `OpenAI API xác thực thất bại (${res.status})` }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Kết nối OpenAI thành công!" });
    } else if (provider === "ANTHROPIC") {
      const res = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": targetKey,
          "anthropic-version": "2023-06-01",
        },
      });

      if (!res.ok) {
        return NextResponse.json({ error: `Anthropic API xác thực thất bại (${res.status})` }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: "Kết nối Anthropic Claude thành công!" });
    }

    return NextResponse.json({ error: "Nhà cung cấp không được hỗ trợ" }, { status: 400 });
  } catch (err: any) {
    console.error("Test AI connection error:", err);
    return NextResponse.json({ error: err.message || "Lỗi kiểm tra kết nối AI" }, { status: 500 });
  }
}
