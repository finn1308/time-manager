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

interface ChartDataPoint {
  day: string;
  planned: number;
  actual: number;
}

interface PlannedVsActualChartProps {
  data: ChartDataPoint[];
}

export function PlannedVsActualChart({ data }: PlannedVsActualChartProps) {
  return (
    <Card className="rounded-[28px]">
      <CardHeader>
        <CardTitle className="text-base">So sánh Kế hoạch vs Thực tế (Planned vs Actual)</CardTitle>
        <CardDescription>
          Biểu đồ cột thể hiện tương quan số giờ học theo kế hoạch (xanh dương) và số giờ học thực tế qua Timer (xanh ngọc).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={6}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.6} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b", fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#64748b" }}
                unit="h"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 p-3.5 shadow-xl text-xs backdrop-blur-xs">
                        <p className="font-bold text-slate-900 dark:text-white mb-2">{label}</p>
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs" />
                          <span>Kế hoạch: {payload[0]?.value} giờ</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
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
              <Bar dataKey="planned" fill="#60a5fa" radius={[8, 8, 0, 0]} maxBarSize={32} />
              <Bar dataKey="actual" fill="#10b981" radius={[8, 8, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
