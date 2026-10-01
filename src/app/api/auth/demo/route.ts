import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function POST() {
  try {
    let demoUser = await prisma.user.findUnique({
      where: { email: "demo@chronomind.app" },
    });

    if (!demoUser) {
      demoUser = await prisma.user.create({
        data: {
          name: "Huy Nguyen (Demo)",
          email: "demo@chronomind.app",
          timezone: "Asia/Ho_Chi_Minh",
        },
      });
    }

    await createSession(demoUser);

    return NextResponse.json({ success: true, user: demoUser });
  } catch (err) {
    console.error("Demo login error:", err);
    return NextResponse.json({ error: "Lỗi đăng nhập tài khoản demo" }, { status: 500 });
  }
}
