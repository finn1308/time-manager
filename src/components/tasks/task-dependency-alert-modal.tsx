"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { AlertTriangle, Lock, CheckCircle2, ArrowRight } from "lucide-react";

interface TaskDependencyAlertModalProps {
  open: boolean;
  onClose: () => void;
  taskTitle: string;
  blockingTasks: Array<{ id: string; title: string; status: string }>;
  onForceConfirm: () => void;
}

export function TaskDependencyAlertModal({
  open,
  onClose,
  taskTitle,
  blockingTasks,
  onForceConfirm,
}: TaskDependencyAlertModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md rounded-[28px] border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-xl">
        <DialogHeader>
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
            <Lock className="w-4 h-4" />
            <span>QUY TẮC PHỤ THUỘC (TASK DEPENDENCY)</span>
          </div>
          <DialogTitle className="text-lg font-bold text-[var(--text-ink)]">
            Task chưa sẵn sàng hoàn thành
          </DialogTitle>
          <DialogDescription className="text-xs text-[var(--text-subtle)]">
            Task <strong>"{taskTitle}"</strong> được thiết lập phụ thuộc vào các task tiên quyết cần phải hoàn thành trước:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-3">
          {blockingTasks.map((bt) => (
            <div
              key={bt.id}
              className="p-3 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 flex items-center justify-between"
            >
              <div className="flex items-center space-x-2.5 truncate">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-[var(--text-ink)] truncate">
                  {bt.title}
                </span>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0">
                {bt.status}
              </span>
            </div>
          ))}
          <p className="text-[11px] text-[var(--text-muted)] pt-1">
            Để tuân thủ tiến trình học tập tối ưu, bạn nên hoàn thành các task trên trước khi tiến hành task này.
          </p>
        </div>

        <DialogFooter className="pt-2 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-2xl border-[var(--border)] text-xs font-semibold"
          >
            Quay lại làm task tiên quyết
          </Button>
          <Button
            type="button"
            onClick={() => {
              onForceConfirm();
              onClose();
            }}
            className="rounded-2xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
          >
            Vẫn hoàn thành (Bỏ qua phụ thuộc)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
