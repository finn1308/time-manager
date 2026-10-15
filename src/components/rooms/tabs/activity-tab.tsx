"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Clock,
  Sparkles,
  Shield,
  UserCheck,
  CheckCircle2,
  FolderKanban,
  KeyRound,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface AuditEvent {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: any;
  createdAt: string;
  actor: {
    name: string | null;
    email: string | null;
    image?: string | null;
  };
}

interface ActivityTabProps {
  roomId: string;
}

export function ActivityTab({ roomId }: ActivityTabProps) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/audit`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải nhật ký");
      setEvents(data.events || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải lịch sử");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [roomId]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case "ROOM_CREATED":
        return { label: "Khởi tạo phòng họp", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case "ROOM_UPDATED":
        return { label: "Cập nhật cài đặt phòng", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" };
      case "CARD_CREATED":
        return { label: "Tạo thẻ công việc mới", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" };
      case "CARD_MOVED":
        return { label: "Di chuyển cột công việc", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" };
      case "CARD_UPDATED":
        return { label: "Chỉnh sửa thông tin thẻ", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" };
      case "CARD_DELETED":
        return { label: "Xóa thẻ công việc", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case "MEMBERS_BULK_ADDED":
        return { label: "Thêm thành viên hàng loạt", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "MEMBER_ROLE_UPDATED":
        return { label: "Đổi vai trò thành viên", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "MEMBER_PASSWORD_RESET":
        return { label: "Đặt lại mật khẩu tạm thành viên", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "MEMBER_REMOVED":
        return { label: "Xóa thành viên khỏi phòng", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
      case "GROUP_CREATED":
        return { label: "Tạo nhóm làm việc mới", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400" };
      case "GROUP_JOIN_REQUESTED":
        return { label: "Gửi yêu cầu tham gia nhóm", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
      case "GROUP_REQUEST_APPROVED":
        return { label: "Duyệt yêu cầu vào nhóm", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "GROUP_REQUEST_REJECTED":
        return { label: "Từ chối yêu cầu vào nhóm", color: "bg-muted text-muted-foreground" };
      case "POST_CREATED":
        return { label: "Đăng chia sẻ cập nhật", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
      case "POST_DELETED":
        return { label: "Xóa bài cập nhật", color: "bg-muted text-muted-foreground" };
      default:
        return { label: action, color: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Nhật ký hoạt động & Kiểm tra kiểm toán (Audit Trail)</h3>
          <p className="text-xs text-muted-foreground">
            Lịch sử minh bạch ghi nhận toàn bộ các thao tác quản trị, di chuyển thẻ và duyệt thành viên.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={fetchEvents}
          disabled={loading}
          className="h-8 px-2.5 text-xs rounded-xl gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">Đang tải nhật ký kiểm toán...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-card border border-border p-6 space-y-2">
          <History className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">Chưa có nhật ký hoạt động nào</p>
          <p className="text-xs text-muted-foreground">
            Các thao tác tạo phòng, thêm thẻ, cập nhật tiến độ sẽ được lưu trữ an toàn tại đây.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {events.map((e) => {
            const badge = getActionLabel(e.action);

            return (
              <div key={e.id} className="relative flex items-start gap-3">
                <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />

                <div className="w-full p-3.5 rounded-xl bg-card border border-border space-y-1.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${badge.color}`}>
                        {badge.label}
                      </span>
                      <span className="text-xs font-semibold text-foreground">
                        {e.actor.name || "Hệ thống"}
                      </span>
                    </div>

                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(e.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                      - {new Date(e.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {e.details && (
                    <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg font-mono text-[11px] break-all">
                      {typeof e.details === "object" ? JSON.stringify(e.details) : String(e.details)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
