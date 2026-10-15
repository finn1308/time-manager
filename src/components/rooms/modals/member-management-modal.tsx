"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  UserPlus,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
} from "lucide-react";
import { toast } from "sonner";

interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  image?: string | null;
  role: string;
  status: string;
  joinedAt: string;
  mustChangePassword?: boolean;
}

interface MemberManagementModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  isAdmin: boolean;
  isHost: boolean;
  onMembersUpdated?: () => void;
}

export function MemberManagementModal({
  open,
  onClose,
  roomId,
  isAdmin,
  isHost,
  onMembersUpdated,
}: MemberManagementModalProps) {
  const [tab, setTab] = useState<"list" | "import">("list");
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Bulk import state
  const [importText, setImportText] = useState("");
  const [importRole, setImportRole] = useState<"MEMBER" | "HOST">("MEMBER");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{
    added: number;
    linked: number;
    alreadyMembers: number;
    errors: string[];
  } | null>(null);

  // Reset password state
  const [resettingId, setResettingId] = useState<string | null>(null);

  const fetchMembers = async () => {
    if (!roomId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải danh sách");
      setMembers(data.members || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thành viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMembers();
      setTab("list");
      setImportText("");
      setImportSummary(null);
    }
  }, [open, roomId]);

  const handleBulkImport = async () => {
    const lines = importText
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      toast.error("Vui lòng nhập ít nhất một dòng danh sách thành viên");
      return;
    }

    setImporting(true);
    setImportSummary(null);

    try {
      const res = await fetch(`/api/rooms/${roomId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines, defaultRole: importRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thêm thành viên thất bại");

      setImportSummary(data.summary);
      toast.success(
        `Thành công: Thêm mới ${data.summary.added}, liên kết ${data.summary.linked} tài khoản.`
      );
      fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm thành viên");
    } finally {
      setImporting(false);
    }
  };

  const handleResetPassword = async (member: Member) => {
    if (!confirm(`Bạn có chắc muốn đặt lại mật khẩu cho thành viên "${member.name}" về mật khẩu tạm "12345678"?`)) {
      return;
    }

    setResettingId(member.id);
    try {
      const res = await fetch(`/api/rooms/${roomId}/members/${member.id}/reset-password`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đặt lại mật khẩu thất bại");

      toast.success(data.message || "Đã đặt lại mật khẩu thành công!");
      fetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Lỗi đặt lại mật khẩu");
    } finally {
      setResettingId(null);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "ADMIN" | "HOST" | "MEMBER") => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cập nhật vai trò thất bại");

      toast.success(`Đã cập nhật vai trò thành ${newRole}`);
      fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi đổi vai trò");
    }
  };

  const handleRemoveMember = async (member: Member) => {
    if (!confirm(`Bạn có chắc muốn xóa "${member.name}" khỏi phòng họp?`)) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/members/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa thành viên thất bại");

      toast.success("Đã xóa thành viên khỏi phòng");
      fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa thành viên");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl p-6 bg-card border border-border rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  Quản lý thành viên phòng
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Phân quyền vai trò (Admin / Host / Thành viên) và cấp mật khẩu tạm ban đầu.
                </DialogDescription>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border">
                <button
                  type="button"
                  onClick={() => setTab("list")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    tab === "list" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  Danh sách ({members.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("import")}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    tab === "import" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Thêm hàng loạt
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {tab === "list" ? (
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Tìm thành viên theo tên hoặc email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-xl text-xs bg-background border-border"
              />
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-xs">Đang tải danh sách thành viên...</p>
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Không tìm thấy thành viên phù hợp
                </div>
              ) : (
                filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-card border border-border flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-foreground truncate">{m.name}</p>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              m.role === "ADMIN"
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                : m.role === "HOST"
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                        {m.mustChangePassword && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-amber-500 font-medium mt-0.5">
                            <ShieldAlert className="w-3 h-3" />
                            Chưa đổi mật khẩu tạm (12345678)
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Role selection */}
                        {m.role !== "ADMIN" && (
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value as any)}
                            className="h-8 px-2 text-xs rounded-lg border border-border bg-background text-foreground"
                          >
                            <option value="MEMBER">Thành viên</option>
                            <option value="HOST">Host</option>
                          </select>
                        )}

                        {/* Reset password button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resettingId === m.id}
                          onClick={() => handleResetPassword(m)}
                          className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          title="Cấp lại mật khẩu tạm (12345678)"
                        >
                          {resettingId === m.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <KeyRound className="w-3 h-3" />
                          )}
                          Reset PW
                        </Button>

                        {/* Delete member */}
                        {m.role !== "ADMIN" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveMember(m)}
                            className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                            title="Xóa khỏi phòng"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground">Định dạng hỗ trợ (mỗi dòng một thành viên):</p>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                <li><code>Nguyễn Văn A &lt;a@gmail.com&gt;</code></li>
                <li><code>b@gmail.com | Trần Thị B</code></li>
                <li><code>c@gmail.com</code></li>
                <li><code>Lê Văn C</code> (hệ thống tự tạo email định danh)</li>
              </ul>
              <p className="pt-1 text-[11px] text-primary font-medium">
                Mật khẩu tạm ban đầu mặc định là <code>12345678</code>. Thành viên sẽ bị bắt buộc đổi mật khẩu ngay ở lần đăng nhập đầu tiên.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Nhập danh sách thành viên
              </label>
              <textarea
                placeholder="VD:
Nguyễn Văn A <vana@gmail.com>
lanhuong@gmail.com | Phạm Lan Hương
ducminh@school.edu.vn"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Vai trò mặc định:</span>
                <select
                  value={importRole}
                  onChange={(e) => setImportRole(e.target.value as any)}
                  className="h-8 px-2 text-xs rounded-lg border border-border bg-background"
                >
                  <option value="MEMBER">Thành viên</option>
                  <option value="HOST">Host</option>
                </select>
              </div>

              <Button
                type="button"
                disabled={importing || !importText.trim()}
                onClick={handleBulkImport}
                className="h-9 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang thêm...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    Thêm vào phòng
                  </>
                )}
              </Button>
            </div>

            {importSummary && (
              <div className="p-3 rounded-xl bg-card border border-border space-y-2 text-xs">
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Kết quả xử lý:
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <p className="text-lg font-bold">{importSummary.added}</p>
                    <p className="text-[10px]">Tài khoản mới</p>
                  </div>
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    <p className="text-lg font-bold">{importSummary.linked}</p>
                    <p className="text-[10px]">Đã liên kết</p>
                  </div>
                  <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                    <p className="text-lg font-bold">{importSummary.alreadyMembers}</p>
                    <p className="text-[10px]">Đã là thành viên</p>
                  </div>
                </div>
                {importSummary.errors.length > 0 && (
                  <div className="p-2 rounded-lg bg-destructive/10 text-destructive text-[11px] space-y-1">
                    <p className="font-bold">Lỗi ({importSummary.errors.length}):</p>
                    {importSummary.errors.map((e, idx) => (
                      <p key={idx}>{e}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
