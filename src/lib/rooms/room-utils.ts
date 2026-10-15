import crypto from "crypto";

/**
 * Generate a secure, unguessable, high-entropy random room identifier.
 * Example format: "rm_k8x9m2p4w7z1"
 */
export function generateRandomRoomPublicId(): string {
  const chars = "23456789abcdefghjkmnpqrstuvwxyz"; // base32 Crockford-like (no confusing 0,O,1,l)
  const bytes = crypto.randomBytes(12);
  let id = "rm_";
  for (let i = 0; i < 12; i++) {
    id += chars[bytes[i] % chars.length];
  }
  return id;
}

export const ROOM_ROLES = {
  ADMIN: "ADMIN",
  HOST: "HOST",
  MEMBER: "MEMBER",
} as const;

export type RoomRole = (typeof ROOM_ROLES)[keyof typeof ROOM_ROLES];

export const ROOM_STATUS = {
  ACTIVE: "ACTIVE",
  ARCHIVED: "ARCHIVED",
  LOCKED: "LOCKED",
} as const;

export const GROUP_JOIN_POLICY = {
  OPEN: "OPEN",
  APPROVAL_REQUIRED: "APPROVAL_REQUIRED",
  INVITE_ONLY: "INVITE_ONLY",
} as const;

export const DEFAULT_COLUMNS = [
  { name: "Nội dung", key: "CONTENT", color: "lavender", sortOrder: 0, isDefault: true },
  { name: "Đang làm", key: "IN_PROGRESS", color: "sky", sortOrder: 1, isDefault: true },
  { name: "Đã hoàn thành", key: "COMPLETED", color: "mint", sortOrder: 2, isDefault: true },
  { name: "Tracking", key: "TRACKING", color: "peach", sortOrder: 3, isDefault: true },
];

export const PASTEL_LABELS = [
  { name: "Ưu tiên cao", color: "rose" },
  { name: "Nghiên cứu", color: "lavender" },
  { name: "Bài tập", color: "sky" },
  { name: "Thảo luận", color: "amber" },
  { name: "Tài liệu", color: "mint" },
];
