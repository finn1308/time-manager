import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDriveAuthUrl } from "@/lib/drive/google-drive";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const returnUrl = searchParams.get("returnUrl") || "/calendar";

  // Dynamically resolve callback URI based on current request host/proto
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : new URL(req.url).origin;
  const redirectUri = `${origin}/api/drive/auth/callback`;

  const url = getDriveAuthUrl(user.id, returnUrl, redirectUri);
  return NextResponse.json({ url });
}
