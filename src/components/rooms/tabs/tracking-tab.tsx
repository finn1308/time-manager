"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  Users,
  FolderKanban,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";

interface TrackingData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRate: number;
  };
  columnBreakdown: Array<{
    id: string;
    name: string;
    key: string;
    color: string | null;
    count: number;
    percentage: number;
  }>;
  memberWorkload: Array<{
    membershipId: string;
    userId: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
  }>;
  groupProgress: Array<{
    id: string;
    name: string;
    color: string | null;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
  }>;
}

interface TrackingTabProps {
  roomId: string;
  groups: Array<{ id: string; name: string }>;
}

export function TrackingTab({ roomId, groups }: TrackingTabProps) {
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");

  const fetchTracking = async () => {
    setLoading(true);
    try {
      let url = `/api/rooms/${roomId}/tracking`;
      if (selectedGroupId) url += `?groupId=${selectedGroupId}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Không thể tải số liệu");
      setData(json);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải tracking");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [roomId, selectedGroupId]);

  if (loading || !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs">Đang tổng hợp số liệu tiến độ từ cơ sở dữ liệu thực...</p>
      </div>
    );
  }

  const { summary, columnBreakdown, memberWorkload, groupProgress } = data;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">Bảng theo dõi tiến độ công việc</h3>
          <p className="text-xs text-muted-foreground">
            Dữ liệu tổng hợp trực tiếp từ trạng thái các thẻ, phân công thành viên và nhóm.
          </p>
        </div>

        {groups.length > 0 && (
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-border bg-background text-foreground"
          >
            <option value="">(Toàn bộ phòng họp)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                Nhóm: {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 4 Primary KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Tổng nhiệm vụ</span>
            <FolderKanban className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{summary.totalTasks}</div>
          <p className="text-[11px] text-muted-foreground">Thẻ công việc trên bảng</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.completedTasks}
            </span>
            <span className="text-xs font-bold text-emerald-600/80">({summary.completionRate}%)</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all"
              style={{ width: `${summary.completionRate}%` }}
            />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Đang làm</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
            {summary.inProgressTasks}
          </div>
          <p className="text-[11px] text-muted-foreground">Đang trong quá trình xử lý</p>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Quá hạn</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {summary.overdueTasks}
          </div>
          <p className="text-[11px] text-muted-foreground">Cần đẩy nhanh tiến độ</p>
        </div>
      </div>

      {/* Column Distribution Breakdown */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            Phân bố thẻ theo cột tiến độ
          </h4>
        </div>

        <div className="space-y-3">
          {columnBreakdown.map((col) => (
            <div key={col.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-foreground">{col.name}</span>
                <span className="text-muted-foreground font-mono">
                  {col.count} thẻ ({col.percentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${col.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Member Workload */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          Khối lượng công việc theo thành viên ({memberWorkload.length})
        </h4>

        {memberWorkload.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Chưa có thành viên nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="pb-2.5 font-semibold">Thành viên</th>
                  <th className="pb-2.5 font-semibold text-center">Vai trò</th>
                  <th className="pb-2.5 font-semibold text-center">Được giao</th>
                  <th className="pb-2.5 font-semibold text-center">Đã hoàn thành</th>
                  <th className="pb-2.5 font-semibold text-center">Quá hạn</th>
                  <th className="pb-2.5 font-semibold text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {memberWorkload.map((m) => (
                  <tr key={m.membershipId} className="hover:bg-muted/30">
                    <td className="py-2.5 font-medium text-foreground flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p>{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.email}</p>
                      </div>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase bg-muted text-muted-foreground">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-2.5 text-center font-bold">{m.totalTasks}</td>
                    <td className="py-2.5 text-center text-emerald-600 dark:text-emerald-400 font-bold">
                      {m.completedTasks}
                    </td>
                    <td className="py-2.5 text-center text-rose-500 font-bold">{m.overdueTasks}</td>
                    <td className="py-2.5 text-right font-mono font-bold text-primary">
                      {m.completionRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
