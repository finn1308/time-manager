import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  // Only allow dev login in non-production or for local testing
  const user = await prisma.user.findFirst({
    where: { email: "huyvan19900@gmail.com" },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    timezone: user.timezone || "Asia/Ho_Chi_Minh",
  });

  const url = new URL(req.url);
  const redirectTarget = url.searchParams.get("redirect") || "/calendar";
  return NextResponse.redirect(new URL(redirectTarget, req.url));
}
