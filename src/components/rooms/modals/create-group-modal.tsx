"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users2, Plus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  onGroupCreated?: () => void;
}

const GROUP_COLORS = [
  { key: "sky", label: "Sky", bg: "bg-sky-500" },
  { key: "lavender", label: "Lavender", bg: "bg-purple-500" },
  { key: "mint", label: "Mint", bg: "bg-emerald-500" },
  { key: "rose", label: "Rose", bg: "bg-rose-500" },
  { key: "amber", label: "Amber", bg: "bg-amber-500" },
];

export function CreateGroupModal({ open, onClose, roomId, onGroupCreated }: CreateGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("sky");
  const [joinPolicy, setJoinPolicy] = useState<"OPEN" | "APPROVAL_REQUIRED" | "INVITE_ONLY">("APPROVAL_REQUIRED");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên nhóm");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/groups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
          joinPolicy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo nhóm thất bại");

      toast.success(`Đã tạo nhóm "${name}" thành công!`);
      setName("");
      setDescription("");
      setColor("sky");
      setJoinPolicy("APPROVAL_REQUIRED");
      onGroupCreated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Tạo nhóm mới trong phòng
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Phân chia thành viên thành các nhóm nhỏ (VD: Nhóm 1, Nhóm 2, Nhóm Thiết kế...).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Tên nhóm <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="VD: Nhóm 1 - Backend & Database"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={50}
              className="rounded-xl h-10 border-border bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Mô tả mục tiêu của nhóm
            </label>
            <textarea
              placeholder="Mục tiêu hoặc nhiệm vụ phân công của nhóm..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Màu biểu trưng
            </label>
            <div className="flex items-center gap-2 pt-1">
              {GROUP_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setColor(c.key)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${c.bg} ${
                    color === c.key ? "ring-2 ring-primary scale-110 border-primary" : "border-transparent"
                  }`}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Chính sách tham gia nhóm
            </label>
            <select
              value={joinPolicy}
              onChange={(e) => setJoinPolicy(e.target.value as any)}
              className="w-full h-10 px-3 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              <option value="APPROVAL_REQUIRED">Cần duyệt (Thành viên xin vào, Host/Admin duyệt)</option>
              <option value="OPEN">Tự do tham gia (Ai bấm vào là vào luôn)</option>
              <option value="INVITE_ONLY">Chỉ mời (Chỉ Host/Admin mới thêm vào được)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-4 text-xs">
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Tạo nhóm
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
