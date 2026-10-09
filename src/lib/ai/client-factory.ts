import { prisma } from "../prisma";
import { decryptApiKey } from "../crypto";
import { AI_SCHEDULER_SYSTEM_PROMPT, buildSchedulerUserPrompt } from "./prompts";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { addDays, parseISO } from "date-fns";
import {
  VIETNAM_TIMEZONE,
  timeStringToDateOnDay,
  collidesWithBlockedSlot,
  isOverlapping,
  makeVNDate,
  getDateKeyVN,
  DAY_PERIODS,
} from "../date-utils";

export interface ProposedEvent {
  subjectId: string;
  taskId?: string | null;
  title: string;
  description: string;
  startTime: string; // ISO
  endTime: string;   // ISO
  durationMinutes: number;
  reasoning: string;
}

export interface RecommendedFlexibleSlot {
  goalId: string;
  goalTitle: string;
  date: string;
  recommendedStart: string;
  recommendedEnd: string;
  durationMinutes: number;
  reason: string;
}

export interface DayWorkloadAnalysis {
  date: string;
  dayOfWeek: number;
  flexibleGoalMinutes: number;
  fixedStudyMinutes: number;
  totalStudyMinutes: number;
  maxDailyMinutes: number;
  isOverloaded: boolean;
  notes?: string;
}

export interface AISchedulerResponse {
  proposedEvents: ProposedEvent[];
  recommendedSlotsForFlexibleGoals?: RecommendedFlexibleSlot[];
  workloadAnalysis?: DayWorkloadAnalysis[];
  summary: string;
  providerUsed: string;
}

export async function executeAIScheduling(
  userId: string,
  params: {
    startDate: string;
    endDate: string;
    preferences?: any;
    subjects: Array<{ id: string; name: string; code?: string | null; targetHours: number; loggedHours: number; remainingHours: number; priority: number }>;
    goals?: any[];
    activeTasks?: any[];
    historySummary?: any;
    blockedSlots: Array<{ title: string; startTime: string; endTime: string; dayOfWeek?: number | null; specificDate?: string | null; isLocked: boolean }>;
    existingEvents: Array<{ title: string; startTime: string; endTime: string }>;
    flexibleGoals?: Array<{ id: string; title: string; targetMinutes: number; startDate: string; endDate?: string | null; activeDays: number[]; preferredPeriod: string }>;
    skills?: Array<{ id: string; name: string; category: string; targetHours: number }>;
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
    recommendedSlotsForFlexibleGoals: parsed.recommendedSlotsForFlexibleGoals || [],
    workloadAnalysis: parsed.workloadAnalysis || [],
    summary: parsed.summary || "Lịch học đã được phân bổ tối ưu theo OpenAI.",
    providerUsed: "OpenAI GPT-4o-mini",
  };
}

