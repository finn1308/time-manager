import { NextResponse } from "next/server";
import { getCurrentUser, invalidateUserCache } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
  newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Xác nhận mật khẩu không khớp",
  path: ["confirmPassword"],
}).refine((data) => data.newPassword !== "12345678", {
  message: "Mật khẩu mới không được trùng với mật khẩu tạm mặc định (12345678)",
  path: ["newPassword"],
});

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });
    }

    const { newPassword } = parsed.data;
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        mustChangePassword: false,
      },
    });

    invalidateUserCache(user.id);

    return NextResponse.json({
      success: true,
      message: "Đổi mật khẩu thành công. Bây giờ bạn có thể sử dụng đầy đủ các tính năng của phòng họp.",
    });
  } catch (err: any) {
    console.error("Change password error:", err);
    return NextResponse.json({ error: "Lỗi hệ thống khi đổi mật khẩu" }, { status: 500 });
  }
}
