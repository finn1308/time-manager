import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractUrlsFromText, classifyUrl } from "@/lib/ai/link-classifier";
import { getDateKeyVN, formatVN, VIETNAM_TIMEZONE } from "@/lib/date-utils";
import { decryptApiKey } from "@/lib/crypto";
import { addDays, subDays } from "date-fns";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { text, currentCalendarEventId, currentSubjectId, autoSave = true } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Vui lòng nhập nội dung hoặc link" }, { status: 400 });
    }

    const rawUrls = extractUrlsFromText(text);
    if (rawUrls.length === 0) {
      return NextResponse.json({
        error: "Không tìm thấy đường link hợp lệ trong tin nhắn. Vui lòng gửi kèm URL (ví dụ: https://zoom.us/...).",
      }, { status: 400 });
    }

    const firstUrl = rawUrls[0];
    const classified = classifyUrl(firstUrl);

    // 1. Fetch user's subjects
    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, code: true, color: true },
    });

    // 2. Fetch upcoming and recent calendar events (range: -2 days to +14 days)
    const now = new Date();
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: subDays(now, 2),
          lte: addDays(now, 14),
        },
        isCancelled: false,
      },
      include: { subject: true },
      orderBy: { startTime: "asc" },
    });

    let targetEvent: any = null;
    let targetSubject: any = null;
    let candidates: any[] = [];
    let isAmbiguous = false;

    // Case A: Context already provided (e.g. user is actively viewing/editing an event)
    if (currentCalendarEventId) {
      const cleanId = currentCalendarEventId.includes("_")
        ? currentCalendarEventId.split("_")[0]
        : currentCalendarEventId;
      targetEvent = calendarEvents.find((e) => e.id === cleanId) || await prisma.calendarEvent.findFirst({
        where: { id: cleanId, userId: user.id },
        include: { subject: true },
      });
      if (targetEvent?.subject) {
        targetSubject = targetEvent.subject;
      }
    } else if (currentSubjectId) {
      targetSubject = subjects.find((s) => s.id === currentSubjectId);
    }

    // Case B: No explicit context, analyze text with Subject & Event matching
    if (!targetEvent) {
      const lower = text.toLowerCase();

      // Check Gemini AI if user has an active key
      const apiKeyRecord = await prisma.userApiKey.findFirst({
        where: { userId: user.id, isActive: true },
      });

      let aiSuggestedSubjectName = "";
      let aiSuggestedSessionTitle = "";

      if (apiKeyRecord && apiKeyRecord.provider === "GEMINI") {
        try {
          const plainKey = decryptApiKey(
            apiKeyRecord.encryptedKey,
            apiKeyRecord.iv,
            apiKeyRecord.authTag
          );
          const prompt = `Phân tích câu nói của người dùng sau:
"${text}"
Danh sách môn học hiện có: ${subjects.map(s => s.name).join(", ")}.
Hãy trích xuất dưới định dạng JSON duy nhất:
{
  "subjectName": "Tên môn nếu được nhắc đến hoặc suy đoán, để trống nếu không có",
  "sessionQuery": "Buổi học hoặc ngày nếu được nhắc đến (ví dụ: Ngày 1, Hôm nay, Ngày mai, 19:00), để trống nếu không có",
  "customTitle": "Tiêu đề phù hợp cho tài nguyên này (ví dụ: Zoom IELTS Ngày 1, Slide bài giảng)"
}`;
          const { callGeminiGenerate } = await import("@/lib/ai/gemini");
          const { text: aiOutput } = await callGeminiGenerate({
            apiKey: plainKey,
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
          });
          const cleanOutput = aiOutput.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanOutput);
          aiSuggestedSubjectName = parsed.subjectName || "";
          aiSuggestedSessionTitle = parsed.sessionQuery || "";
          if (parsed.customTitle) {
            classified.suggestedTitle = parsed.customTitle;
          }
        } catch (aiErr) {
          console.warn("Gemini link parsing fallback to heuristic:", aiErr);
        }
      }

      // Match Subject
      let matchedSubjects = subjects.filter((s) => {
        const subName = s.name.toLowerCase();
        const subCode = s.code?.toLowerCase();
        return (
          lower.includes(subName) ||
          (subCode && lower.includes(subCode)) ||
          (aiSuggestedSubjectName && subName.includes(aiSuggestedSubjectName.toLowerCase()))
        );
      });

      if (matchedSubjects.length === 1) {
        targetSubject = matchedSubjects[0];
      }

      // Filter events by subject if matched
      let matchingEvents = calendarEvents;
      if (targetSubject) {
        matchingEvents = calendarEvents.filter((e) => e.subjectId === targetSubject.id);
      }

      // Further filter by text clues (e.g. "ngày 1", "day 1", "hôm nay", "ngày mai")
      if (lower.includes("hôm nay") || lower.includes("today")) {
        const todayKey = getDateKeyVN(new Date());
        matchingEvents = matchingEvents.filter((e) => getDateKeyVN(e.startTime) === todayKey);
      } else if (lower.includes("ngày mai") || lower.includes("tomorrow")) {
        const tomorrowKey = getDateKeyVN(addDays(new Date(), 1));
        matchingEvents = matchingEvents.filter((e) => getDateKeyVN(e.startTime) === tomorrowKey);
      }

      // Check number match (e.g. "ngày 1", "bài 1", "day 1", "unit 1")
      const sessionNumberMatch = lower.match(/(?:ngày|day|buổi|bài|unit|chương|chapter)\s*(\d+)/i);
      if (sessionNumberMatch) {
        const num = sessionNumberMatch[1];
        const numFiltered = matchingEvents.filter(
          (e) => e.title.toLowerCase().includes(num) || (e.description && e.description.toLowerCase().includes(num))
        );
        if (numFiltered.length > 0) {
          matchingEvents = numFiltered;
        }
      }

      if (matchingEvents.length === 1) {
        targetEvent = matchingEvents[0];
        if (!targetSubject && targetEvent.subject) {
          targetSubject = targetEvent.subject;
        }
      } else if (matchingEvents.length > 1) {
        // Ambiguous: multiple potential sessions
        isAmbiguous = true;
        candidates = matchingEvents.slice(0, 4).map((e) => ({
          id: e.id,
          title: e.title,
          subjectName: e.subject?.name || "Môn học",
          timeFormatted: `${formatVN(e.startTime, "dd/MM")} (${formatVN(e.startTime, "HH:mm")} - ${formatVN(e.endTime, "HH:mm")})`,
        }));
      }
    }

    // Auto-save resource if context is clear and autoSave is requested
    let savedResource = null;
    if (autoSave && targetEvent && !isAmbiguous) {
      savedResource = await prisma.resource.create({
        data: {
          userId: user.id,
          calendarEventId: targetEvent.id,
          subjectId: targetSubject?.id || targetEvent.subjectId || null,
          title: classified.suggestedTitle,
          type: classified.type,
          subType: classified.subType,
          url: classified.originalUrl,
        },
      });
    }

    return NextResponse.json({
      success: true,
      classified,
      targetEvent: targetEvent
        ? {
            id: targetEvent.id,
            title: targetEvent.title,
            subjectName: targetSubject?.name || targetEvent.subject?.name,
            timeFormatted: `${formatVN(targetEvent.startTime, "dd/MM")} (${formatVN(targetEvent.startTime, "HH:mm")} - ${formatVN(targetEvent.endTime, "HH:mm")})`,
          }
        : null,
      targetSubject: targetSubject
        ? { id: targetSubject.id, name: targetSubject.name }
        : null,
      isAmbiguous,
      candidates,
      savedResource,
      message: targetEvent
        ? `Đã nhận diện link ${classified.badgeLabel} và gắn vào buổi học "${targetEvent.title}".`
        : isAmbiguous
        ? `Tìm thấy ${candidates.length} buổi học phù hợp. Bạn muốn gắn link này vào buổi nào?`
        : `Đã phân loại link: ${classified.badgeLabel}. Bạn có thể chọn buổi học để lưu.`,
    });
  } catch (err: any) {
    console.error("Parse resource error:", err);
    return NextResponse.json({ error: "Lỗi phân tích link: " + (err.message || "Vui lòng thử lại") }, { status: 500 });
  }
}
