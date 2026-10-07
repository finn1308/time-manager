"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Download,
  Upload,
  Database,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
export default function BackupCenterPage() {
  const [restoring, setRestoring] = useState(false);
  const [restoreResult, setRestoreResult] = useState<any>(null);

  const handleDownloadFullBackup = () => {
    window.open("/api/backup/export?format=json", "_blank");
  };

  const handleDownloadTasksCSV = () => {
    window.open("/api/backup/export?format=csv&module=TASKS", "_blank");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setRestoring(true);
      const text = await file.text();
      const json = JSON.parse(text);

      const res = await fetch("/api/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });

      const resData = await res.json();
      if (resData.success) {
        setRestoreResult(resData.restoredSummary);
      } else {
        toast.error(resData.error || "Không thể khôi phục dữ liệu");
      }
    } catch (err) {
      console.error("Error restoring file:", err);
      toast("Tệp sao lưu không hợp lệ");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="rounded-xl text-[#526b5c]">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="p-3 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
          <Database className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[#192e22] dark:text-[#f0f7f2]">
            Trung tâm Sao lưu & Quyền sở hữu Dữ liệu (Backup Center)
          </h1>
          <p className="text-sm text-[#526b5c] dark:text-[#a3bda9]">
            Toàn quyền xuất, nhập và lưu trữ ngoại tuyến toàn bộ dữ liệu học tập 4 năm đại học của bạn
          </p>
        </div>
      </div>

      {/* Export Section */}
      <Card className="p-6 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] space-y-4">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-base">
          <Download className="w-5 h-5" />
          Xuất dữ liệu học tập (Data Export)
        </div>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
          Dữ liệu bao gồm: Môn học, Đề cương, Ghi chú, Flashcards, Dữ liệu luyện tập, Lịch học, Nhiệm vụ, Ngân hàng lỗi sai, Kế hoạch ôn thi và Hồ sơ nhận thức AI.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <Button
            onClick={handleDownloadFullBackup}
            className="py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 shadow-sm"
          >
            <FileJson className="w-5 h-5" />
            Tải bản sao lưu toàn diện (.json)
          </Button>

          <Button
            onClick={handleDownloadTasksCSV}
            variant="outline"
            className="py-6 rounded-2xl border-emerald-200 text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-center gap-2"
          >
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Xuất danh sách Nhiệm vụ (.csv)
          </Button>
        </div>
      </Card>

      {/* Import / Restore Section */}
      <Card className="p-6 rounded-3xl bg-white dark:bg-[#17261c] border-emerald-100 dark:border-[#263d2e] space-y-4">
        <div className="flex items-center gap-2 text-[#192e22] dark:text-[#f0f7f2] font-bold text-base">
          <Upload className="w-5 h-5 text-purple-600" />
          Khôi phục từ tệp sao lưu (Restore Backup)
        </div>
        <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
          Chọn tệp JSON đã tải về trước đó để đồng bộ hóa hoặc khôi phục lại tài khoản. Hệ thống tự động kiểm tra và bảo đảm an toàn dữ liệu.
        </p>

        <div className="pt-2">
          <label className="border-2 border-dashed border-emerald-200 dark:border-[#263d2e] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-50/30 transition-all">
            <Upload className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="text-sm font-bold text-[#192e22] dark:text-[#f0f7f2]">
              {restoring ? "Đang giải nén và khôi phục dữ liệu..." : "Bấm vào đây để chọn tệp .json sao lưu"}
            </span>
            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-1">
              Hỗ trợ định dạng JSON sao lưu chuẩn ChronoMind
            </span>
            <input
              type="file"
              accept=".json"
              disabled={restoring}
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {restoreResult && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-200 space-y-1 animate-in fade-in">
            <span className="font-bold block">Khôi phục thành công!</span>
            <p>Môn học: {restoreResult.subjectsCount} • Ghi chú: {restoreResult.notesCount} • Nhiệm vụ: {restoreResult.tasksCount} • Lỗi sai: {restoreResult.mistakesCount}</p>
          </div>
        )}
      </Card>
    </div>
  );
}
