"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, User, AlertCircle, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface RoomLoginProps {
  roomId: string;
  roomInfo?: {
    title: string;
    subject: string;
    description?: string | null;
  } | null;
  onLoginSuccess: (user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    mustChangePassword: boolean;
  }) => void;
}

export function RoomLogin({ roomId, roomInfo, onLoginSuccess }: RoomLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Tên đăng nhập hoặc mật khẩu không chính xác");
      }

      toast.success("Đăng nhập phòng họp thành công!");
      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Tên đăng nhập hoặc mật khẩu không chính xác");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-pastel-grid"
      style={{
        backgroundColor: "var(--bg-base)",
        color: "var(--text-ink)",
      }}
    >
      <div className="w-full max-w-md space-y-6">
        {/* Brand / Room Badge */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>ChronoMind Meeting Space</span>
          </div>

          {/* Mandatory title format according to AGENT.md */}
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            Chào mừng bạn đến với phòng họp ID = {roomId}
          </h1>

          {/* Optional Room Subject / Title */}
          {roomInfo && (
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="font-bold text-base text-foreground/90">
                {roomInfo.title}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                {roomInfo.subject}
              </span>
            </div>
          )}

          {roomInfo?.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 max-w-sm mx-auto">
              {roomInfo.description}
            </p>
          )}
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-8 rounded-2xl bg-card border border-border/80 shadow-xl space-y-5">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-foreground">
              Xác thực vào phòng họp
            </h2>
            <p className="text-xs text-muted-foreground">
              Nhập tên đăng nhập hoặc email được quản trị viên cấp để truy cập không gian làm việc.
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room-username" className="text-xs font-semibold">
                Tên đăng nhập / Email
              </Label>
              <div className="relative">
                <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="room-username"
                  type="text"
                  placeholder="Ví dụ: admin_abc123 hoặc username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm"
                  autoFocus
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="room-password" className="text-xs font-semibold">
                  Mật khẩu
                </Label>
                <span className="text-[10px] text-muted-foreground">
                  (Mật khẩu tạm mặc định: 12345678)
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="room-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 h-11 rounded-xl text-sm font-mono"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-bold gap-2 text-sm"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Đăng nhập vào phòng
                </>
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-border/40 text-center">
            <p className="text-[11px] text-muted-foreground">
              Mỗi phòng họp có tài khoản và phân quyền độc lập. Nếu chưa có tài khoản, hãy liên hệ quản trị viên tạo phòng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
