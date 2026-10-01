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
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#787774] dark:text-[#9b9a97]">
          Có {slots.length} khung giờ bị khóa. Thuật toán AI sẽ coi đây là vùng bất khả xâm phạm.
        </p>

        <Button
          variant="default"
          size="sm"
          onClick={() => {
            setEditingSlot(null);
            setIsModalOpen(true);
          }}
          className="space-x-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Khóa khung giờ mới</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#202020] shadow-xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#e9e9e7] dark:border-[#2e2e2e] bg-[#f7f6f3] dark:bg-[#252525] text-[#787774] dark:text-[#9b9a97]">
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Mục đích / Tiêu đề</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Khung giờ (VN)</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Ngày lặp lại</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-center">Trạng thái khóa</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9e9e7] dark:divide-[#2e2e2e]">
            {slots.map((slot) => (
              <tr key={slot.id} className="hover:bg-[#fbfbfa] dark:hover:bg-[#242424] transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold text-sm text-[#171717] dark:text-white">
                      {slot.title}
                    </span>
                  </div>
                </td>

                <td className="py-3 px-4 font-mono font-medium">
                  {slot.startTime} - {slot.endTime}
                </td>

                <td className="py-3 px-4 text-[#787774]">
                  {slot.dayOfWeek !== null && slot.dayOfWeek !== undefined ? (
                    <span className="font-medium text-[#37352f] dark:text-[#d4d4d4]">
                      {DAY_LABELS[slot.dayOfWeek]}
                    </span>
                  ) : slot.specificDate ? (
                    <span>Ngày {new Date(slot.specificDate).toLocaleDateString("vi-VN")}</span>
                  ) : (
                    <span>Hằng ngày</span>
                  )}
                </td>

                <td className="py-3 px-4 text-center">
                  {slot.isLocked ? (
                    <Badge variant="yellow">Khóa tuyệt đối (100%)</Badge>
                  ) : (
                    <Badge variant="secondary">Cảnh báo</Badge>
                  )}
                </td>

                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => {
                        setEditingSlot(slot);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 rounded-md hover:bg-[#f1f1ef] dark:hover:bg-[#2c2c2c] text-[#787774] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(slot.id, slot.title)}
                      className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[#787774] hover:text-rose-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {slots.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-sm text-[#9b9a97]">
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
