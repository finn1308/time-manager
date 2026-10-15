import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { findRoom } from "./room-auth";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "chronomind_default_auth_secret_key_32_bytes_super_secure"
);

const ROOM_COOKIE_PREFIX = "cm_room_session_";

export interface RoomSessionPayload {
  userId: string;
  roomId: string;
  role: string;
  email: string;
  name: string | null;
}

/**
 * Create a dedicated session cookie specifically for a room.
 */
export async function createRoomSession(payload: RoomSessionPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    roomId: payload.roomId,
    role: payload.role,
    email: payload.email,
    name: payload.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(`${ROOM_COOKIE_PREFIX}${payload.roomId}`, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
}

/**
 * Retrieve the active room session for a specific room.
 * Does NOT auto-fallback to dev user.
 */
export async function getRoomSession(roomIdOrPublicId: string): Promise<RoomSessionPayload | null> {
  try {
    const room = await findRoom(roomIdOrPublicId);
    if (!room) return null;

    const cookieStore = await cookies();
    const token = cookieStore.get(`${ROOM_COOKIE_PREFIX}${room.id}`)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload as unknown as RoomSessionPayload;

    if (session.roomId !== room.id) {
      return null;
    }

    // Verify membership in database
    const membership = await prisma.roomMembership.findUnique({
      where: {
        roomId_userId: {
          roomId: room.id,
          userId: session.userId,
        },
      },
    });

    if (!membership || membership.status === "DEACTIVATED") {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

/**
 * Destroy the room session.
 */
export async function destroyRoomSession(roomId: string): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(`${ROOM_COOKIE_PREFIX}${roomId}`);
  } catch {
    // ignore
  }
}
