import { z } from "zod";

export const UserApiKeySchema = z.object({
  provider: z.enum(["OPENAI", "GEMINI", "ANTHROPIC"]),
  apiKey: z.string().min(10, "API Key phải có ít nhất 10 ký tự").trim(),
});

export const SubjectSchema = z.object({
  name: z.string().min(1, "Tên môn học không được để trống").max(100),
  code: z.string().max(20).optional().nullable(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Mã màu HEX không hợp lệ"),
  icon: z.string().optional().nullable(),
  description: z.string().max(500).optional().nullable(),
});

export const StudyGoalSchema = z.object({
  subjectId: z.string().min(1, "Vui lòng chọn môn học"),
  targetHours: z.number().positive("Số giờ mục tiêu phải lớn hơn 0").max(500),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isAutoAlloc: z.boolean().default(true),
  priority: z.number().int().min(1).max(5).default(1),
  notes: z.string().max(500).optional().nullable(),
});

export const BlockedSlotSchema = z.object({
  title: z.string().min(1, "Tiêu đề không được để trống"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Định dạng giờ phải là HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Định dạng giờ phải là HH:mm"),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  specificDate: z.string().or(z.date()).optional().nullable(),
  isRecurring: z.boolean().default(true),
  isLocked: z.boolean().default(true),
});

export const ScheduleEventSchema = z.object({
  subjectId: z.string().optional().nullable(),
  title: z.string().min(1, "Tiêu đề buổi học không được để trống"),
  description: z.string().max(1000).optional().nullable(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  eventType: z.enum(["STUDY", "BUSY_BLOCKED", "FIXED_CLASS", "PERSONAL"]).default("STUDY"),
  isCompleted: z.boolean().default(false),
});

export const StudyLogSchema = z.object({
  subjectId: z.string().min(1, "Vui lòng chọn môn học"),
  scheduleEventId: z.string().optional().nullable(),
  startTime: z.string().or(z.date()),
  endTime: z.string().or(z.date()),
  durationMinutes: z.number().int().positive("Thời lượng phải lớn hơn 0 phút"),
  notes: z.string().max(2000).optional().nullable(),
  productivityScore: z.number().int().min(1).max(5).optional().nullable(),
  source: z.string().default("PIP_TIMER"),
});

export const GenerateScheduleSchema = z.object({
  startDate: z.string(), // "YYYY-MM-DD"
  endDate: z.string(),   // "YYYY-MM-DD"
  subjectIds: z.array(z.string()).optional(),
  maxDailyHours: z.number().min(1).max(14).default(6),
  customInstructions: z.string().max(500).optional(),
});
