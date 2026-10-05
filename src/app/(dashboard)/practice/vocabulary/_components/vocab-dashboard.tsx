"use client";

import { Zap, BookOpen, Clock, Target, CalendarDays, Plus, Award, Users, PlaySquare } from "lucide-react";
import Link from "next/link";

interface VocabDashboardProps {
  progress: number;
  learnedCount: number;
  totalWords: number;
  dueToday: number;
  streakDays: number;
  studyMinutes: number;
}

export function VocabDashboard({
  progress,
  learnedCount,
  totalWords,
  dueToday,
  streakDays,
  studyMinutes,
}: VocabDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Overview Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          icon={<Target className="w-5 h-5 text-emerald-500" />} 
          title="Tiến độ" 
          value={`${progress}%`}
          subtitle={`Trong tổng số ${totalWords} từ`}
        />
        <StatCard 
          icon={<BookOpen className="w-5 h-5 text-blue-500" />} 
          title="Đã thuộc" 
          value={learnedCount.toString()}
          subtitle="Từ vựng Mastered"
        />
        <StatCard 
          icon={<Zap className="w-5 h-5 text-orange-500" />} 
          title="Hôm nay" 
          value={dueToday.toString()}
          subtitle="Từ cần ôn tập"
          highlight={dueToday > 0}
        />
        <StatCard 
          icon={<Clock className="w-5 h-5 text-purple-500" />} 
          title="Thời gian học" 
          value={`${studyMinutes}m`}
          subtitle={`${streakDays} ngày liên tiếp`}
        />
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Truy cập nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickAction 
            href="/practice/vocabulary/new"
            icon={<Plus className="w-5 h-5 text-blue-500" />}
            title="Thêm từ"
            subtitle="Tạo từ vựng cá nhân"
            color="bg-blue-50 border-blue-100 hover:border-blue-200"
          />
          <QuickAction 
            href="/practice/vocabulary/practice"
            icon={<PlaySquare className="w-5 h-5 text-emerald-500" />}
            title="Luyện tập"
            subtitle="Flashcard & Ôn tập"
            color="bg-emerald-50 border-emerald-100 hover:border-emerald-200"
          />
          <QuickAction 
            href="#"
            icon={<Award className="w-5 h-5 text-orange-500" />}
            title="Xếp hạng"
            subtitle="Sắp ra mắt"
            color="bg-orange-50 border-orange-100 hover:border-orange-200"
            disabled
          />
          <QuickAction 
            href="#"
            icon={<Users className="w-5 h-5 text-purple-500" />}
            title="Cộng đồng"
            subtitle="Sắp ra mắt"
            color="bg-purple-50 border-purple-100 hover:border-purple-200"
            disabled
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, subtitle, highlight = false }: any) {
  return (
    <div 
      className={`p-5 rounded-2xl border bg-white shadow-sm flex flex-col justify-between transition-all ${highlight ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200/60'}`}
    >
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-sm font-medium text-gray-600">{title}</span>
      </div>
      <div>
        <div className="text-3xl font-semibold text-gray-900 tracking-tight">{value}</div>
        <div className="text-xs text-gray-500 mt-1 font-medium">{subtitle}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, title, subtitle, color, disabled = false }: any) {
  const content = (
    <div className={`p-4 rounded-2xl border transition-all duration-200 flex items-center gap-4 ${color} ${disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'hover:shadow-md cursor-pointer'}`}>
      <div className="p-3 bg-white rounded-xl shadow-sm border border-black/5">
        {icon}
      </div>
      <div>
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-xs font-medium text-gray-500">{subtitle}</div>
      </div>
    </div>
  );

  if (disabled) return content;
  return <Link href={href}>{content}</Link>;
}
