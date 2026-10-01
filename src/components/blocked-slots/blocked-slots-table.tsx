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
    if (!confirm(`Bạn có chắc muốn xóa khung giờ "${title}"?`)) return;
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
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] font-medium">
          Có {slots.length} khung giờ được thiết lập. AI và Scheduler sẽ coi đây là vùng bất khả xâm phạm.
        </p>

        <Button
          size="sm"
          onClick={() => {
            setEditingSlot(null);
            setIsModalOpen(true);
          }}
          className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl space-x-1.5 text-xs font-semibold shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm khung giờ mới</span>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] soft-card-shadow">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#dbe7dd]/80 dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-5">Mục đích / Tiêu đề</th>
              <th className="py-3.5 px-4">Khung giờ</th>
              <th className="py-3.5 px-4">Ngày lặp lại</th>
              <th className="py-3.5 px-4 text-center">Trạng thái khóa</th>
              <th className="py-3.5 px-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dbe7dd]/60 dark:divide-[#263d2e]">
            {slots.map((slot) => (
              <tr key={slot.id} className="hover:bg-[#f8fbf8] dark:hover:bg-[#142318] transition-colors">
                <td className="py-4 px-5">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#edf0dc] dark:bg-[#2b301c] text-[#595e2b] dark:text-[#d3d89e] flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                      {slot.title}
                    </span>
                  </div>
                </td>

                <td className="py-4 px-4 font-mono font-bold text-[#192e22] dark:text-[#f0f7f2]">
                  {slot.startTime} - {slot.endTime}
                </td>

                <td className="py-4 px-4 text-[#526b5c] dark:text-[#a3bda9] font-medium">
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
                  <Badge variant="yellow" className="font-bold">
                    Khóa tuyệt đối (100%)
                  </Badge>
                </td>

                <td className="py-4 px-5 text-right">
                  <div className="flex items-center justify-end space-x-1.5">
                    <button
                      onClick={() => handleDelete(slot.id, slot.title)}
                      className="p-2 rounded-full hover:bg-[#f7ebeb] text-[#73927d] hover:text-[#b87474] transition-colors cursor-pointer"
                      title="Xóa khung giờ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {slots.length === 0 && (
              <tr>
                <td colSpan={5} className="py-14 text-center text-sm text-[#526b5c] dark:text-[#a3bda9]">
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
