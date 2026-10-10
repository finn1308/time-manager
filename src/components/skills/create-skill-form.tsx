"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Target, ArrowLeft, Loader2, Sparkles, Clock, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CreateSkillForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "TECH",
    currentLevel: "BEGINNER",
    targetLevel: "",
    specificGoal: "",
    weeklyHours: 5,
    deadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          level: formData.currentLevel,
          targetLevel: formData.targetLevel,
          specificGoal: formData.specificGoal,
          weeklyHoursCommitment: Number(formData.weeklyHours),
          deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        }),
      });

      if (res.ok) {
        const skill = await res.json();
        toast.success("Đã tạo kỹ năng thành công!");
        router.push(`/skills/${skill.id}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Có lỗi xảy ra khi tạo kỹ năng.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi hệ thống.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 text-[var(--text-subtle)]">
        <Link href="/skills" className="hover:text-[var(--mint-dark)] dark:hover:text-[#9cd1b1] transition-colors p-1.5 rounded-full hover:bg-[var(--mint-soft)]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="font-medium text-sm">Quay lại</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--mint-dark)] dark:text-[#9cd1b1] flex items-center space-x-2">
          <Sparkles className="w-7 h-7 text-[#52b788]" />
          <span>Thiết lập kỹ năng mới</span>
        </h1>
        <p className="text-[var(--text-subtle)] mt-1 text-sm">
          Cung cấp thông tin để AI thiết kế lộ trình Ultra Learning phù hợp nhất với bạn.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-[var(--bg-surface)] p-6 rounded-[28px] border border-[var(--border)] shadow-2xs">
        
        {/* Name & Category */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1]">
              Kỹ năng muốn học <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="VD: IELTS, Lập trình Web, Đánh đàn Piano..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[var(--bg-muted)] border-[var(--border)]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1]">
              Danh mục
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-ink)] focus:outline-none focus:ring-2 focus:ring-[#52b788]"
            >
              <option value="LANGUAGE">Ngoại ngữ</option>
              <option value="TECH">Công nghệ / Lập trình</option>
              <option value="SOFT">Kỹ năng mềm</option>
              <option value="DESIGN">Thiết kế / Sáng tạo</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
        </div>

        {/* Levels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1]">
              Trình độ hiện tại <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.currentLevel}
              onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
              className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-ink)] focus:outline-none focus:ring-2 focus:ring-[#52b788]"
            >
              <option value="BEGINNER">Người mới bắt đầu (Beginner)</option>
              <option value="INTERMEDIATE">Trung bình (Intermediate)</option>
              <option value="ADVANCED">Khá giỏi (Advanced)</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1]">
              Mục tiêu đầu ra <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="VD: IELTS 7.0, Tự làm được web bán hàng..."
              value={formData.targetLevel}
              onChange={(e) => setFormData({ ...formData, targetLevel: e.target.value })}
              className="bg-[var(--bg-muted)] border-[var(--border)]"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-[var(--mint-dark)] dark:text-[#9cd1b1]">
            Mô tả chi tiết mục tiêu (Tùy chọn)
          </label>
          <textarea
            placeholder="Bạn cần kỹ năng này để làm gì? Bạn có yêu cầu đặc biệt nào không?"
            value={formData.specificGoal}
            onChange={(e) => setFormData({ ...formData, specificGoal: e.target.value })}
            className="flex min-h-[80px] w-full rounded-md border border-[var(--border)] bg-[var(--bg-muted)] px-3 py-2 text-sm text-[var(--text-ink)] focus:outline-none focus:ring-2 focus:ring-[#52b788] resize-y"
          />
        </div>

        {/* Time Allocation */}
        <div className="bg-[#f0f7f2] dark:bg-[#1a2e22] p-4 rounded-2xl border border-[#d8ebe0] dark:border-[#263d2e]">
          <h3 className="text-sm font-bold text-[var(--mint-dark)] mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            Thời gian cam kết (Time Allocation)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-subtle)]">
                Số giờ học dự kiến mỗi tuần <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min={1}
                max={168}
                required
                value={formData.weeklyHours}
                onChange={(e) => setFormData({ ...formData, weeklyHours: Number(e.target.value) })}
                className="bg-[var(--bg-surface)] border-[var(--border)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--text-subtle)]">
                Mục tiêu hoàn thành (Tùy chọn)
              </label>
              <div className="relative">
                <Input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="bg-[var(--bg-surface)] border-[var(--border)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center space-x-2 bg-[var(--mint)] hover:bg-[var(--mint-dark)] disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-md transition-all hover:-translate-y-0.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tạo kỹ năng...</span>
              </>
            ) : (
              <>
                <Target className="w-4 h-4" />
                <span>Tạo kỹ năng & Bắt đầu</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
