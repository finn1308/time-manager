import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const { title, url } = data;

    if (!title || !url) {
      return NextResponse.json({ error: "Missing title or url" }, { status: 400 });
    }

    const skill = await prisma.skill.findUnique({
      where: { id },
    });

    if (!skill || skill.userId !== user.id) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        skillId: skill.id,
        title,
        url,
        type: "LEARNING",
      },
    });

    return NextResponse.json(resource);
  } catch (error: any) {
    console.error("Error adding resource:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
