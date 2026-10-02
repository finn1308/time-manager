import React from "react";
import {
  BookOpen,
  User,
  GraduationCap,
  AlertCircle,
  Users,
  Lock,
  Calendar,
  LucideIcon,
} from "lucide-react";

export type CalendarEventType =
  | "STUDY"
  | "PERSONAL"
  | "EXAM"
  | "DEADLINE"
  | "MEETING"
  | "BLOCKED"
  | "OTHER";

export interface EventTypeConfig {
  key: CalendarEventType;
  label: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  badgeText: string;
  borderLeftColor: string;
  cardBgLight: string;
  cardBgDark: string;
}

export const EVENT_TYPE_CONFIGS: Record<CalendarEventType, EventTypeConfig> = {
  STUDY: {
    key: "STUDY",
    label: "Học tập",
    description: "Phiên học, đọc sách, nghiên cứu",
    icon: BookOpen,
    badgeBg: "#eef5f0",
    badgeText: "#2d6a4f",
    borderLeftColor: "#2d6a4f",
    cardBgLight: "#fbfdfb",
    cardBgDark: "#15241a",
  },
  PERSONAL: {
    key: "PERSONAL",
    label: "Cá nhân",
    description: "Việc riêng, gia đình, sở thích",
    icon: User,
    badgeBg: "#eff6ff",
    badgeText: "#2563eb",
    borderLeftColor: "#3b82f6",
    cardBgLight: "#f8faff",
    cardBgDark: "#172338",
  },
  EXAM: {
    key: "EXAM",
    label: "Thi cử / Kiểm tra",
    description: "Lịch thi giữa kỳ, cuối kỳ, test năng lực",
    icon: GraduationCap,
    badgeBg: "#fef2f2",
    badgeText: "#dc2626",
    borderLeftColor: "#ef4444",
    cardBgLight: "#fffafa",
    cardBgDark: "#2c1717",
  },
  DEADLINE: {
    key: "DEADLINE",
    label: "Hạn chót (Deadline)",
    description: "Nộp bài tập, tiểu luận, báo cáo",
    icon: AlertCircle,
    badgeBg: "#fffbeb",
    badgeText: "#d97706",
    borderLeftColor: "#f59e0b",
    cardBgLight: "#fffdf7",
    cardBgDark: "#2b2214",
  },
  MEETING: {
    key: "MEETING",
    label: "Hội họp / Nhóm",
    description: "Họp nhóm, thảo luận đồ án, seminar",
    icon: Users,
    badgeBg: "#f5f3ff",
    badgeText: "#7c3aed",
    borderLeftColor: "#8b5cf6",
    cardBgLight: "#fbfaff",
    cardBgDark: "#221933",
  },
  BLOCKED: {
    key: "BLOCKED",
    label: "Khóa / Lịch bận",
    description: "Khung giờ cố định không xếp học",
    icon: Lock,
    badgeBg: "#f1f5f9",
    badgeText: "#475569",
    borderLeftColor: "#64748b",
    cardBgLight: "#f8fafc",
    cardBgDark: "#1e242d",
  },
  OTHER: {
    key: "OTHER",
    label: "Khác",
    description: "Sự kiện chung khác",
    icon: Calendar,
    badgeBg: "#f0fdfa",
    badgeText: "#0d9488",
    borderLeftColor: "#14b8a6",
    cardBgLight: "#f8fdfc",
    cardBgDark: "#152826",
  },
};

export const ALL_EVENT_TYPES: CalendarEventType[] = [
  "STUDY",
  "PERSONAL",
  "EXAM",
  "DEADLINE",
  "MEETING",
  "BLOCKED",
  "OTHER",
];

export function getEventTypeConfig(type?: string | null): EventTypeConfig {
  const normalized = (type?.toUpperCase() || "STUDY") as CalendarEventType;
  return EVENT_TYPE_CONFIGS[normalized] || EVENT_TYPE_CONFIGS.STUDY;
}
