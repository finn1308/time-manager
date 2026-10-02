import {
  getDateKeyVN,
  getDayOfWeekVN,
  makeVNDate,
  VIETNAM_TIMEZONE,
} from "@/lib/date-utils";
import { addDays, parseISO } from "date-fns";

export interface ParsedTaskResult {
  title: string;
  subjectId: string | null;
  subjectName?: string | null;
  deadline: Date | null;
  estimatedMinutes: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "INBOX" | "TODO";
  rawText: string;
}

export function parseNaturalLanguageTask(
  text: string,
  userSubjects: Array<{ id: string; name: string; code?: string | null }>
): ParsedTaskResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. Identify Priority
  let priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" = "MEDIUM";
  if (
    lower.includes("#urgent") ||
    lower.includes("!urgent") ||
    lower.includes("gấp") ||
    lower.includes("khẩn cấp") ||
    lower.includes("p1")
  ) {
    priority = "URGENT";
  } else if (
    lower.includes("#high") ||
    lower.includes("quan trọng") ||
    lower.includes("ưu tiên cao") ||
    lower.includes("p2")
  ) {
    priority = "HIGH";
  } else if (lower.includes("#low") || lower.includes("ưu tiên thấp") || lower.includes("p4")) {
    priority = "LOW";
  } else if (lower.includes("#medium") || lower.includes("p3")) {
    priority = "MEDIUM";
  }

  // 2. Identify Subject
  let matchedSubject: { id: string; name: string; code?: string | null } | null = null;
  for (const sub of userSubjects) {
    const subNameLower = sub.name.toLowerCase();
    const subCodeLower = sub.code ? sub.code.toLowerCase() : null;
    if (lower.includes(subNameLower) || (subCodeLower && lower.includes(subCodeLower))) {
      matchedSubject = sub;
      break;
    }
  }

  // 3. Extract Duration (e.g. 90 phút, 2 tiếng, 1 giờ, 45p, 30m, 1h30)
  let estimatedMinutes = 60;
  const hourMinMatch = lower.match(/(\d+)\s*(?:tiếng|giờ|h)\s*(\d+)\s*(?:phút|p|m)?/);
  const minMatch = lower.match(/(\d+)\s*(?:phút|mins?|p|m\b)/);
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:tiếng|giờ|h\b)/);

  if (hourMinMatch) {
    estimatedMinutes = parseInt(hourMinMatch[1], 10) * 60 + parseInt(hourMinMatch[2], 10);
  } else if (minMatch) {
    estimatedMinutes = parseInt(minMatch[1], 10);
  } else if (hourMatch) {
    estimatedMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
  }

  // 4. Extract Deadline Date in Vietnam Timezone
  const todayKeyVN = getDateKeyVN(new Date());
  const todayBase = parseISO(todayKeyVN);
  let targetDayKey = todayKeyVN;
  let hasExplicitDate = false;

  // Day of week detection
  let requestedDow: number | null = null;
  if (lower.includes("thứ 2") || lower.includes("thứ hai")) requestedDow = 1;
  else if (lower.includes("thứ 3") || lower.includes("thứ ba")) requestedDow = 2;
  else if (lower.includes("thứ 4") || lower.includes("thứ tư")) requestedDow = 3;
  else if (lower.includes("thứ 5") || lower.includes("thứ năm")) requestedDow = 4;
  else if (lower.includes("thứ 6") || lower.includes("thứ sáu")) requestedDow = 5;
  else if (lower.includes("thứ 7") || lower.includes("thứ bảy")) requestedDow = 6;
  else if (lower.includes("chủ nhật") || lower.includes("cn")) requestedDow = 0;

  if (requestedDow !== null) {
    const todayDow = getDayOfWeekVN(new Date());
    let diff = requestedDow - todayDow;
    if (diff <= 0) diff += 7;
    targetDayKey = getDateKeyVN(addDays(todayBase, diff));
    hasExplicitDate = true;
  } else if (lower.includes("ngày mai") || lower.includes("mai")) {
    targetDayKey = getDateKeyVN(addDays(todayBase, 1));
    hasExplicitDate = true;
  } else if (lower.includes("ngày kia") || lower.includes("mốt")) {
    targetDayKey = getDateKeyVN(addDays(todayBase, 2));
    hasExplicitDate = true;
  } else if (lower.includes("hôm nay") || lower.includes("tối nay") || lower.includes("chiều nay")) {
    targetDayKey = todayKeyVN;
    hasExplicitDate = true;
  }

  // Exact time of day (e.g. 17:00, 23:59, 8h, 9h tối)
  let deadlineHour = 23;
  let deadlineMinute = 59;

  const timeExplicit = lower.match(/(?:lúc|vào|trước)?\s*(\d{1,2})[:h](\d{2})/);
  const eveningHour = lower.match(/(\d{1,2})\s*(?:giờ|h)?\s*(?:tối|chiều|pm)/);
  const morningHour = lower.match(/(\d{1,2})\s*(?:giờ|h)?\s*(?:sáng|am)/);

  if (timeExplicit) {
    deadlineHour = parseInt(timeExplicit[1], 10);
    deadlineMinute = parseInt(timeExplicit[2], 10);
    hasExplicitDate = true;
  } else if (eveningHour) {
    const h = parseInt(eveningHour[1], 10);
    deadlineHour = h < 12 ? h + 12 : h;
    deadlineMinute = 0;
    hasExplicitDate = true;
  } else if (morningHour) {
    deadlineHour = parseInt(morningHour[1], 10);
    deadlineMinute = 0;
    hasExplicitDate = true;
  }

  let deadline: Date | null = null;
  if (hasExplicitDate) {
    const [y, m, d] = targetDayKey.split("-").map(Number);
    deadline = makeVNDate(y, m, d, deadlineHour, deadlineMinute);
  }

  // 5. Clean Title (remove tags and priority keywords)
  let cleanTitle = trimmed
    .replace(/#urgent|!urgent|#high|#low|#medium|\bp1\b|\bp2\b|\bp3\b|\bp4\b/gi, "")
    .replace(/(?:trước|vào|lúc)\s+(?:thứ\s+[2-7]|thứ\s+[hH]ai|thứ\s+[bB]a|thứ\s+[tT]ư|thứ\s+[nN]ăm|thứ\s+[sS]áu|thứ\s+[bB]ảy|chủ\s+nhật|cn|ngày\s+mai|mai|ngày\s+kia|mốt|hôm\s+nay)/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanTitle) {
    cleanTitle = trimmed;
  }

  return {
    title: cleanTitle,
    subjectId: matchedSubject?.id || null,
    subjectName: matchedSubject?.name || null,
    deadline,
    estimatedMinutes,
    priority,
    status: "INBOX",
    rawText: trimmed,
  };
}
