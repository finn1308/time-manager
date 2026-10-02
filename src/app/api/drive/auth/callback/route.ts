import { NextResponse } from "next/server";
import { getGoogleOAuth2Client, saveUserDriveTokens } from "@/lib/drive/google-drive";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const error = searchParams.get("error");

  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  const origin = host ? `${proto}://${host}` : (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  const redirectUri = `${origin}/api/drive/auth/callback`;

  if (error || !code) {
    return NextResponse.redirect(`${origin}/calendar?drive_error=${encodeURIComponent(error || "access_denied")}`);
  }

  let userId = "";
  let returnUrl = "/calendar";

  if (stateRaw) {
    try {
      const decoded = JSON.parse(Buffer.from(stateRaw, "base64").toString("utf-8"));
      userId = decoded.userId || "";
      returnUrl = decoded.returnUrl || "/calendar";
    } catch {
      // fallback
    }
  }

  if (!userId) {
    return NextResponse.redirect(`${origin}/calendar?drive_error=invalid_state`);
  }

  try {
    const oauth2Client = getGoogleOAuth2Client(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);

    await saveUserDriveTokens(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      id_token: tokens.id_token,
      scope: tokens.scope,
    });

    return NextResponse.redirect(`${origin}${returnUrl}${returnUrl.includes("?") ? "&" : "?"}drive_connected=true`);
  } catch (err: any) {
    console.error("Error exchanging Google Drive OAuth code:", err);
    return NextResponse.redirect(`${origin}/calendar?drive_error=token_exchange_failed`);
  }
}
