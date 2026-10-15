"use client";

import React, { useState, useEffect } from "react";
import { RoomLogin } from "./room-login";
import { RoomWorkspace } from "./room-workspace";
import { ForcePasswordModal } from "./modals/force-password-modal";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RoomInfo {
  id: string;
  publicId: string;
  title: string;
  subject: string;
  description?: string | null;
}

interface RoomUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

interface StandaloneRoomClientProps {
  roomId: string;
  roomInfo: RoomInfo;
}

export function StandaloneRoomClient({ roomId, roomInfo }: StandaloneRoomClientProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<RoomUser | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const checkAuth = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/auth/me`);
      const data = await res.json();

      if (res.ok && data.authenticated && data.user) {
        setUser(data.user);
        setMustChangePassword(!!data.user.mustChangePassword);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [roomId]);

  const handleLoginSuccess = (authenticatedUser: RoomUser) => {
    setUser(authenticatedUser);
    setMustChangePassword(authenticatedUser.mustChangePassword);
  };

  const handleLogout = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/auth/logout`, { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    toast.success("Đã đăng xuất khỏi phòng họp");
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-pastel-grid"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-ink)",
        }}
      >
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang kiểm tra quyền truy cập phòng họp...</p>
        </div>
      </div>
    );
  }

  // Not authenticated in this room: display standalone room login screen
  if (!user) {
    return (
      <RoomLogin
        roomId={roomId}
        roomInfo={roomInfo}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Authenticated: display room workspace (outside ChronoMind sidebar layout)
  return (
    <div
      className="min-h-screen w-full bg-pastel-grid flex flex-col"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-ink)",
      }}
    >
      <ForcePasswordModal
        open={mustChangePassword}
        onSuccess={() => {
          setMustChangePassword(false);
          checkAuth();
        }}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto p-3 sm:p-5 lg:p-6 pb-12">
        <RoomWorkspace
          roomId={roomInfo.id}
          currentUser={user}
          onLogout={handleLogout}
        />
      </main>
    </div>
  );
}
