"use client";

import React, { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface EventCompleteCheckboxProps {
  eventId: string;
  isCompleted: boolean;
  actualDurationMinutes?: number | null;
  plannedDurationMinutes?: number | null;
  subjectName?: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  onToggled?: (newCompleted: boolean, actualMinutes: number) => void;
  className?: string;
}

export function EventCompleteCheckbox({
  eventId,
  isCompleted,
  actualDurationMinutes,
  plannedDurationMinutes,
  subjectName,
  size = "md",
  showLabel = false,
  onToggled,
  className = "",
}: EventCompleteCheckboxProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState<boolean>(isCompleted);
  const [loading, setLoading] = useState<boolean>(false);

  // Sync with prop if changed from outside
  React.useEffect(() => {
    setCompleted(isCompleted);
  }, [isCompleted]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading) return;

    const nextCompleted = !completed;
    setLoading(true);
    // Optimistic UI
    setCompleted(nextCompleted);

    try {
      const res = await fetch("/api/calendar/events/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          completed: nextCompleted,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể cập nhật trạng thái");
      }

      setCompleted(data.completed);
      if (onToggled) {
        onToggled(data.completed, data.actualMinutes || 0);
      }

      // Notify other views across the app
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("chronomind-study-updated", {
            detail: {
              eventId,
              completed: data.completed,
              actualMinutes: data.actualMinutes,
            },
          })
        );
      }

      router.refresh();
    } catch (err: any) {
      console.error("Error toggling completion:", err);
      // Revert optimistic update
      setCompleted(completed);
      alert(err.message || "Lỗi khi cập nhật trạng thái học");
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4 rounded-md text-[10px]",
    md: "w-5 h-5 rounded-lg text-xs",
    lg: "w-6 h-6 rounded-xl text-sm",
  };

  return (
    <div
      onClick={handleToggle}
      role="checkbox"
      aria-checked={completed}
      title={completed ? "Đã học xong (Click để bỏ tick)" : "Đánh dấu đã học"}
      className={`inline-flex items-center gap-1.5 cursor-pointer select-none group touch-manipulation min-h-[28px] ${className}`}
    >
      <div
        className={`${sizeClasses[size]} shrink-0 flex items-center justify-center border transition-all duration-200 ${
          completed
            ? "bg-[#2d6a4f] dark:bg-[#52b788] border-[#2d6a4f] dark:border-[#52b788] text-white shadow-xs"
            : "bg-white dark:bg-[#1a2e21] border-[#b7d8c3] dark:border-[#2f523c] group-hover:border-[#2d6a4f] group-hover:bg-[#eef5f0] dark:group-hover:bg-[#233d2c]"
        }`}
      >
        {loading ? (
          <Loader2 className="w-3 h-3 animate-spin text-current" />
        ) : completed ? (
          <Check className="w-3 h-3 stroke-[3]" />
        ) : null}
      </div>

      {showLabel && (
        <span
          className={`text-xs font-semibold transition-colors ${
            completed
              ? "text-[#2d6a4f] dark:text-[#52b788] line-through opacity-85"
              : "text-[#526b5c] dark:text-[#a3bda9] group-hover:text-[#192e22] dark:group-hover:text-[#f0f7f2]"
          }`}
        >
          {completed ? "Đã học" : "Chưa học"}
        </span>
      )}
    </div>
  );
}
