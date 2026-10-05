import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { subjectId, message, chatHistory = [] } = await req.json();

    if (!subjectId || !message) {
      return NextResponse.json({ error: "Vui lòng chọn môn học và nhập tin nhắn" }, { status: 400 });
    }

    // 1. Fetch Subject context
    const [subject, notes, mistakes, concepts] = await Promise.all([
      prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      }),
      prisma.note.findMany({
        where: { subjectId, userId: user.id },
        select: { title: true, content: true },
        take: 3,
      }),
      prisma.mistakeRecord.findMany({
        where: { subjectId, userId: user.id, isResolved: false },
        select: { question: true, correctAnswer: true, concept: true, errorType: true },
        take: 5,
      }),
      prisma.knowledgeNode.findMany({
        where: { subjectId, userId: user.id },
        select: { title: true, chapter: true, masteryScore: true },
        take: 8,
      }),
    ]);

    if (!subject) {
      return NextResponse.json({ error: "Không tìm thấy môn học" }, { status: 404 });
    }

    // 2. Synthesize context-aware AI tutor response
    const contextSnippet = `
Môn học: ${subject.name} (${subject.code || "N/A"}). Giảng viên: ${subject.lecturer || "N/A"}.
Ghi chú bài học gần đây: ${notes.map((n) => n.title).join(", ") || "Chưa có"}
Lỗ hổng kiến thức / Lỗi sai đang gặp: ${
      mistakes.length > 0
        ? mistakes.map((m) => `Lỗi (${m.errorType}): "${m.question}" -> Đáp án đúng: "${m.correctAnswer}"`).join("; ")
        : "Không có lỗi sai nào chưa giải quyết"
    }
Chuyên đề trong môn: ${concepts.map((c) => `${c.title} (${Math.round(c.masteryScore * 100)}%)`).join(", ") || "Chưa tạo"}
`.trim();

    // Deterministic educational response generator tailored to the student's question & subject context
    let tutorResponse = "";
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("lỗ hổng") || lowerMsg.includes("yếu") || lowerMsg.includes("sai")) {
      if (mistakes.length > 0) {
        tutorResponse = `Chào bạn! Trong môn **${subject.name}**, tôi nhận thấy bạn đang có ${
          mistakes.length
        } điểm cần củng cố:\n\n${mistakes
          .map(
            (m, i) =>
              `${i + 1}. **${m.concept || "Chuyên đề"}** (Lỗi: ${m.errorType}):\n   - Câu hỏi: *${m.question}*\n   - Điểm mấu chốt: **${m.correctAnswer}**`
          )
          .join("\n\n")}\n\nLời khuyên: Bạn nên dành 15 phút ôn lại các khái niệm này trước khi làm tiếp bài tập mới!`;
      } else {
        tutorResponse = `Tuyệt vời! Hiện tại bạn không có lỗi sai nghiêm trọng nào chưa được giải quyết trong môn **${subject.name}**. Hãy tiếp tục phát huy và thử sức với các bài tập nâng cao nhé.`;
      }
    } else if (lowerMsg.includes("ôn thi") || lowerMsg.includes("chiến lược") || lowerMsg.includes("kỳ thi")) {
      tutorResponse = `Chiến lược ôn tập đề xuất cho môn **${subject.name}**:\n\n1. **Tuần 1 - Củng cố nền tảng:** Đọc lại các ghi chú (${
        notes.map((n) => n.title).join(", ") || "các chương chính"
      }).\n2. **Tuần 2 - Lấp lỗ hổng:** Làm lại các câu hỏi trong Ngân hàng lỗi sai (Mistake Bank).\n3. **Tuần 3 - Luyện đề tốc độ:** Bấm giờ 60-90 phút cho mỗi đề thi thử.\n\nBạn có muốn tôi tóm tắt chuyên đề nào cụ thể không?`;
    } else {
      tutorResponse = `Thầy/Cô gia sư AI môn **${subject.name}** xin chào bạn!\n\nDựa trên tài liệu và tiến độ học tập môn này, tôi khuyên bạn nên tập trung vào các điểm mấu chốt sau đối với câu hỏi "*${message}*":\n\n- **Khái niệm then chốt:** Hiểu sâu bản chất định nghĩa thay vì chỉ học thuộc vẹt công thức.\n- **Ứng dụng thực tế:** Liên hệ với bài tập hoặc dự án môn học hiện tại.\n- **Phương pháp ghi nhớ:** Sau khi đọc xong, hãy tự diễn giải lại bằng lời của mình mà không nhìn tài liệu (Active Recall).\n\nNếu cần giải thích chi tiết từng bước công thức hoặc dạng bài, hãy gửi nội dung đề bài cụ thể cho tôi nhé!`;
    }

    return NextResponse.json({
      success: true,
      subjectName: subject.name,
      reply: tutorResponse,
      contextUsed: {
        notesCount: notes.length,
        mistakesCount: mistakes.length,
        conceptsCount: concepts.length,
      },
    });
  } catch (err: any) {
    console.error("Error in Subject Tutor:", err);
    return NextResponse.json({ error: err.message || "Lỗi xử lý gia sư AI" }, { status: 500 });
  }
}
