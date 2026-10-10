"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/card";
import { BarChart3 } from "lucide-react";

interface ChartDataPoint {
  day: string;
  planned: number;
  actual: number;
}

interface PlannedVsActualChartProps {
  data: ChartDataPoint[];
}

export function PlannedVsActualChart({ data = [] }: PlannedVsActualChartProps) {
  const hasData = data.some((d) => d.planned > 0 || d.actual > 0);

  return (
    <Card className="rounded-[28px] border border-[var(--border)] bg-[var(--bg-surface)]">
      <CardHeader>
        <CardTitle className="text-base flex items-center space-x-2 text-[var(--text-ink)]">
          <BarChart3 className="w-4 h-4 text-[var(--mint-dark)]" />
          <span>Biểu đồ Planned vs Actual (Kế hoạch & Thực tế)</span>
        </CardTitle>
        <CardDescription className="text-[var(--text-subtle)]">
          So sánh trực quan giữa thời gian dự định trong lịch (xanh sage) và thời gian học thực tế đo bằng Timer (xanh botanical).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        {!hasData ? (
          <div className="h-64 flex flex-col items-center justify-center rounded-2xl bg-[var(--bg-muted)] border border-dashed border-[var(--border)] text-center p-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--mint-bg)] text-[var(--mint-dark)] flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-[var(--text-ink)]">
              Chưa có dữ liệu thống kê
            </p>
            <p className="text-[11px] text-[var(--text-subtle)] mt-1 max-w-sm">
              Lập lịch học trên Calendar và kích hoạt Timer để theo dõi tương quan Planned vs Actual theo thời gian thực.
            </p>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                barGap={6}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dbe7dd" opacity={0.6} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#526b5c", fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "#526b5c" }}
                  unit="h"
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-[18px] border border-[var(--border)] bg-white/95 dark:bg-[#17261c]/95 p-3.5 shadow-xl text-xs backdrop-blur-xs">
                          <p className="font-bold text-[var(--text-ink)] mb-2">{label}</p>
                          <div className="flex items-center space-x-2 text-[var(--text-subtle)] font-medium">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#74a882] shadow-2xs" />
                            <span>Kế hoạch: {payload[0]?.value} giờ</span>
                          </div>
                          <div className="flex items-center space-x-2 text-[var(--mint-dark)] font-bold mt-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[var(--mint)] shadow-2xs" />
                            <span>Thực tế: {payload[1]?.value} giờ</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "12px", fontWeight: 600 }}
                  formatter={(value) => (value === "planned" ? "Kế hoạch (Planned)" : "Thực tế (Actual)")}
                />
                <Bar dataKey="planned" fill="#74a882" radius={[8, 8, 0, 0]} maxBarSize={32} />
                <Bar dataKey="actual" fill="#2d6a4f" radius={[8, 8, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
