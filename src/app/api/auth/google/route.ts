import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  try {
    const { origin } = new URL(req.url);
    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      redirectUri
    );

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "online",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
      ],
      prompt: "consent",
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (err: any) {
    console.error("Google OAuth error:", err);
    return NextResponse.json({ error: "Lỗi khởi tạo đăng nhập Google" }, { status: 500 });
  }
}
