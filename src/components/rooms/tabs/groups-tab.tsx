"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Users2,
  Plus,
  ShieldCheck,
  Clock,
  Check,
  X,
  UserCheck,
  UserPlus,
  Loader2,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { CreateGroupModal } from "../modals/create-group-modal";

interface Group {
  id: string;
  name: string;
  description?: string | null;
  color: string | null;
  joinPolicy: string;
  memberCount: number;
  isMember: boolean;
  requestStatus: "PENDING" | null;
  members: Array<{
    membershipId: string;
    userId: string;
    name: string;
    image?: string | null;
  }>;
  pendingRequests: Array<{
    id: string;
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    image?: string | null;
    createdAt: string;
  }>;
}

interface GroupsTabProps {
  roomId: string;
  isAdmin: boolean;
  isHost: boolean;
  currentUserId: string;
  onGroupsChanged?: () => void;
}

export function GroupsTab({ roomId, isAdmin, isHost, currentUserId, onGroupsChanged }: GroupsTabProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/groups`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải nhóm");
      setGroups(data.groups || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải nhóm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [roomId]);

  const handleJoinGroup = async (group: Group) => {
    setJoiningId(group.id);
    try {
      const res = await fetch(`/api/rooms/${roomId}/groups/${group.id}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể gửi yêu cầu");

      toast.success(data.message || "Đã gửi yêu cầu tham gia");
      fetchGroups();
      onGroupsChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tham gia nhóm");
    } finally {
      setJoiningId(null);
    }
  };

  const handleReviewRequest = async (groupId: string, requestId: string, action: "APPROVE" | "REJECT") => {
    setProcessingRequestId(requestId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/groups/${groupId}/requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thao tác thất bại");

      toast.success(data.message || (action === "APPROVE" ? "Đã duyệt thành viên" : "Đã từ chối"));
      fetchGroups();
      onGroupsChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xử lý yêu cầu");
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!confirm(`Bạn có chắc muốn xóa nhóm "${group.name}"?`)) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/groups/${group.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa nhóm thất bại");

      toast.success("Đã xóa nhóm thành công");
      fetchGroups();
      onGroupsChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa nhóm");
    }
  };

  // Collect all pending requests for host/admin summary
  const allPendingRequests = groups.flatMap((g) =>
    g.pendingRequests.map((r) => ({ ...r, groupId: g.id, groupName: g.name }))
  );

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-foreground">Phân chia nhóm học tập & đồ án</h3>
          <p className="text-xs text-muted-foreground">
            Các nhóm con phối hợp theo chuyên môn hoặc nhóm thảo luận bài tập riêng biệt.
          </p>
        </div>

        {(isHost || isAdmin) && (
          <Button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="rounded-xl h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo nhóm mới
          </Button>
        )}
      </div>

      {/* Pending requests banner for Host/Admin */}
      {(isHost || isAdmin) && allPendingRequests.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
            <Clock className="w-4 h-4" />
            Yêu cầu xin gia nhập nhóm chờ duyệt ({allPendingRequests.length})
          </div>

          <div className="space-y-2">
            {allPendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {req.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {req.name} <span className="text-muted-foreground font-normal">muốn vào</span>{" "}
                      <span className="text-primary font-bold">{req.groupName}</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{req.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={processingRequestId === req.id}
                    onClick={() => handleReviewRequest(req.groupId, req.id, "REJECT")}
                    className="h-7 px-2.5 text-xs text-destructive hover:bg-destructive/10"
                  >
                    Từ chối
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={processingRequestId === req.id}
                    onClick={() => handleReviewRequest(req.groupId, req.id, "APPROVE")}
                    className="h-7 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                  >
                    {processingRequestId === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Duyệt vào nhóm
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-xs">Đang tải danh sách nhóm...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-card border border-border p-6 space-y-2">
          <Users2 className="w-8 h-8 mx-auto text-muted-foreground/60" />
          <p className="text-sm font-semibold text-foreground">Phòng họp chưa có nhóm con</p>
          <p className="text-xs text-muted-foreground">
            Host hoặc Admin có thể nhấn "Tạo nhóm mới" để phân chia thành viên thành các nhóm làm việc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-colors space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <h4 className="text-sm font-bold text-foreground">{group.name}</h4>
                  </div>
                  {group.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                  )}
                </div>

                {(isHost || isAdmin) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteGroup(group)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="Xóa nhóm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              {/* Members preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Thành viên ({group.memberCount})
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {group.members.length === 0 ? (
                    <span className="text-xs text-muted-foreground italic">Chưa có thành viên nào</span>
                  ) : (
                    group.members.map((m) => (
                      <span
                        key={m.membershipId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-foreground"
                      >
                        <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center">
                          {m.name.charAt(0).toUpperCase()}
                        </span>
                        {m.name}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Join action */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Chính sách:{" "}
                  <strong>
                    {group.joinPolicy === "OPEN"
                      ? "Mở tự do"
                      : group.joinPolicy === "APPROVAL_REQUIRED"
                      ? "Cần duyệt"
                      : "Chỉ mời"}
                  </strong>
                </span>

                {group.isMember ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    <Check className="w-3.5 h-3.5" />
                    Đã tham gia
                  </span>
                ) : group.requestStatus === "PENDING" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                    Đang chờ duyệt
                  </span>
                ) : group.joinPolicy !== "INVITE_ONLY" ? (
                  <Button
                    type="button"
                    size="sm"
                    disabled={joiningId === group.id}
                    onClick={() => handleJoinGroup(group)}
                    className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground gap-1 rounded-xl"
                  >
                    {joiningId === group.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Xin tham gia nhóm
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Chỉ mời</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create group modal */}
      <CreateGroupModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomId={roomId}
        onGroupCreated={() => {
          fetchGroups();
          onGroupsChanged?.();
        }}
      />
    </div>
  );
}
