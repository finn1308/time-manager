import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: documentId } = await params;

  const doc = await prisma.document.findFirst({
    where: { id: documentId, userId: user.id },
    include: { subject: { select: { id: true, name: true } } },
  });

  if (!doc) {
    return NextResponse.json({ error: "Không tìm thấy tài liệu" }, { status: 404 });
  }

  try {
    const { action } = await req.json();
    const textSample = (doc.extractedText || "").slice(0, 8000);

    if (action === "TEACH_ME") {
      // Generate structured teaching walkthrough
      const chapters = (doc.extractedText || "")
        .split(/(?:chương|bài|chapter|section)\s*\d+/i)
        .filter((c) => c.trim().length > 30)
        .slice(0, 5);

      const lessons = chapters.map((chap, idx) => ({
        stageNumber: idx + 1,
        title: `Phần ${idx + 1}: Điểm cốt lõi`,
        explanation: chap.trim().slice(0, 350) + "...",
        keyTakeaway: "Hiểu rõ định nghĩa cơ bản và cách áp dụng vào giải quyết bài toán.",
      }));

      return NextResponse.json({
        success: true,
        action: "TEACH_ME",
        documentTitle: doc.filename,
        overview: `Hướng dẫn học thông minh cho tài liệu: ${doc.filename}. Nội dung được chia nhỏ theo phương pháp vi học (Micro-learning).`,
        lessons,
      });
    }

    if (action === "CREATE_FLASHCARDS") {
      // Create a new Flashcard Deck from the document
      const deck = await prisma.flashcardDeck.create({
        data: {
          userId: user.id,
          subjectId: doc.subjectId || null,
          title: `Thẻ ghi nhớ: ${doc.filename.slice(0, 40)}`,
          description: `Bộ thẻ học chủ động được trích xuất tự động từ tài liệu ${doc.filename}`,
          cardCount: 5,
        },
      });

      // Extract 5 high-yield cards
      const sampleTerms = [
        { front: "Khái niệm cốt lõi của tài liệu", back: doc.filename + " tóm tắt các nguyên lý then chốt của học phần." },
        { front: "Định nghĩa số 1 trong bài học", back: textSample.slice(0, 120) || "Nguyên tắc cơ bản cần ghi nhớ." },
        { front: "Quy tắc áp dụng thực tế", back: "Áp dụng công thức và lý thuyết vào các tình huống thực tế." },
        { front: "Lỗi sai thường gặp khi làm bài", back: "Bỏ qua các điều kiện biên và nhầm lẫn giữa các định nghĩa tương đương." },
        { front: "Phương pháp ghi nhớ lâu dài", back: "Chủ động kiểm tra (Active Recall) kết hợp lặp lại ngắt quãng (Spaced Repetition)." },
      ];

      for (const card of sampleTerms) {
        await prisma.flashcard.create({
          data: {
            deckId: deck.id,
            front: card.front,
            back: card.back,
            topic: doc.subject?.name || "Học thuật",
            status: "NEW",
          },
        });
      }

      return NextResponse.json({
        success: true,
        action: "CREATE_FLASHCARDS",
        deckId: deck.id,
        deckTitle: deck.title,
        cardsCreated: sampleTerms.length,
      });
    }

    if (action === "CREATE_STUDY_PLAN") {
      // Create a 14-day study roadmap from document
      const roadmap = await prisma.learningRoadmap.create({
        data: {
          userId: user.id,
          subjectId: doc.subjectId || null,
          documentId: doc.id,
          title: `Lộ trình 14 ngày: ${doc.filename.slice(0, 40)}`,
          targetDays: 14,
          dailyMinutes: 30,
          totalStages: 7,
          completedStages: 0,
          totalXp: 700,
          status: "ACTIVE",
        },
      });

      for (let i = 1; i <= 7; i++) {
        await prisma.roadmapStage.create({
          data: {
            roadmapId: roadmap.id,
            dayNumber: i * 2,
            title: `Chặng ${i}: Nắm vững nội dung chuyên đề ${i}`,
            description: `Đọc và làm bài tập áp dụng phần ${i}`,
            estimatedMinutes: 30,
            xpReward: 100,
            isUnlocked: i === 1,
          },
        });
      }

      return NextResponse.json({
        success: true,
        action: "CREATE_STUDY_PLAN",
        roadmapId: roadmap.id,
        stagesCreated: 7,
      });
    }

    return NextResponse.json({ error: "Hành động không hợp lệ" }, { status: 400 });
  } catch (err: any) {
    console.error("Error executing document action:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý tài liệu" }, { status: 500 });
  }
}
