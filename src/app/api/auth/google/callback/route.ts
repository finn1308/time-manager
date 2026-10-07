import { NextResponse } from "next/server";
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const { searchParams, origin } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.redirect(`${origin}/login?error=GoogleAuthFailed`);
    }

    if (!code) {
      return NextResponse.redirect(`${origin}/login?error=NoCodeProvided`);
    }

    const redirectUri = `${origin}/api/auth/google/callback`;

    const oauth2Client = new google.auth.OAuth2(
      process.env.AUTH_GOOGLE_ID,
      process.env.AUTH_GOOGLE_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const userInfo = await oauth2.userinfo.get();
    const { email, name, picture } = userInfo.data;

    if (!email) {
      return NextResponse.redirect(`${origin}/login?error=NoEmailFromGoogle`);
    }

    // Upsert user based on email
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: name || "Google User",
          image: picture || null,
          role: "USER",
          timezone: "Asia/Ho_Chi_Minh",
        },
      });
    } else if (!user.image && picture) {
      // update image if none
      user = await prisma.user.update({
        where: { id: user.id },
        data: { image: picture },
      });
    }

    // Ensure account linking
    const existingAccount = await prisma.account.findFirst({
      where: { provider: "google", userId: user.id }
    });

    if (!existingAccount && userInfo.data.id) {
       await prisma.account.create({
         data: {
           userId: user.id,
           type: "oauth",
           provider: "google",
           providerAccountId: userInfo.data.id,
           access_token: tokens.access_token,
           expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
           token_type: tokens.token_type,
           scope: tokens.scope,
           id_token: tokens.id_token,
         }
       }).catch(e => console.error("Could not link account:", e));
    }

    // Create session (same as custom login)
    await createSession(user);

    return NextResponse.redirect(`${origin}/`);
  } catch (err: any) {
    console.error("Google OAuth Callback Error:", err);
    const { origin } = new URL(req.url);
    return NextResponse.redirect(`${origin}/login?error=GoogleCallbackFailed`);
  }
}
