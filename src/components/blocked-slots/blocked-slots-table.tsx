"use client";

import React, { useState } from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Lock, Plus, Trash2, Edit2 } from "lucide-react";
import { BlockedSlotDialog } from "./blocked-slot-dialog";
import { useRouter } from "next/navigation";

interface BlockedSlotItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  isRecurring: boolean;
  isLocked: boolean;
}

interface BlockedSlotsTableProps {
  slots: BlockedSlotItem[];
}

const DAY_LABELS: Record<number, string> = {
  0: "Chủ Nhật",
  1: "Thứ Hai",
  2: "Thứ Ba",
  3: "Thứ Tư",
  4: "Thứ Năm",
  5: "Thứ Sáu",
  6: "Thứ Bảy",
};

export function BlockedSlotsTable({ slots }: BlockedSlotsTableProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any | null>(null);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn mở khóa và xóa khung giờ "${title}"?`)) return;
    try {
      await fetch(`/api/blocked-slots?id=${id}`, { method: "DELETE" });
      router.refresh();
    } catch {
      alert("Không thể xóa khung giờ");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-medium">
          Có {slots.length} khung giờ bị khóa. Thuật toán AI sẽ coi đây là vùng bất khả xâm phạm.
        </p>

        <Button
          variant="amber"
          size="sm"
          onClick={() => {
            setEditingSlot(null);
            setIsModalOpen(true);
          }}
          className="space-x-1.5 text-xs font-bold"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Khóa khung giờ mới</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 soft-card-shadow">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Mục đích / Tiêu đề</th>
              <th className="py-3.5 px-4">Khung giờ (VN)</th>
              <th className="py-3.5 px-4">Ngày lặp lại</th>
              <th className="py-3.5 px-4 text-center">Trạng thái khóa</th>
              <th className="py-3.5 px-5 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {slots.map((slot) => (
              <tr key={slot.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-4 px-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {slot.title}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                  {slot.startTime} - {slot.endTime}
                </td>

                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">
                  {slot.dayOfWeek !== null && slot.dayOfWeek !== undefined ? (
                    <Badge variant="secondary">
                      {DAY_LABELS[slot.dayOfWeek]}
                    </Badge>
                  ) : slot.specificDate ? (
                    <span>Ngày {new Date(slot.specificDate).toLocaleDateString("vi-VN")}</span>
                  ) : (
                    <Badge variant="outline">Hằng ngày</Badge>
                  )}
                </td>

                <td className="py-4 px-4 text-center">
                  {slot.isLocked ? (
                    <Badge variant="yellow" className="font-bold">
                      Khóa tuyệt đối (100%)
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Cảnh báo</Badge>
                  )}
                </td>

                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingSlot(slot);
                        setIsModalOpen(true);
                      }}
                      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id, slot.title)}
                      className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {slots.length === 0 && (
              <tr>
                <td colSpan={5} className="py-14 text-center text-sm text-slate-400">
                  Chưa có khung giờ nào bị khóa. Hãy thiết lập giờ ngủ hoặc lịch bận để AI tránh!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <BlockedSlotDialog
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingSlot(null);
          }}
          editingSlot={editingSlot}
        />
      )}
    </div>
  );
}
