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
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>So sánh Kế hoạch vs Thực tế (Planned vs Actual)</CardTitle>
        <CardDescription>
          Biểu đồ cột thể hiện tương quan số giờ học theo kế hoạch (xanh dương nhạt) và số giờ học thực tế qua Timer (xanh lá).
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              barGap={4}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9e9e7" opacity={0.5} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#787774" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#787774" }}
                unit="h"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-[#e9e9e7] dark:border-[#2e2e2e] bg-white dark:bg-[#1f1f1f] p-2.5 shadow-md text-xs">
                        <p className="font-semibold text-[#171717] dark:text-white mb-1.5">{label}</p>
                        <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span>Kế hoạch: {payload[0]?.value} giờ</span>
                        </div>
                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 mt-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Thực tế: {payload[1]?.value} giờ</span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }}
                formatter={(value) => (value === "planned" ? "Kế hoạch (Planned)" : "Thực tế (Actual)")}
              />
              <Bar dataKey="planned" fill="#93c5fd" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="actual" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
