"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ForcePasswordModalProps {
  open: boolean;
  onSuccess: () => void;
}

export function ForcePasswordModal({ open, onSuccess }: ForcePasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword === "12345678") {
      setError("Mật khẩu mới không được trùng với mật khẩu tạm mặc định (12345678)");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/rooms/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Đổi mật khẩu thất bại");
      }

      toast.success("Đổi mật khẩu thành công!", {
        description: "Bạn đã mở khóa toàn bộ quyền tương tác trong phòng họp.",
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Lỗi kết nối");
      toast.error(err.message || "Lỗi khi đổi mật khẩu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-6 border border-amber-500/30 bg-card rounded-2xl shadow-2xl [&>button]:hidden">
        <DialogHeader className="space-y-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Bắt buộc đổi mật khẩu tạm
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Tài khoản của bạn vừa được cấp mật khẩu tạm ban đầu (12345678). Để đảm bảo an toàn thông tin của phòng họp, bạn bắt buộc phải thiết lập mật khẩu mới trước khi tiếp tục.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 text-xs font-medium text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Mật khẩu mới (tối thiểu 8 ký tự)
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-xl h-10 border-border bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Nhập lại mật khẩu mới
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="rounded-xl h-10 border-border bg-background"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang lưu mật khẩu mới...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Cập nhật mật khẩu & Mở phòng
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
