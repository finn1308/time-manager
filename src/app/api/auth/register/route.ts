import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email và mật khẩu không được để trống" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Mật khẩu phải có tối thiểu 6 ký tự" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: "Email này đã được đăng ký" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: normalizedEmail,
        passwordHash,
        timezone: "Asia/Ho_Chi_Minh",
        userSettings: {
          create: {
            timezone: "Asia/Ho_Chi_Minh",
            weekStartDay: 1,
            language: "vi",
          },
        },
        aiPreferences: {
          create: {
            preferredStudyDuration: 90,
            preferredBreakDuration: 15,
            preferredStudyDays: "1,2,3,4,5,6,0",
            preferredTimeRanges: "14:00-17:00,19:00-22:30",
            maxDailyStudyHours: 6.0,
          },
        },
      },
    });

    await createSession(user);

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đăng ký" }, { status: 500 });
  }
}