async function callGeminiAPI(apiKey: string, userPrompt: string): Promise<AISchedulerResponse> {
  const { callGeminiGenerate } = await import("./gemini");
  const { text: rawText, modelUsed } = await callGeminiGenerate({
    apiKey,
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
  });

  // Strip markdown code block if model wrapped JSON in ```json ... ```
  let jsonStr = rawText.trim();
  if (jsonStr.startsWith("```json")) {
    jsonStr = jsonStr.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }

  const parsed = JSON.parse(jsonStr);
  return {
    proposedEvents: parsed.proposedEvents || [],
    recommendedSlotsForFlexibleGoals: parsed.recommendedSlotsForFlexibleGoals || [],
    workloadAnalysis: parsed.workloadAnalysis || [],
    summary: parsed.summary || `Lịch học đã được phân bổ tự động bằng Google Gemini (${modelUsed}).`,
    providerUsed: `Google Gemini (${modelUsed})`,
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
    recommendedSlotsForFlexibleGoals: parsed.recommendedSlotsForFlexibleGoals || [],
    workloadAnalysis: parsed.workloadAnalysis || [],
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
  preferences?: any;
  subjects: Array<{ id: string; name: string; code?: string | null; targetHours: number; loggedHours: number; remainingHours: number; priority: number }>;
  goals?: any[];
  activeTasks?: any[];
  historySummary?: any;
  blockedSlots: Array<{ title: string; startTime: string; endTime: string; dayOfWeek?: number | null; specificDate?: string | null; isLocked: boolean }>;
  existingEvents: Array<{ title: string; startTime: string; endTime: string }>;
  customInstructions?: string;
}): AISchedulerResponse {
  const proposedEvents: ProposedEvent[] = [];

  const startDay = parseISO(params.startDate);
  const endDay = parseISO(params.endDate);

  const timePref = params.preferences?.timePreference || "BALANCED";
  const restDays: number[] = params.preferences?.restDays || [0];
  const maxDailyMinutes = Math.round((params.preferences?.maxDailyStudyHours || 6.0) * 60);

  // Candidate study windows across the 4 BUỔI in Vietnam timezone, ordered by preference
  let candidateWindows = [
    { start: "08:30", end: "10:00", duration: 90, label: "Sáng", emoji: "🌅", period: "morning" },
    { start: "14:30", end: "16:00", duration: 90, label: "Chiều", emoji: "🌤️", period: "afternoon" },
    { start: "19:30", end: "21:00", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
    { start: "12:30", end: "13:30", duration: 60, label: "Trưa", emoji: "☀️", period: "noon" },
    { start: "21:15", end: "22:45", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
  ];

  if (timePref === "MORNING") {
    candidateWindows = [
      { start: "08:30", end: "10:00", duration: 90, label: "Sáng", emoji: "🌅", period: "morning" },
      { start: "10:15", end: "11:45", duration: 90, label: "Sáng", emoji: "🌅", period: "morning" },
      { start: "14:30", end: "16:00", duration: 90, label: "Chiều", emoji: "🌤️", period: "afternoon" },
      { start: "19:30", end: "21:00", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
    ];
  } else if (timePref === "EVENING") {
    candidateWindows = [
      { start: "19:30", end: "21:00", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
      { start: "21:15", end: "22:45", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
      { start: "14:30", end: "16:00", duration: 90, label: "Chiều", emoji: "🌤️", period: "afternoon" },
      { start: "08:30", end: "10:00", duration: 90, label: "Sáng", emoji: "🌅", period: "morning" },
    ];
  } else if (timePref === "AFTERNOON") {
    candidateWindows = [
      { start: "14:30", end: "16:00", duration: 90, label: "Chiều", emoji: "🌤️", period: "afternoon" },
      { start: "16:15", end: "17:45", duration: 90, label: "Chiều", emoji: "🌤️", period: "afternoon" },
      { start: "08:30", end: "10:00", duration: 90, label: "Sáng", emoji: "🌅", period: "morning" },
      { start: "19:30", end: "21:00", duration: 90, label: "Tối", emoji: "🌙", period: "evening" },
    ];
  }

  // Sort subjects by priority desc, remaining hours desc
  const sortedSubjects = [...params.subjects].sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;
    return b.remainingHours - a.remainingHours;
  });

  // Track daily minutes planned
  const dailyMinutesMap: { [dateKey: string]: number } = {};

  let curDay = new Date(startDay);
  let subjectIdx = 0;

  while (curDay <= endDay) {
    const curDateKey = getDateKeyVN(curDay);
    const dayOfWeek = curDay.getDay();

    // Respect rest days unless specifically instructed
    const isRestDay = restDays.includes(dayOfWeek);
    if (isRestDay && !params.customInstructions?.toLowerCase().includes("chủ nhật")) {
      curDay = addDays(curDay, 1);
      continue;
    }

    dailyMinutesMap[curDateKey] = 0;

    for (const win of candidateWindows) {
      if (sortedSubjects.length === 0) break;
      if (dailyMinutesMap[curDateKey] >= maxDailyMinutes) break;

      const sub = sortedSubjects[subjectIdx % sortedSubjects.length];

      // Find any linked active task for this subject
      const linkedTask = params.activeTasks?.find((t) => t.subjectId === sub.id);

      const candStart = makeVNDate(curDateKey, win.start);
      const candEnd = makeVNDate(curDateKey, win.end);

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
      const sessionTitle = linkedTask
        ? `[Nhiệm vụ] ${linkedTask.title} (${sub.name})`
        : `Ôn tập & Luyện chuyên sâu: ${sub.name}`;

      const sessionDesc = linkedTask
        ? `Tập trung hoàn thành bài tập trước hạn (${linkedTask.deadline ? `Hạn: ${linkedTask.deadline}` : "Ưu tiên cao"})`
        : `Giải bài tập và củng cố kiến thức trọng tâm cho môn ${sub.code || sub.name} (Độ ưu tiên ${sub.priority}/5)`;

      proposedEvents.push({
        subjectId: sub.id,
        taskId: linkedTask?.id || null,
        title: sessionTitle,
        description: sessionDesc,
        startTime: candStart.toISOString(),
        endTime: candEnd.toISOString(),
        durationMinutes: win.duration,
        reasoning: `Buổi ${win.label} (${win.emoji} ${win.start} - ${win.end}) khả dụng, tôn trọng sở thích (${timePref}), phân bổ độ ưu tiên ${sub.priority}/5.`,
      });

      dailyMinutesMap[curDateKey] += win.duration;
      subjectIdx++;
    }

    curDay = addDays(curDay, 1);
  }

  return {
    proposedEvents,
    summary: `Đã tự động tính toán và phân bổ ${proposedEvents.length} buổi học tối ưu qua 4 Buổi (Sáng, Trưa, Chiều, Tối), tôn trọng ngày nghỉ, thời điểm ưa thích (${timePref}) và tránh hoàn toàn mọi khung giờ bị khóa.`,
    providerUsed: "ChronoMind Local Constraint Satisfaction Engine (4-Period Aware)",
  };
}
