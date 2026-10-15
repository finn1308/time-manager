"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  KeyRound,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Lock,
  User,
  Link2,
} from "lucide-react";
import { toast } from "sonner";

interface AdminCredentialsModalProps {
  open: boolean;
  onClose: () => void;
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
  } | null;
}

interface CredentialData {
  username: string;
  email: string;
  publicId: string;
  roomTitle: string;
  roomSubject: string;
  mustChangePassword: boolean;
  initialPassword: string | null;
}

export function AdminCredentialsModal({
  open,
  onClose,
  room,
}: AdminCredentialsModalProps) {
  const [data, setData] = useState<CredentialData | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchCredentials = async () => {
    if (!room) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/admin-credentials`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể tải thông tin tài khoản");
      }
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thông tin tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && room) {
      fetchCredentials();
    } else {
      setData(null);
    }
  }, [open, room]);

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getFullRoomUrl = () => {
    if (!room) return "";
    if (typeof window === "undefined") return `/rooms/${room.publicId}`;
    return `${window.location.origin}/rooms/${room.publicId}`;
  };

  const copyAllInfo = () => {
    if (!data || !room) return;
    const roomUrl = getFullRoomUrl();
    const pwText = data.mustChangePassword
      ? "12345678 (mật khẩu tạm ban đầu)"
      : "(Mật khẩu đã được bạn tự thiết lập)";

    const fullText = `THÔNG TIN ĐĂNG NHẬP ADMIN PHÒNG HỌP\nPhòng: ${room.title} (${room.subject})\nMã phòng: ${room.publicId}\nLink phòng: ${roomUrl}\nTên đăng nhập: ${data.username}\nMật khẩu: ${pwText}`;

    navigator.clipboard.writeText(fullText);
    setCopiedField("all");
    toast.success("Đã sao chép toàn bộ thông tin đăng nhập");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleResetPassword = async () => {
    if (!room) return;
    if (
      !confirm(
        "Bạn có chắc muốn đặt lại mật khẩu của tài khoản Admin phòng về mật khẩu tạm 12345678?"
      )
    ) {
      return;
    }

    setResetting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}/admin-credentials`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể đặt lại mật khẩu");
      }
      toast.success("Đã đặt lại mật khẩu tạm thành 12345678!");
      fetchCredentials();
    } catch (err: any) {
      toast.error(err.message || "Lỗi đặt lại mật khẩu");
    } finally {
      setResetting(false);
    }
  };

  if (!room) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Tài khoản Admin phòng họp
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Sử dụng thông tin này để đăng nhập độc lập vào không gian phòng họp riêng:{" "}
            <span className="font-bold text-foreground">{room.title}</span> ({room.subject}).
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs font-medium">Đang tải thông tin tài khoản...</p>
          </div>
        ) : data ? (
          <div className="mt-3 space-y-4">
            {/* Room Link */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Link2 className="w-3 h-3 text-primary" />
                Đường dẫn phòng họp (URL)
              </span>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-xs font-mono font-medium text-foreground truncate select-all">
                  {getFullRoomUrl()}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(getFullRoomUrl(), "link")}
                  className="h-7 px-2 text-xs rounded-lg gap-1 shrink-0"
                >
                  {copiedField === "link" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedField === "link" ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </div>

            {/* Username */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <User className="w-3 h-3 text-primary" />
                Tên đăng nhập Admin
              </span>
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-xs font-mono font-bold text-foreground select-all">
                  {data.username}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyText(data.username, "tên đăng nhập")}
                  className="h-7 px-2 text-xs rounded-lg gap-1 shrink-0"
                >
                  {copiedField === "tên đăng nhập" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedField === "tên đăng nhập" ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </div>

            {/* Password info */}
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-primary" />
                  Mật khẩu đăng nhập
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-sm font-bold uppercase tracking-wider ${
                    data.mustChangePassword
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {data.mustChangePassword ? "Mật khẩu tạm" : "Đã thiết lập"}
                </span>
              </div>

              {data.mustChangePassword ? (
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs font-mono font-bold text-foreground select-all">
                    12345678
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyText("12345678", "mật khẩu")}
                    className="h-7 px-2 text-xs rounded-lg gap-1 shrink-0"
                  >
                    {copiedField === "mật khẩu" ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    {copiedField === "mật khẩu" ? "Đã chép" : "Sao chép"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">
                    Bạn đã đổi sang mật khẩu riêng. Để đảm bảo an toàn, hệ thống không lưu mật khẩu dạng thô.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetPassword}
                    disabled={resetting}
                    className="h-7 px-2 text-[11px] rounded-lg text-primary hover:bg-primary/10 gap-1"
                  >
                    {resetting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    Đặt lại về mật khẩu tạm 12345678
                  </Button>
                </div>
              )}
            </div>

            {data.mustChangePassword && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Sau khi đăng nhập qua URL phòng với mật khẩu tạm <strong>12345678</strong>, hệ thống sẽ yêu cầu bạn đổi mật khẩu mới để bảo mật phòng.
                </span>
              </div>
            )}

            {/* Action buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyAllInfo}
                className="flex-1 h-9 rounded-xl text-xs font-medium gap-1.5"
              >
                {copiedField === "all" ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                {copiedField === "all" ? "Đã sao chép tất cả" : "Sao chép tất cả"}
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  window.open(`/rooms/${room.publicId}`, "_blank");
                }}
                className="flex-1 h-9 rounded-xl text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                Mở phòng & Đăng nhập
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
