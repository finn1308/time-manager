"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock, History, CheckCircle2, Star, Calendar, BookOpen } from "lucide-react";

export default function StudySessionsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = async () => {
    try {
      const res = await fetch("/api/study-sessions");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Error loading study sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h} giờ ${m} phút`;
    }
    return `${mins} phút ${secs > 0 ? `${secs}s` : ""}`;
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2.5">
          <History className="w-6 h-6 text-[#2d6a4f] dark:text-[#52b788]" />
          <span>Nhật ký học tập thực tế (Study Sessions)</span>
        </h1>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
          Dữ liệu thời gian học thực tế được ghi nhận chính xác từng giây qua Picture-in-Picture Timer.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-[#526b5c] animate-pulse">
          Đang tải lịch sử phiên học...
        </div>
      ) : sessions.length === 0 ? (
        <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#eef5f0] dark:bg-[#1d3024] text-[#2d6a4f] dark:text-[#52b788] flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Chưa có phiên học nào
          </h3>
          <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto mt-2 leading-relaxed">
            Chọn một môn học và nhấn nút Play ở thanh bên hoặc mở Timer để bắt đầu bấm giờ. Thời gian thực tế sẽ được lưu trữ tự động.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className="rounded-[20px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 soft-card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-3.5">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                  style={{ backgroundColor: s.subject?.color || "#2d6a4f" }}
                >
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
                      {s.subject?.name || "Phiên học tự do"}
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1d3827] dark:text-[#9cd1b1]">
                      {s.status === "COMPLETED" ? "Đã hoàn thành" : s.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-[11px] text-[#526b5c] dark:text-[#a3bda9] mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(s.actualStart).toLocaleString("vi-VN")}</span>
                    </span>
                    {s.notes && <span className="truncate max-w-xs">"{s.notes}"</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <div className="text-sm font-black text-[#192e22] dark:text-[#f0f7f2]">
                    {formatSeconds(s.actualDurationSeconds)}
                  </div>
                  <div className="text-[10px] text-[#73927d]">
                    Thời gian thực tế (Actual)
                  </div>
                </div>

                {s.productivityScore && (
                  <div className="flex items-center text-amber-500 text-xs font-bold pl-2 border-l border-[#dbe7dd]">
                    <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                    <span>{s.productivityScore}/5</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
