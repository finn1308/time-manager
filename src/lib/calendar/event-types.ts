import React from "react";
import {
  School,
  Home,
  Gamepad2,
  GraduationCap,
  Clock,
  Calendar,
  BookOpen,
  Lock,
  Users,
  AlertCircle,
  LucideIcon,
} from "lucide-react";

export type CalendarEventType =
  | "SCHOOL"
  | "SELF_STUDY"
  | "PERSONAL"
  | "EXAM"
  | "DEADLINE"
  | "OTHER"
  // Legacy aliases supported for backwards compatibility:
  | "STUDY"
  | "MEETING"
  | "BLOCKED";

export interface EventTypeConfig {
  key: CalendarEventType;
  canonicalKey: "SCHOOL" | "SELF_STUDY" | "PERSONAL" | "EXAM" | "DEADLINE" | "OTHER";
  label: string;
  emoji: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  borderLeftColor: string;
  cardBgLight: string;
  cardBgDark: string;
  isStudyTimerSupported: boolean;
  countsTowardsSelfStudyHours: boolean;
  isBusyForAi: boolean;
}

export const EVENT_TYPE_CONFIGS: Record<CalendarEventType, EventTypeConfig> = {
  SCHOOL: {
    key: "SCHOOL",
    canonicalKey: "SCHOOL",
    label: "Lịch đi học (Trường / Lớp)",
    emoji: "🏫",
    shortLabel: "Đi học",
    description: "Lịch học ở trường, trung tâm, lớp cố định ngoài đời. Không tính giờ tự học, không chạy timer.",
    icon: School,
    badgeBg: "#e0f2fe",
    badgeText: "#0369a1",
    borderLeftColor: "#0284c7",
    cardBgLight: "#f0f9ff",
    cardBgDark: "#0c2838",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  SELF_STUDY: {
    key: "SELF_STUDY",
    canonicalKey: "SELF_STUDY",
    label: "Học tại nhà (Tự học)",
    emoji: "🏠",
    shortLabel: "Tự học",
    description: "Lịch tự học tại nhà. Có thể liên kết Môn học, Task, Goal và BẬT TIMER ghi nhận giờ học thật.",
    icon: Home,
    badgeBg: "#dcfce7",
    badgeText: "#15803d",
    borderLeftColor: "#16a34a",
    cardBgLight: "#f0fdf4",
    cardBgDark: "#13281c",
    isStudyTimerSupported: true,
    countsTowardsSelfStudyHours: true,
    isBusyForAi: true,
  },
  PERSONAL: {
    key: "PERSONAL",
    canonicalKey: "PERSONAL",
    label: "Cá nhân / Đi chơi",
    emoji: "🎮",
    shortLabel: "Cá nhân",
    description: "Việc riêng, gia đình, sở thích, đi chơi. Không chạy Timer. AI xem là thời gian BẬN.",
    icon: Gamepad2,
    badgeBg: "#fef3c7",
    badgeText: "#b45309",
    borderLeftColor: "#f59e0b",
    cardBgLight: "#fffbeb",
    cardBgDark: "#2c2314",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  EXAM: {
    key: "EXAM",
    canonicalKey: "EXAM",
    label: "Thi cử / Kiểm tra",
    emoji: "📝",
    shortLabel: "Lịch thi",
    description: "Lịch thi giữa kỳ, cuối kỳ, chứng chỉ. Ràng buộc quan trọng để AI lập kế hoạch ôn tập trước đó.",
    icon: GraduationCap,
    badgeBg: "#fee2e2",
    badgeText: "#b91c1c",
    borderLeftColor: "#dc2626",
    cardBgLight: "#fff1f2",
    cardBgDark: "#2b1418",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  DEADLINE: {
    key: "DEADLINE",
    canonicalKey: "DEADLINE",
    label: "Hạn chót (Deadline)",
    emoji: "⏰",
    shortLabel: "Deadline",
    description: "Mốc nộp bài tập, tiểu luận, dự án. AI tự động xếp lịch học hoàn thành trước hạn.",
    icon: Clock,
    badgeBg: "#ffedd5",
    badgeText: "#c2410c",
    borderLeftColor: "#ea580c",
    cardBgLight: "#fff7ed",
    cardBgDark: "#2c1c13",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  OTHER: {
    key: "OTHER",
    canonicalKey: "OTHER",
    label: "Sự kiện khác",
    emoji: "📌",
    shortLabel: "Khác",
    description: "Sự kiện chung khác trong Calendar. Không tính giờ tự học.",
    icon: Calendar,
    badgeBg: "#f3f4f6",
    badgeText: "#4b5563",
    borderLeftColor: "#6b7280",
    cardBgLight: "#f9fafb",
    cardBgDark: "#1c222b",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  // Legacy aliases
  STUDY: {
    key: "STUDY",
    canonicalKey: "SELF_STUDY",
    label: "Học tập (Tự học)",
    emoji: "🏠",
    shortLabel: "Tự học",
    description: "Phiên học tập tại nhà (tương thích ngược với STUDY cũ)",
    icon: BookOpen,
    badgeBg: "#dcfce7",
    badgeText: "#15803d",
    borderLeftColor: "#16a34a",
    cardBgLight: "#f0fdf4",
    cardBgDark: "#13281c",
    isStudyTimerSupported: true,
    countsTowardsSelfStudyHours: true,
    isBusyForAi: true,
  },
  MEETING: {
    key: "MEETING",
    canonicalKey: "OTHER",
    label: "Hội họp / Nhóm",
    emoji: "👥",
    shortLabel: "Họp nhóm",
    description: "Họp nhóm, thảo luận đồ án",
    icon: Users,
    badgeBg: "#f5f3ff",
    badgeText: "#7c3aed",
    borderLeftColor: "#8b5cf6",
    cardBgLight: "#fbfaff",
    cardBgDark: "#221933",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
  BLOCKED: {
    key: "BLOCKED",
    canonicalKey: "OTHER",
    label: "Khóa / Lịch bận",
    emoji: "🔒",
    shortLabel: "Lịch bận",
    description: "Khung giờ cố định không xếp học",
    icon: Lock,
    badgeBg: "#f1f5f9",
    badgeText: "#475569",
    borderLeftColor: "#64748b",
    cardBgLight: "#f8fafc",
    cardBgDark: "#1e242d",
    isStudyTimerSupported: false,
    countsTowardsSelfStudyHours: false,
    isBusyForAi: true,
  },
};

/**
 * The 6 primary event types specified in the requirement
 */
export const PRIMARY_EVENT_TYPES: CalendarEventType[] = [
  "SCHOOL",
  "SELF_STUDY",
  "PERSONAL",
  "EXAM",
  "DEADLINE",
  "OTHER",
];

export const ALL_EVENT_TYPES: CalendarEventType[] = PRIMARY_EVENT_TYPES;

/**
 * Returns configuration for a given event type with safe fallback
 */
export function getEventTypeConfig(type?: string | null): EventTypeConfig {
  if (!type) return EVENT_TYPE_CONFIGS.OTHER;
  const upper = type.toUpperCase() as CalendarEventType;
  return EVENT_TYPE_CONFIGS[upper] || EVENT_TYPE_CONFIGS.OTHER;
}

/**
 * Canonical check if an event represents Self-Study (only self-study supports timer and counts to study hours)
 */
export function isSelfStudyEvent(type?: string | null): boolean {
  if (!type) return false;
  const upper = type.toUpperCase();
  return upper === "SELF_STUDY" || upper === "STUDY";
}

/**
 * Check if event is school schedule
 */
export function isSchoolEvent(type?: string | null): boolean {
  return type?.toUpperCase() === "SCHOOL";
}

/**
 * Check if event is personal / leisure
 */
export function isPersonalEvent(type?: string | null): boolean {
  return type?.toUpperCase() === "PERSONAL";
}

/**
 * Check if event is exam
 */
export function isExamEvent(type?: string | null): boolean {
  return type?.toUpperCase() === "EXAM";
}

/**
 * Check if event is deadline
 */
export function isDeadlineEvent(type?: string | null): boolean {
  return type?.toUpperCase() === "DEADLINE";
}

/**
 * Only SELF_STUDY can start the study timer
 */
export function canStartStudyTimer(type?: string | null): boolean {
  return isSelfStudyEvent(type);
}
