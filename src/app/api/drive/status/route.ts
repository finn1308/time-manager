import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkDriveConnectionStatus, disconnectUserDrive } from "@/lib/drive/google-drive";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = await checkDriveConnectionStatus(user.id);
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  });

  return NextResponse.json({
    connected: status.connected,
    email: status.email,
    autoShare: settings?.autoShareResources ?? false,
    remindMissingResources: settings?.remindMissingResources ?? true,
    hasOAuthCredentials: Boolean(
      (process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID) &&
      (process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET)
    ),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { action, autoShare, remindMissingResources } = await req.json();

    if (action === "disconnect") {
      await disconnectUserDrive(user.id);
      return NextResponse.json({ success: true, connected: false });
    }

    if (typeof autoShare === "boolean" || typeof remindMissingResources === "boolean") {
      const updated = await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: {
          autoShareResources: typeof autoShare === "boolean" ? autoShare : undefined,
          remindMissingResources: typeof remindMissingResources === "boolean" ? remindMissingResources : undefined,
        },
        create: {
          userId: user.id,
          autoShareResources: typeof autoShare === "boolean" ? autoShare : false,
          remindMissingResources: typeof remindMissingResources === "boolean" ? remindMissingResources : true,
        },
      });
      return NextResponse.json({
        success: true,
        autoShare: updated.autoShareResources,
        remindMissingResources: updated.remindMissingResources,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
