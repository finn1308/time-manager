import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const subjectId = searchParams.get("subjectId");

  const whereClause: any = { userId: user.id };
  if (subjectId && subjectId !== "ALL") whereClause.subjectId = subjectId;

  try {
    const [nodes, prerequisites] = await Promise.all([
      prisma.knowledgeNode.findMany({
        where: whereClause,
        include: {
          subject: { select: { id: true, name: true, color: true } },
        },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
      prisma.knowledgePrerequisite.findMany({
        where: {
          node: { userId: user.id },
        },
        include: {
          node: { select: { id: true, title: true, masteryScore: true } },
          prerequisite: { select: { id: true, title: true, masteryScore: true } },
        },
      }),
    ]);

    // Check for unmet prerequisites
    const warnings: Array<{
      nodeId: string;
      nodeTitle: string;
      prerequisiteId: string;
      prerequisiteTitle: string;
      currentMastery: number;
      requiredMastery: number;
      message: string;
    }> = [];

    prerequisites.forEach((p) => {
      if (p.prerequisite.masteryScore < p.requiredMastery) {
        warnings.push({
          nodeId: p.node.id,
          nodeTitle: p.node.title,
          prerequisiteId: p.prerequisite.id,
          prerequisiteTitle: p.prerequisite.title,
          currentMastery: Math.round(p.prerequisite.masteryScore * 100),
          requiredMastery: Math.round(p.requiredMastery * 100),
          message: `Khái niệm "${p.node.title}" yêu cầu kiến thức tiên quyết "${p.prerequisite.title}" đạt tối thiểu ${Math.round(
            p.requiredMastery * 100
          )}% (hiện tại: ${Math.round(p.prerequisite.masteryScore * 100)}%). Hãy ôn lại trước khi tiếp tục!`,
        });
      }
    });

    return NextResponse.json({
      success: true,
      nodes,
      edges: prerequisites.map((p) => ({
        id: p.id,
        source: p.prerequisiteId,
        target: p.nodeId,
        requiredMastery: p.requiredMastery,
      })),
      warnings,
    });
  } catch (err: any) {
    console.error("Error fetching knowledge graph:", err);
    return NextResponse.json({ error: err.message || "Lỗi tải cây kiến thức" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, subjectId, title, chapter, topic, description, importance, nodeId, prerequisiteId, requiredMastery } = body;

    if (action === "LINK_PREREQUISITE") {
      if (!nodeId || !prerequisiteId) {
        return NextResponse.json({ error: "Thiếu nodeId hoặc prerequisiteId" }, { status: 400 });
      }

      const link = await prisma.knowledgePrerequisite.upsert({
        where: {
          nodeId_prerequisiteId: { nodeId, prerequisiteId },
        },
        create: {
          nodeId,
          prerequisiteId,
          requiredMastery: Number(requiredMastery) || 0.6,
        },
        update: {
          requiredMastery: Number(requiredMastery) || 0.6,
        },
      });

      return NextResponse.json({ success: true, link });
    }

    // Default: Create new KnowledgeNode
    if (!title) {
      return NextResponse.json({ error: "Vui lòng nhập tên khái niệm / bài học" }, { status: 400 });
    }

    const node = await prisma.knowledgeNode.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        title,
        chapter: chapter || null,
        topic: topic || null,
        description: description || null,
        importance: importance || "CORE",
        masteryScore: 0.0,
      },
      include: {
        subject: { select: { id: true, name: true, color: true } },
      },
    });

    return NextResponse.json({ success: true, node });
  } catch (err: any) {
    console.error("Error updating knowledge graph:", err);
    return NextResponse.json({ error: err.message || "Lỗi cập nhật cây kiến thức" }, { status: 500 });
  }
}
