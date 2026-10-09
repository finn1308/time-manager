import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const {
      name,
      category,
      level,
      targetLevel,
      specificGoal,
      weeklyHoursCommitment,
      deadline,
    } = data;

    if (!name || !targetLevel || !weeklyHoursCommitment) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if skill already exists for this user
    const existingSkill = await prisma.skill.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
    });

    if (existingSkill) {
      return NextResponse.json(
        { error: "Bạn đã có kỹ năng này rồi." },
        { status: 400 }
      );
    }

    const skill = await prisma.skill.create({
      data: {
        userId: user.id,
        name,
        category: category || "TECH",
        level: level || "BEGINNER",
        targetLevel,
        specificGoal,
        weeklyHoursCommitment,
        deadline: deadline ? new Date(deadline) : null,
        status: "LEARNING",
      },
    });

    // We can trigger an asynchronous AI analysis job here or let the client do it.
    // For now, return the created skill.
    return NextResponse.json(skill);
  } catch (error) {
    console.error("Error creating skill:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const skills = await prisma.skill.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
