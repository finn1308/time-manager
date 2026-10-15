"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Settings2, Trash2, AlertTriangle, Save } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface EditRoomModalProps {
  open: boolean;
  onClose: () => void;
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
    description: string | null;
    coverColor: string | null;
    joinPolicy: string;
  };
  onRoomUpdated?: () => void;
}

const COLOR_OPTIONS = [
  { key: "lavender", label: "Lavender", bg: "bg-purple-100 dark:bg-purple-950/60" },
  { key: "peach", label: "Peach", bg: "bg-orange-100 dark:bg-orange-950/60" },
  { key: "mint", label: "Mint", bg: "bg-emerald-100 dark:bg-emerald-950/60" },
  { key: "sky", label: "Sky", bg: "bg-sky-100 dark:bg-sky-950/60" },
  { key: "rose", label: "Rose", bg: "bg-rose-100 dark:bg-rose-950/60" },
  { key: "amber", label: "Amber", bg: "bg-amber-100 dark:bg-amber-950/60" },
];

export function EditRoomModal({ open, onClose, room, onRoomUpdated }: EditRoomModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(room.title);
  const [subject, setSubject] = useState(room.subject);
  const [description, setDescription] = useState(room.description || "");
  const [coverColor, setCoverColor] = useState(room.coverColor || "lavender");
  const [joinPolicy, setJoinPolicy] = useState(room.joinPolicy || "INVITE_ONLY");
  const [loading, setLoading] = useState(false);

  // Danger zone: Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmName, setConfirmName] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setTitle(room.title);
    setSubject(room.subject);
    setDescription(room.description || "");
    setCoverColor(room.coverColor || "lavender");
    setJoinPolicy(room.joinPolicy || "INVITE_ONLY");
    setShowDeleteConfirm(false);
    setConfirmName("");
  }, [room, open]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          description: description || null,
          coverColor,
          joinPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật phòng");
      }

      toast.success("Cập nhật thông tin phòng thành công!");
      onRoomUpdated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi cập nhật");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (confirmName.trim().toLowerCase() !== room.title.trim().toLowerCase()) {
      toast.error("Tên phòng xác nhận không khớp!");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa phòng");
      }

      toast.success("Đã xóa phòng họp thành công!");
      onClose();
      router.push("/rooms");
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa phòng");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Settings2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Cài đặt phòng họp
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Chỉnh sửa tên, môn học, quyền truy cập hoặc xóa phòng họp này.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdate} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Tên phòng họp
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-xl h-10 border-border bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Môn học / Chủ đề
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="rounded-xl h-10 border-border bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Mô tả ngắn
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Màu sắc nhận diện
            </label>
            <div className="flex items-center gap-2 pt-1">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCoverColor(c.key)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${c.bg} ${
                    coverColor === c.key ? "ring-2 ring-primary scale-110 border-primary" : "border-transparent"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Chế độ tham gia
            </label>
            <select
              value={joinPolicy}
              onChange={(e) => setJoinPolicy(e.target.value)}
              className="w-full h-10 px-3 text-sm rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="INVITE_ONLY">Chỉ mời (Admin thêm trực tiếp)</option>
              <option value="APPROVAL_REQUIRED">Cần duyệt (Có link và gửi yêu cầu)</option>
              <option value="OPEN">Mở (Bất kỳ ai có link đều vào được)</option>
            </select>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="text-xs text-destructive hover:bg-destructive/10 gap-1.5 h-9 px-3"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Xóa phòng...
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="rounded-xl h-9 px-3 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="rounded-xl h-9 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-semibold text-destructive">Hành động nguy hiểm không thể hoàn tác!</p>
                  <p className="text-muted-foreground leading-relaxed">
                    Tất cả bảng công việc, nhóm, bài viết và thành viên trong phòng này sẽ bị xóa vĩnh viễn. Nhập chính xác tên phòng <strong>"{room.title}"</strong> để xác nhận:
                  </p>
                </div>
              </div>
              <Input
                placeholder={room.title}
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="h-9 text-xs border-destructive/30 bg-background"
              />
              <Button
                type="button"
                variant="destructive"
                disabled={deleting || confirmName.trim().toLowerCase() !== room.title.trim().toLowerCase()}
                onClick={handleDelete}
                className="w-full h-9 text-xs font-semibold"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Đang xóa phòng...
                  </>
                ) : (
                  "Tôi hiểu hệ quả, xóa vĩnh viễn phòng này"
                )}
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
