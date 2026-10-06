import { cache } from "react";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "chronomind_default_auth_secret_key_32_bytes_super_secure"
);
const COOKIE_NAME = "chronomind_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
}

export async function createSession(user: {
  id: string;
  email: string;
  name: string | null;
  role: string;
  timezone: string;
}): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    timezone: user.timezone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// In-memory cache for user sessions across API routes and RSC (30s TTL)
const authMemoryCache = new Map<string, { user: any; expiresAt: number }>();
const AUTH_CACHE_TTL_MS = 30_000;

export function invalidateUserCache(userId?: string) {
  if (userId) {
    authMemoryCache.delete(userId);
  } else {
    authMemoryCache.clear();
  }
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  const cacheKey = session?.userId || (process.env.NODE_ENV !== "production" ? "__dev_user__" : null);

  if (cacheKey) {
    const cached = authMemoryCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.user;
    }
  }

  if (session?.userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.userId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          timezone: true,
          isPro: true,
          coins: true,
          createdAt: true,
        },
      });
      if (user) {
        authMemoryCache.set(session.userId, { user, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
        return user;
      }
    } catch {
      // ignore
    }
  }

  // Local development auto-fallback to primary developer user if no active session cookie
  if (process.env.NODE_ENV !== "production") {
    try {
      const devUser = await prisma.user.findFirst({
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          timezone: true,
          isPro: true,
          coins: true,
          createdAt: true,
        },
      });
      if (devUser) {
        authMemoryCache.set("__dev_user__", { user: devUser, expiresAt: Date.now() + AUTH_CACHE_TTL_MS });
        return devUser;
      }
    } catch {
      return null;
    }
  }

  return null;
});

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  if (session?.userId) {
    invalidateUserCache(session.userId);
  } else {
    invalidateUserCache();
  }
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyUserCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}
