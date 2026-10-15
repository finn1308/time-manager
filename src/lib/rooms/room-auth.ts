import { prisma } from "@/lib/prisma";
import { RoomRole, ROOM_ROLES } from "./room-utils";

export interface RoomAuthContext {
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
    description: string | null;
    coverColor: string | null;
    coverImage: string | null;
    ownerId: string;
    status: string;
    joinPolicy: string;
    settings: any;
    createdAt: Date;
    updatedAt: Date;
    archivedAt: Date | null;
  };
  membership: {
    id: string;
    roomId: string;
    userId: string;
    role: string;
    status: string;
    joinedAt: Date;
  };
  isAdmin: boolean;
  isHost: boolean;
  isMember: boolean;
}

/**
 * Resolve a room by either its internal cuid or random publicId.
 */
export async function findRoom(roomIdOrPublicId: string) {
  return await prisma.meetingRoom.findFirst({
    where: {
      OR: [
        { id: roomIdOrPublicId },
        { publicId: roomIdOrPublicId },
      ],
    },
  });
}

/**
 * Resolve room and verify user's membership and permissions.
 */
export async function getRoomAuth(roomIdOrPublicId: string, userId: string): Promise<RoomAuthContext | null> {
  const room = await findRoom(roomIdOrPublicId);
  if (!room) return null;

  // Retrieve user membership
  let membership = await prisma.roomMembership.findUnique({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: userId,
      },
    },
  });

  // If user is owner but has no membership record, auto-heal with ADMIN role
  if (!membership && room.ownerId === userId) {
    membership = await prisma.roomMembership.create({
      data: {
        roomId: room.id,
        userId: userId,
        role: ROOM_ROLES.ADMIN,
        status: "ACTIVE",
      },
    });
  }

  if (!membership || membership.status === "DEACTIVATED") {
    return null;
  }

  const role = membership.role;
  const isAdmin = role === ROOM_ROLES.ADMIN || room.ownerId === userId;
  const isHost = isAdmin || role === ROOM_ROLES.HOST;
  const isMember = true;

  return {
    room,
    membership,
    isAdmin,
    isHost,
    isMember,
  };
}

/**
 * Enforces room membership, throws if unauthorized or deactivated.
 */
export async function requireRoomAuth(roomIdOrPublicId: string, userId: string): Promise<RoomAuthContext> {
  const auth = await getRoomAuth(roomIdOrPublicId, userId);
  if (!auth) {
    throw new Error("UNAUTHORIZED_ROOM_ACCESS");
  }
  return auth;
}

/**
 * Enforces specific role requirement (ADMIN, HOST, etc.).
 */
export async function requireRoomRole(
  roomIdOrPublicId: string,
  userId: string,
  allowedRoles: RoomRole[]
): Promise<RoomAuthContext> {
  const auth = await requireRoomAuth(roomIdOrPublicId, userId);

  if (allowedRoles.includes(ROOM_ROLES.ADMIN) && auth.isAdmin) {
    return auth;
  }
  if (allowedRoles.includes(ROOM_ROLES.HOST) && auth.isHost) {
    return auth;
  }
  if (allowedRoles.includes(ROOM_ROLES.MEMBER) && auth.isMember) {
    return auth;
  }

  throw new Error("INSUFFICIENT_ROOM_PERMISSIONS");
}

/**
 * Check if the user is required to change their temporary password.
 */
export async function isPasswordChangeRequired(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mustChangePassword: true },
  });
  return !!user?.mustChangePassword;
}

/**
 * Record a secure, non-sensitive audit event for the room.
 */
export async function recordRoomAudit(params: {
  roomId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
}) {
  try {
    // Sanitize any potential secret keys from details
    const safeDetails = params.details ? JSON.parse(JSON.stringify(params.details)) : null;
    if (safeDetails) {
      delete safeDetails.password;
      delete safeDetails.passwordHash;
      delete safeDetails.token;
      delete safeDetails.secret;
    }

    await prisma.roomAuditEvent.create({
      data: {
        roomId: params.roomId,
        actorId: params.actorId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId || null,
        details: safeDetails,
      },
    });
  } catch (err) {
    console.error("Failed to record room audit event:", err);
  }
}
