import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { decryptApiKey } from "@/lib/crypto";
import { callGeminiGenerate } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { documentId, subjectId, deckId, newDeckTitle, customText, count = 10 } = await req.json();

    let textToAnalyze = customText?.trim() || "";
    let subjectName = "Chung";

    if (subjectId) {
      const sub = await prisma.subject.findUnique({
        where: { id: subjectId, userId: user.id },
        select: { name: true, description: true },
      });
      if (sub) {
        subjectName = sub.name;
        if (!textToAnalyze && sub.description) {
          textToAnalyze = `Môn học: ${sub.name}\n${sub.description}`;
        }
      }
    }

    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId, userId: user.id },
        select: { extractedText: true, filename: true },
      });
      if (doc && doc.extractedText) {
        textToAnalyze = doc.extractedText.slice(0, 15000); // 15k chars
        if (subjectName === "Chung") subjectName = doc.filename.replace(/\.pdf$/i, "");
      }
    }

    if (!textToAnalyze || textToAnalyze.length < 20) {
      return NextResponse.json(
        { error: "Vui lòng chọn tài liệu hoặc nhập nội dung kiến thức để tạo flashcard." },
        { status: 400 }
      );
    }

    // 1. Target Deck: find existing or create new
    let targetDeckId = deckId;
    if (!targetDeckId) {
      const title = newDeckTitle?.trim() || `Flashcards: ${subjectName}`;
      const newDeck = await prisma.flashcardDeck.create({
        data: {
          userId: user.id,
          title,
          subjectId: subjectId || null,
          description: `Bộ thẻ AI tạo tự động từ tài liệu học tập (${subjectName})`,
        },
      });
      targetDeckId = newDeck.id;
    }

    // 2. Fetch User AI API Key
    let plainApiKey: string | null = null;
    const keyRecord = await prisma.userApiKey.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (keyRecord) {
      try {
        plainApiKey = decryptApiKey(keyRecord.encryptedKey, keyRecord.iv, keyRecord.authTag);
      } catch (e) {
        console.warn("Failed to decrypt user key:", e);
      }
    }

    // 3. Generate Cards via AI or Fallback Extractor
    let generatedCards: Array<{ front: string; back: string; hint?: string; topic?: string }> = [];

    if (plainApiKey) {
      try {
        const prompt = `Bạn là chuyên gia sư phạm học tập thông minh. Hãy đọc nội dung sau và tạo ra ${count} thẻ Flashcard chất lượng cao theo phương pháp Spaced Repetition (Anki).
Quy tắc:
1. "front": Câu hỏi, thuật ngữ, hoặc bài toán ngắn gọn, kích thích tư duy chủ động (Active Recall).
2. "back": Câu trả lời, định nghĩa hoặc lời giải súc tích, đầy đủ, dễ nhớ.
3. "hint": Gợi ý ngắn để gợi mở nếu học viên quên.
4. "topic": Tên chủ đề con của thẻ.

Trả về kết quả ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown ngoài JSON):
{
  "flashcards": [
    {
      "front": "Khái niệm...",
      "back": "Định nghĩa...",
      "hint": "Gợi ý...",
      "topic": "Chủ đề..."
    }
  ]
}

Nội dung học tập:
"""
${textToAnalyze}
"""`;

        const res = await callGeminiGenerate({
          apiKey: plainApiKey,
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(res.text);
        if (Array.isArray(parsed.flashcards)) {
          generatedCards = parsed.flashcards;
        }
      } catch (aiErr) {
        console.warn("AI generation failed, using rule-based educational extractor:", aiErr);
      }
    }

    // Fallback rule-based card generator if AI fails or no key
    if (generatedCards.length === 0) {
      const lines = textToAnalyze
        .split("\n")
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 25);

      for (let i = 0; i < Math.min(count, lines.length); i++) {
        const line = lines[i];
        if (line.includes(":") || line.includes(" - ") || line.includes(" là ")) {
          const parts = line.split(/:\s*|\s*-\s*|\s+là\s+/);
          if (parts.length >= 2) {
            generatedCards.push({
              front: parts[0].trim() + " là gì?",
              back: parts.slice(1).join(": ").trim(),
              hint: `Kiến thức trong môn ${subjectName}`,
              topic: subjectName,
            });
            continue;
          }
        }
        generatedCards.push({
          front: `Khái niệm trọng tâm #${i + 1} (${subjectName})`,
          back: line,
          hint: `Đoạn kiến thức quan trọng trích xuất từ tài liệu`,
          topic: subjectName,
        });
      }
    }

    if (generatedCards.length === 0) {
      generatedCards.push({
        front: `Thuật ngữ chính trong ${subjectName}`,
        back: textToAnalyze.slice(0, 300),
        hint: `Xem lại tài liệu gốc`,
        topic: subjectName,
      });
    }

    // 4. Insert generated cards into DB
    const createdCards = await prisma.$transaction(
      generatedCards.map((c) =>
        prisma.flashcard.create({
          data: {
            deckId: targetDeckId,
            front: c.front,
            back: c.back,
            hint: c.hint || null,
            topic: c.topic || subjectName,
            status: "NEW",
            intervalDays: 1,
            easeFactor: 2.5,
            repetitionCount: 0,
            masteryLevel: 0,
          },
        })
      )
    );

    // Update deck card count
    await prisma.flashcardDeck.update({
      where: { id: targetDeckId },
      data: { cardCount: { increment: createdCards.length } },
    });

    return NextResponse.json({
      success: true,
      deckId: targetDeckId,
      cardsCount: createdCards.length,
      cards: createdCards,
    });
  } catch (err: any) {
    console.error("POST /api/flashcards/generate-ai error:", err);
    return NextResponse.json({ error: "Lỗi tạo flashcard bằng AI" }, { status: 500 });
  }
}
