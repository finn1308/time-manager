import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDriveAuthUrl } from "@/lib/drive/google-drive";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || "/calendar";

  const url = getDriveAuthUrl(user.id, returnUrl);
  return NextResponse.json({ url });
}
