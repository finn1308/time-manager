"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Sparkles, Copy, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onRoomCreated?: () => void;
}

const COLOR_OPTIONS = [
  { key: "lavender", label: "Lavender", bg: "bg-purple-100 dark:bg-purple-950/60", border: "border-purple-300 dark:border-purple-800" },
  { key: "peach", label: "Peach", bg: "bg-orange-100 dark:bg-orange-950/60", border: "border-orange-300 dark:border-orange-800" },
  { key: "mint", label: "Mint", bg: "bg-emerald-100 dark:bg-emerald-950/60", border: "border-emerald-300 dark:border-emerald-800" },
  { key: "sky", label: "Sky", bg: "bg-sky-100 dark:bg-sky-950/60", border: "border-sky-300 dark:border-sky-800" },
  { key: "rose", label: "Rose", bg: "bg-rose-100 dark:bg-rose-950/60", border: "border-rose-300 dark:border-rose-800" },
  { key: "amber", label: "Amber", bg: "bg-amber-100 dark:bg-amber-950/60", border: "border-amber-300 dark:border-amber-800" },
];

export function CreateRoomModal({ open, onClose, onRoomCreated }: CreateRoomModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [coverColor, setCoverColor] = useState("lavender");
  const [joinPolicy, setJoinPolicy] = useState("INVITE_ONLY");
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<{ id: string; publicId: string; title: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setDescription("");
    setCoverColor("lavender");
    setJoinPolicy("INVITE_ONLY");
    setCreatedRoom(null);
    setCopied(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          description: description || undefined,
          coverColor,
          joinPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể tạo phòng họp");
      }

      toast.success("Tạo phòng họp thành công!");
      setCreatedRoom(data.room);
      onRoomCreated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo phòng họp");
    } finally {
      setLoading(false);
    }
  };

  const getFullUrl = (publicId: string) => {
    if (typeof window === "undefined") return `/rooms/${publicId}`;
    return `${window.location.origin}/rooms/${publicId}`;
  };

  const copyRoomLink = () => {
    if (!createdRoom) return;
    const url = getFullUrl(createdRoom.publicId);
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Đã sao chép liên kết phòng họp vào bộ nhớ tạm");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            {createdRoom ? "Phòng họp đã sẵn sàng!" : "Tạo phòng họp mới"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {createdRoom
              ? "URL ngẫu nhiên bảo mật cao đã được khởi tạo. Bạn có thể sao chép liên kết để mời thành viên."
              : "Thiết lập không gian cộng tác riêng tư, quản lý bài tập, nhóm và bảng công việc kiểu Trello."}
          </DialogDescription>
        </DialogHeader>

        {createdRoom ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 rounded-xl bg-muted/50 border border-border space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Liên kết truy cập phòng:
              </span>
              <div className="flex items-center gap-2 bg-background p-2.5 rounded-lg border border-border">
                <code className="text-xs font-mono text-primary flex-1 truncate select-all">
                  {getFullUrl(createdRoom.publicId)}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyRoomLink}
                  className="h-8 px-2.5 rounded-md text-xs gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Đã chép" : "Sao chép"}
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1 rounded-xl h-10 text-xs font-medium"
              >
                Đóng
              </Button>
              <Button
                type="button"
                onClick={() => {
                  handleClose();
                  router.push(`/rooms/${createdRoom.publicId}`);
                }}
                className="flex-1 rounded-xl h-10 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground"
              >
                Mở phòng ngay
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Tên phòng họp <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Nhóm Đồ án Tốt nghiệp 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="rounded-xl h-10 border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Môn học / Chủ đề <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="VD: Kiến trúc Phần mềm & AI"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                maxLength={100}
                className="rounded-xl h-10 border-border bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Mô tả ngắn (tùy chọn)
              </label>
              <textarea
                placeholder="Mô tả mục tiêu, lịch làm việc hoặc tài liệu quan trọng..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
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
                <option value="OPEN">Mở (Bất kỳ thành viên nào có link đều vào được)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="rounded-xl h-10 px-4 text-xs"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim() || !subject.trim()}
                className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang tạo phòng...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Tạo phòng họp
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
