import { prisma } from "../prisma";
import { decryptApiKey } from "../crypto";
import { AI_SCHEDULER_SYSTEM_PROMPT, buildSchedulerUserPrompt } from "./prompts";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addDays, parseISO } from "date-fns";
import { VIETNAM_TIMEZONE, timeStringToDateOnDay, collidesWithBlockedSlot, isOverlapping } from "../date-utils";

export interface ProposedEvent {
  subjectId: string;
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  durationMinutes: number;
  reasoning: string;
}

export interface AISchedulerResponse {
  proposedEvents: ProposedEvent[];
  summary: string;
  providerUsed: string;
}

export async function executeAIScheduling(
  userId: string,
  params: {
    startDate: string;
    endDate: string;
    subjects: Array<{ id: string; name: string; code?: string | null; targetHours: number; loggedHours: number; remainingHours: number; priority: number }>;
    blockedSlots: Array<{ title: string; startTime: string; endTime: string; dayOfWeek?: number | null; specificDate?: string | null; isLocked: boolean }>;
    existingEvents: Array<{ title: string; startTime: string; endTime: string }>;
    customInstructions?: string;
  }
): Promise<AISchedulerResponse> {
  // 1. Check if user has an active API key
  const activeKey = await prisma.userApiKey.findFirst({
    where: { userId, isActive: true },
  });

  const promptContent = buildSchedulerUserPrompt(params);

  if (activeKey) {
    try {
      const plainApiKey = decryptApiKey(activeKey.encryptedKey, activeKey.iv, activeKey.authTag);

      if (activeKey.provider === "GEMINI") {
        return await callGeminiAPI(plainApiKey, promptContent);
      } else if (activeKey.provider === "OPENAI") {
        return await callOpenAIAPI(plainApiKey, promptContent);
      } else if (activeKey.provider === "ANTHROPIC") {
        return await callAnthropicAPI(plainApiKey, promptContent);
      }
    } catch (err) {
      console.warn("Error calling AI provider API, falling back to local heuristic scheduler:", err);
    }
  }

  // Fallback: Smart Local Heuristic Scheduling Engine (Constraint Satisfaction)
  return runLocalHeuristicScheduler(params);
}

async function callOpenAIAPI(apiKey: string, userPrompt: string): Promise<AISchedulerResponse> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: AI_SCHEDULER_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI API Error: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  const parsed = JSON.parse(json.choices[0].message.content);
  return {
    proposedEvents: parsed.proposedEvents || [],
    summary: parsed.summary || "Lịch học đã được phân bổ tối ưu theo OpenAI.",
    providerUsed: "OpenAI GPT-4o-mini",
  };
}

async function callGeminiAPI(apiKey: string, userPrompt: string): Promise<AISchedulerResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            { text: AI_SCHEDULER_SYSTEM_PROMPT },
            { text: userPrompt },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API Error: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  const rawText = json.candidates[0].content.parts[0].text;
  const parsed = JSON.parse(rawText);
  return {
    proposedEvents: parsed.proposedEvents || [],
    summary: parsed.summary || "Lịch học đã được phân bổ tự động bằng Google Gemini.",
    providerUsed: "Google Gemini 1.5 Flash",
  };
}

async function callAnthropicAPI(apiKey: string, userPrompt: string): Promise<AISchedulerResponse> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 4096,
      system: AI_SCHEDULER_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Anthropic API Error: ${res.status} ${errorText}`);
  }

  const json = await res.json();
  const rawText = json.content[0].text;
  const parsed = JSON.parse(rawText);
  return {
    proposedEvents: parsed.proposedEvents || [],
    summary: parsed.summary || "Lịch học đã được lập thành công bằng Anthropic Claude.",
    providerUsed: "Anthropic Claude 3.5 Haiku",
  };
}

/**
 * Intelligent local constraint satisfaction scheduler
 * Used when no external API key is configured or as instant offline fallback
 */
export function runLocalHeuristicScheduler(params: {
  startDate: string;
  endDate: string;
  subjects: Array<{ id: string; name: string; code?: string | null; targetHours: number; loggedHours: number; remainingHours: number; priority: number }>;
  blockedSlots: Array<{ title: string; startTime: string; endTime: string; dayOfWeek?: number | null; specificDate?: string | null; isLocked: boolean }>;
  existingEvents: Array<{ title: string; startTime: string; endTime: string }>;
  customInstructions?: string;
}): AISchedulerResponse {
  const proposedEvents: ProposedEvent[] = [];

  const startDay = parseISO(params.startDate);
  const endDay = parseISO(params.endDate);

  // Preferred candidate study windows in a day (local VN time)
  const candidateWindows = [
    { start: "14:00", end: "15:30", duration: 90 }, // Afternoon slot 1
    { start: "15:45", end: "17:15", duration: 90 }, // Afternoon slot 2
    { start: "19:30", end: "21:00", duration: 90 }, // Evening prime slot 1
    { start: "21:15", end: "22:45", duration: 90 }, // Evening prime slot 2
  ];

  // Sort subjects by priority desc, remaining hours desc
  const sortedSubjects = [...params.subjects].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.remainingHours - a.remainingHours;
  });

  let curDay = new Date(startDay);
  let subjectIdx = 0;

  while (curDay <= endDay) {
    for (const win of candidateWindows) {
      if (sortedSubjects.length === 0) break;

      const sub = sortedSubjects[subjectIdx % sortedSubjects.length];

      const candStart = timeStringToDateOnDay(curDay, win.start);
      const candEnd = timeStringToDateOnDay(curDay, win.end);

      // Check collision with blocked slots
      const blockCollision = collidesWithBlockedSlot(candStart, candEnd, params.blockedSlots);
      if (blockCollision.conflict) continue;

      // Check collision with existing events
      const eventCollision = params.existingEvents.some((ev) => {
        const evStart = new Date(ev.startTime);
        const evEnd = new Date(ev.endTime);
        return isOverlapping({ start: candStart, end: candEnd }, { start: evStart, end: evEnd }, 10);
      });
      if (eventCollision) continue;

      // Check collision with already proposed events
      const alreadyProposedCollision = proposedEvents.some((pe) => {
        const peStart = new Date(pe.startTime);
        const peEnd = new Date(pe.endTime);
        return isOverlapping({ start: candStart, end: candEnd }, { start: peStart, end: peEnd }, 10);
      });
      if (alreadyProposedCollision) continue;

      // Found a safe, conflict-free slot!
      proposedEvents.push({
        subjectId: sub.id,
        title: `Ôn tập & Luyện chuyên sâu: ${sub.name}`,
        description: `Giải bài tập và củng cố kiến thức trọng tâm cho môn ${sub.code || sub.name} (Độ ưu tiên ${sub.priority}/5)`,
        startTime: candStart.toISOString(),
        endTime: candEnd.toISOString(),
        durationMinutes: win.duration,
        reasoning: `Khung giờ ${win.start} - ${win.end} hoàn toàn trống, không vướng giờ bận, ưu tiên môn có trọng số ${sub.priority}.`,
      });

      subjectIdx++;
    }

    curDay = addDays(curDay, 1);
  }

  return {
    proposedEvents,
    summary: `Đã tự động tính toán và phân bổ ${proposedEvents.length} buổi học tối ưu, tránh hoàn toàn mọi khung giờ bị khóa và lịch bận cố định.`,
    providerUsed: "ChronoMind Local Constraint Satisfaction Engine",
  };
}
