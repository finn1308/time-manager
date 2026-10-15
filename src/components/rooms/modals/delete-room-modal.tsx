"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteRoomModalProps {
  open: boolean;
  onClose: () => void;
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
  } | null;
  onRoomDeleted: () => void;
}

export function DeleteRoomModal({
  open,
  onClose,
  room,
  onRoomDeleted,
}: DeleteRoomModalProps) {
  const [confirmName, setConfirmName] = useState("");
  const [loading, setLoading] = useState(false);

  if (!room) return null;

  const isMatched =
    confirmName.trim().toLowerCase() === room.title.trim().toLowerCase();

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMatched) {
      toast.error("Tên phòng xác nhận không khớp!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${room.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa phòng họp");
      }

      toast.success(`Đã xóa vĩnh viễn phòng họp "${room.title}"`);
      setConfirmName("");
      onRoomDeleted();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa phòng họp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 bg-card border border-destructive/30 rounded-2xl shadow-2xl">
        <DialogHeader className="space-y-2">
          <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <DialogTitle className="text-lg font-bold text-foreground">
            Xác nhận xóa phòng họp
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Hành động này <strong className="text-destructive">không thể hoàn tác</strong>. Toàn bộ dữ liệu của phòng{" "}
            <strong className="text-foreground">"{room.title}"</strong> ({room.subject}) bao gồm thẻ công việc, nhóm, thành viên và nhật ký hoạt động sẽ bị xóa vĩnh viễn.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleDelete} className="mt-3 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Nhập chính xác tên phòng để xác nhận:{" "}
              <span className="font-mono font-bold text-primary select-all">
                {room.title}
              </span>
            </label>
            <Input
              type="text"
              placeholder={`Nhập "${room.title}"`}
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="h-10 text-xs rounded-xl border-border bg-background"
              autoFocus
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setConfirmName("");
                onClose();
              }}
              disabled={loading}
              className="h-9 px-4 text-xs rounded-xl"
            >
              Hủy bỏ
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={!isMatched || loading}
              className="h-9 px-4 text-xs font-bold rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5 shadow-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa vĩnh viễn
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
