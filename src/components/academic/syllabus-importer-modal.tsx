"use client";

import React, { useState } from "react";
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  Check,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SyllabusImporterModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  semesterId?: string | null;
}

export function SyllabusImporterModal({
  open,
  onClose,
  onSuccess,
  semesterId,
}: SyllabusImporterModalProps) {
  const [step, setStep] = useState<"INPUT" | "PREVIEW">("INPUT");
  const [syllabusText, setSyllabusText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [importId, setImportId] = useState<string | null>(null);

  // User selections
  const [createSubject, setCreateSubject] = useState(true);
  const [createAssignments, setCreateAssignments] = useState(true);
  const [createExams, setCreateExams] = useState(true);
  const [createKnowledgeNodes, setCreateKnowledgeNodes] = useState(true);
  const [applying, setApplying] = useState(false);

  const handleParse = async () => {
    if (!syllabusText.trim()) return;

    try {
      setParsing(true);
      const res = await fetch("/api/ai/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: syllabusText, semesterId }),
      });

      const json = await res.json();
      if (json.success) {
        setParsedData(json.parsedData);
        setImportId(json.importId);
        setStep("PREVIEW");
      } else {
        alert(json.error || "Không thể phân tích đề cương");
      }
    } catch (err) {
      console.error("Error parsing syllabus:", err);
      alert("Đã xảy ra lỗi khi phân tích đề cương");
    } finally {
      setParsing(false);
    }
  };

  const handleApply = async () => {
    if (!importId) return;

    try {
      setApplying(true);
      const res = await fetch("/api/ai/syllabus/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          importId,
          semesterId,
          createSubject,
          createAssignments,
          createExams,
          createKnowledgeNodes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        alert(json.message);
        onClose();
        if (onSuccess) onSuccess();
      } else {
        alert(json.error || "Lỗi lưu dữ liệu");
      }
    } catch (err) {
      console.error("Error applying syllabus:", err);
      alert("Đã xảy ra lỗi khi áp dụng đề cương");
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Syllabus Importer - Bóc tách Đề cương môn học bằng AI
              </h2>
              <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                Tự động nhận diện môn học, số tín chỉ, chuyên đề tuần, bài tập và kỳ thi
              </p>
            </div>
          </div>

          {step === "INPUT" ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                  Dán nội dung đề cương môn học (Syllabus) vào đây:
                </label>
                <textarea
                  rows={9}
                  value={syllabusText}
                  onChange={(e) => setSyllabusText(e.target.value)}
                  placeholder={`Ví dụ:
Môn học: Cấu trúc Dữ liệu và Giải thuật
Mã học phần: IT301
Số tín chỉ: 3
Giảng viên: TS. Nguyễn Văn A
Tuần 1: Giới thiệu độ phức tạp thuật toán O(n)
Tuần 2: Mảng và Danh sách liên kết
Tuần 5: Bài tập thực hành số 1
Tuần 8: Thi giữa kỳ (30%)
Tuần 10: Bài tập lớn cài đặt cây nhị phân (20%)
Tuần 15: Thi cuối kỳ (40%)`}
                  className="w-full text-xs p-3 rounded-2xl border border-emerald-100 dark:border-[#263d2e] bg-gray-50/50 dark:bg-[#1a2f22] text-[#192e22] dark:text-[#f0f7f2] focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={onClose} className="rounded-xl">
                  Đóng
                </Button>
                <Button
                  disabled={parsing || !syllabusText.trim()}
                  onClick={handleParse}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                >
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  {parsing ? "Đang phân tích..." : "Phân tích bằng AI"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              {/* Preview parsed structure */}
              <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-[#263d2e] space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                    {parsedData?.courseName} ({parsedData?.courseCode})
                  </h3>
                  <Badge className="bg-emerald-600 text-white text-xs">
                    {parsedData?.credits} tín chỉ
                  </Badge>
                </div>
                {parsedData?.lecturer && (
                  <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                    Giảng viên: <span className="font-semibold">{parsedData.lecturer}</span>
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-[#526b5c] dark:text-[#a3bda9] pt-1">
                  <span>Chuyên đề: {parsedData?.weeklyTopics?.length || 0} bài</span>
                  <span>Bài tập: {parsedData?.assignments?.length || 0}</span>
                  <span>Kỳ thi: {parsedData?.exams?.length || 0}</span>
                </div>
              </div>

              {/* Confirmation Checkboxes */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#192e22] dark:text-[#f0f7f2] block">
                  Chọn các mục bạn muốn tự động tạo:
                </span>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-emerald-50/40">
                  <input
                    type="checkbox"
                    checked={createSubject}
                    onChange={(e) => setCreateSubject(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Tạo Môn học mới trong danh mục</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-emerald-50/40">
                  <input
                    type="checkbox"
                    checked={createAssignments}
                    onChange={(e) => setCreateAssignments(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Tạo các bài tập & đồ án học kỳ (kèm phân rã nhiệm vụ)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-emerald-50/40">
                  <input
                    type="checkbox"
                    checked={createExams}
                    onChange={(e) => setCreateExams(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Tạo kế hoạch thi giữa kỳ & cuối kỳ trong Exam Mode & Calendar</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-xl hover:bg-emerald-50/40">
                  <input
                    type="checkbox"
                    checked={createKnowledgeNodes}
                    onChange={(e) => setCreateKnowledgeNodes(e.target.checked)}
                    className="accent-emerald-600 rounded"
                  />
                  <span>Tạo các nút kiến thức chuyên đề (Knowledge Nodes)</span>
                </label>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-emerald-100 dark:border-[#263d2e]">
                <Button variant="ghost" onClick={() => setStep("INPUT")} className="rounded-xl text-xs">
                  Nhập lại
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={onClose} className="rounded-xl">
                    Hủy
                  </Button>
                  <Button
                    disabled={applying}
                    onClick={handleApply}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    {applying ? "Đang lưu..." : "Xác nhận nhập đề cương"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
