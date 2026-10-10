"use client";

import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  ArrowRight,
  Loader2,
  AlertCircle,
  ChevronLeft,
  BookOpen,
  Layers,
  ShieldCheck,
  EyeOff,
  RotateCcw,
  Zap,
} from "lucide-react";
import { StudyBunnyMascot } from "./study-bunny-mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentAnalysisReport, ChapterMap } from "@/lib/ai/document-analyzer";

interface SubjectOption {
  id: string;
  name: string;
  code: string | null;
  color: string;
}

interface CreateQuestWizardProps {
  subjects: SubjectOption[];
  onQuestCreated: (roadmapId: string) => void;
  onCancel?: () => void;
}

const DURATION_PRESETS = [
  { days: 7, label: "7 Ngày", note: "~3 câu/ngày • Cường độ cao", workload: "Cường độ cao" },
  { days: 14, label: "14 Ngày", note: "~3 câu/ngày • Hiệu quả tối ưu", workload: "Khuyên dùng" },
  { days: 21, label: "21 Ngày", note: "~3 câu/ngày • Cân bằng chuyên sâu", workload: "Chuyên sâu" },
  { days: 30, label: "30 Ngày", note: "~3 câu/ngày • Bền bỉ dài hạn", workload: "Bền bỉ" },
];

const TARGET_GRADES = [
  { id: "PASS", label: "PASS", desc: "Đạt chuẩn qua môn" },
  { id: "C", label: "C", desc: "Nắm vững lý thuyết cơ bản" },
  { id: "C+", label: "C+", desc: "Hiểu bản chất và khái niệm" },
  { id: "B", label: "B", desc: "Vận dụng tốt bài tập" },
  { id: "B+", label: "B+", desc: "Phân tích và liên hệ thực tế" },
  { id: "A", label: "A", desc: "Xuất sắc, tư duy toàn diện" },
  { id: "A+", label: "A+", desc: "Tuyệt đối, chuyên gia môn học" },
];

const PASSION_LEARNING_GOALS = [
  { id: "Hiểu & Ứng dụng", label: "🌱 Hiểu & Ứng dụng", desc: "Nắm bản chất lý thuyết và vận dụng vào thực tiễn" },
  { id: "Khám phá Chuyên sâu", label: "🌿 Khám phá Chuyên sâu", desc: "Nghiền ngẫm kiến thức sâu sắc theo nhịp độ tự nhiên" },
  { id: "Tinh thông Thực hành", label: "🏆 Tinh thông Toàn diện", desc: "Làm chủ trọn vẹn toàn bộ các chủ đề trong tài liệu" },
];

export function CreateQuestWizard({
  subjects = [],
  onQuestCreated,
  onCancel,
}: CreateQuestWizardProps) {
  // Wizard steps:
  // 1: Upload Material
  // 2: DOCUMENT ANALYSIS (Step 19)
  // 3: Choose Duration & Target Grade
  // 4: REVIEW LEARNING ROADMAP (Step 19 & 20)
  // 5: Processing & Saving
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Material state
  const [importType, setImportType] = useState<"PDF" | "TEXT">("PDF");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);

  // Analysis result
  const [analysisReport, setAnalysisReport] = useState<DocumentAnalysisReport | null>(null);

  // Roadmap configs
  const [studyPurpose, setStudyPurpose] = useState<"PASSION" | "EXAM">("PASSION");
  const [targetDays, setTargetDays] = useState<number>(14);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("14");
  const [targetGrade, setTargetGrade] = useState("Hiểu & Ứng dụng");

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [processStage, setProcessStage] = useState<string>("UPLOADING");
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload & Perform Deep Document Analysis
  const handleUploadAndAnalyze = async () => {
    setError(null);
    setLoading(true);

    try {
      if (importType === "PDF") {
        if (!file) throw new Error("Vui lòng chọn file PDF để tải lên.");
        const formData = new FormData();
        formData.append("file", file);
        if (selectedSubjectId) formData.append("subjectId", selectedSubjectId);

        const res = await fetch("/api/learning/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể đọc nội dung file PDF");

        setUploadedDocId(data.documentId);
        if (data.analysisReport) {
          setAnalysisReport(data.analysisReport);
        }
      } else {
        if (!textInput.trim() || textInput.length < 20) {
          throw new Error("Vui lòng nhập nội dung văn bản tối thiểu 20 ký tự.");
        }

        const res = await fetch("/api/learning/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: textInput,
            title: textTitle || "Ghi chú học tập",
            subjectId: selectedSubjectId || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Không thể lưu văn bản");

        setUploadedDocId(data.documentId);
        if (data.analysisReport) {
          setAnalysisReport(data.analysisReport);
        }
      }

      setStep(2); // Move to Document Analysis review (Step 19)
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Step 4 -> 5: Confirmed Generation & Saving to Database (Step 20)
  const handleConfirmAndSaveRoadmap = async () => {
    setError(null);
    setStep(5);
    setLoading(true);
    setProcessStage("GENERATING");

    try {
      const daysToSend = isCustomDays ? Math.max(1, parseInt(customDaysInput, 10) || 14) : targetDays;

      const res = await fetch("/api/learning/create-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: uploadedDocId,
          subjectId: selectedSubjectId || undefined,
          targetDays: daysToSend,
          targetGrade,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể khởi tạo lộ trình học tập");

      setProcessStage("READY");
      setTimeout(() => {
        onQuestCreated(data.roadmapId);
      }, 500);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo lộ trình");
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  const daysToSend = isCustomDays ? Math.max(1, parseInt(customDaysInput, 10) || 14) : targetDays;

  // Build Preview Stages for Review Step (Step 19)
  const previewStages = Array.from({ length: daysToSend }, (_, i) => {
    const dayNum = i + 1;
    const chapters = analysisReport?.chapters || [];
    const chIndex = (dayNum - 1) % (chapters.length || 1);
    const ch = chapters[chIndex];
    const isSynthesis = dayNum > daysToSend - 2 && daysToSend >= 7;

    return {
      dayNumber: dayNum,
      title: isSynthesis
        ? `Day ${dayNum < 10 ? "0" + dayNum : dayNum}: Tổng hợp & Vận dụng Tình huống Chuyên sâu`
        : `Day ${dayNum < 10 ? "0" + dayNum : dayNum}: ${ch?.title || `Chương ${chIndex + 1}`}`,
      chapterTitle: ch?.title || `Chương ${chIndex + 1}`,
      pageRange: ch ? `Trang ${ch.startPage} - ${ch.endPage}` : `Trang ${dayNum}`,
      concepts: ch?.coreConcepts.slice(0, 3) || [`Khái niệm trọng tâm Ngày ${dayNum}`],
      rules: ch?.rulesAndConditions.slice(0, 2) || [`Quy tắc vận dụng`],
      estimatedMinutes: 20,
      xpReward: 100 + dayNum * 5,
    };
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-3">
        {[
          { num: 1, title: "1. Nạp tài liệu" },
          { num: 2, title: "2. Phân tích tài liệu" },
          { num: 3, title: "3. Cấu hình mục tiêu" },
          { num: 4, title: "4. Xem trước lộ trình" },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step === s.num
                  ? "bg-[var(--mint)] text-white shadow-xs"
                  : step > s.num
                  ? "bg-[var(--mint-bg)] text-[var(--mint-dark)]"
                  : "bg-[#e5ede7] text-[var(--text-muted)]"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num
                  ? "text-[var(--text-ink)]"
                  : "text-[var(--text-muted)] dark:text-[#8aa693]"
              }`}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-[#f7ebeb] text-[#8a3c3c] border border-[#e8c6c6] text-xs flex items-center space-x-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#b87474]" />
          <span>{error}</span>
        </div>
      )}

      {/* ================= STEP 1: IMPORT MATERIAL ================= */}
      {step === 1 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <StudyBunnyMascot message="Chào bạn! Hãy nạp tài liệu học tập (PDF bài giảng, đề cương hoặc giáo trình) để AI phân tích cấu trúc toàn diện và loại bỏ hoàn toàn các thông tin hành chính không liên quan nhé!" />

          {/* Import Type Tabs */}
          <div className="flex rounded-2xl bg-[var(--mint-bg)] dark:bg-[#142318] p-1 border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setImportType("PDF")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                importType === "PDF"
                  ? "bg-white dark:bg-[#203627] text-[var(--mint-dark)] dark:text-[#d8ebe0] shadow-xs"
                  : "text-[var(--text-subtle)] dark:text-[#8aa693]"
              }`}
            >
              📄 Tải lên file PDF
            </button>
            <button
              type="button"
              onClick={() => setImportType("TEXT")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                importType === "TEXT"
                  ? "bg-white dark:bg-[#203627] text-[var(--mint-dark)] dark:text-[#d8ebe0] shadow-xs"
                  : "text-[var(--text-subtle)] dark:text-[#8aa693]"
              }`}
            >
              ✍️ Dán văn bản / Ghi chú
            </button>
          </div>

          {/* Subject Selector (Optional) */}
          {subjects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                Liên kết với Môn học hiện có (tùy chọn):
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-ink)]"
              >
                <option value="">-- Không liên kết môn (Tạo mới tự động) --</option>
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} {sub.code ? `(${sub.code})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* PDF Drag & Drop Area */}
          {importType === "PDF" ? (
            <div className="space-y-3">
              <label
                htmlFor="pdf-upload"
                className="border-2 border-dashed border-[#b7d8c3] dark:border-[var(--mint)] rounded-[26px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[var(--mint-bg)]/50 dark:hover:bg-[#1c3022]/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--mint-bg)] dark:bg-[#1e3827] flex items-center justify-center text-[var(--mint-dark)] mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="font-bold text-sm text-[var(--text-ink)]">
                  {file ? file.name : "Kéo & Thả file PDF bài học vào đây"}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để chọn file khác`
                    : "Hỗ trợ giáo trình, tài liệu học tập, slide bài giảng (tất cả các trang đều được đọc)"}
                </p>
                <input
                  id="pdf-upload"
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                  Tiêu đề tài liệu:
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Pháp luật và Sở hữu trí tuệ"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[var(--text-ink)] dark:text-[#d8ebe0] mb-1.5">
                  Nội dung bài học hoặc đề cương:
                </label>
                <textarea
                  rows={8}
                  placeholder="Dán nội dung giáo trình, chương mục hoặc các định nghĩa chuyên môn vào đây..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-2xl border border-[var(--border)] bg-[var(--bg-muted)] text-[var(--text-ink)] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="rounded-2xl">
                Hủy
              </Button>
            )}
            <Button
              type="button"
              disabled={loading || (importType === "PDF" ? !file : textInput.length < 20)}
              onClick={handleUploadAndAnalyze}
              className="ml-auto bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl px-6 space-x-2 font-bold cursor-pointer"
            >
              <span>{loading ? "Đang phân tích tài liệu..." : "Phân tích tài liệu toàn diện"}</span>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: DOCUMENT ANALYSIS REPORT (Step 19) ================= */}
      {step === 2 && analysisReport && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          {/* Header Card */}
          <div className="border-b border-[var(--border)] pb-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-[var(--mint-dark)] bg-[var(--mint-bg)] dark:bg-[#1e3b28] px-3 py-1 rounded-full">
              DOCUMENT ANALYSIS
            </span>
            <h2 className="text-xl font-black text-[var(--text-ink)] mt-2">
              {analysisReport.documentTitle}
            </h2>
            <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693] mt-1">
              Tổng số trang phân tích: <strong>{analysisReport.totalPages} trang</strong>
            </p>
          </div>

          {/* Stats Metrics (Step 19 Spec) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#eef7ee] dark:bg-[#1a3322] border border-[#b7d8c3] dark:border-[var(--mint)]">
              <span className="text-[11px] font-bold text-[var(--mint-dark)] dark:text-[#7fc498] block">Phát hiện cấu trúc</span>
              <span className="text-lg font-black text-[var(--text-ink)]">
                {analysisReport.detectedStats.chaptersCount} Chương
              </span>
              <span className="text-[10px] text-[var(--text-subtle)] dark:text-[#8aa693] block mt-0.5">
                {analysisReport.detectedStats.topicsCount} chuyên đề chi tiết
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#eef7ee] dark:bg-[#1a3322] border border-[#b7d8c3] dark:border-[var(--mint)]">
              <span className="text-[11px] font-bold text-[var(--mint-dark)] dark:text-[#7fc498] block">Kiến thức cốt lõi</span>
              <span className="text-lg font-black text-[var(--text-ink)]">
                {analysisReport.detectedStats.conceptsCount} Khái niệm
              </span>
              <span className="text-[10px] text-[var(--text-subtle)] dark:text-[#8aa693] block mt-0.5">
                {analysisReport.detectedStats.rulesCount} quy định / điều kiện
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#fbfdfb] dark:bg-[#182b1e] border border-[var(--border)] col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-[var(--text-subtle)] dark:text-[#8aa693] block">Tình huống thực tế</span>
              <span className="text-lg font-black text-[var(--text-ink)]">
                {analysisReport.detectedStats.casesCount} Ca vận dụng
              </span>
              <span className="text-[10px] text-[var(--text-subtle)] dark:text-[#8aa693] block mt-0.5">
                Hỗ trợ trắc nghiệm Scenario
              </span>
            </div>
          </div>

          {/* Ignored Metadata Protection Banner (Step 19 Spec) */}
          <div className="p-3.5 rounded-2xl bg-[#f4f7f5] dark:bg-[#15241a] border border-[var(--border)] flex items-start space-x-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[var(--mint-dark)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-[var(--text-ink)]">
                Đã loại bỏ thông tin hành chính (Metadata Protection):
              </span>
              <p className="text-[var(--text-subtle)] dark:text-[#8aa693] text-[11px] leading-relaxed">
                Đã tự động loại bỏ <strong>{analysisReport.detectedStats.ignoredPagesCount} trang</strong> (trang bìa, tên trường/học viện, thông tin sinh viên, giảng viên hướng dẫn, lời cảm ơn, tài liệu tham khảo). AI cam kết 100% câu hỏi chỉ tập trung vào kiến thức môn học thực thụ.
              </p>
            </div>
          </div>

          {/* Chapters Outline */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-[var(--text-ink)] flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>Cấu trúc các chương được phát hiện:</span>
            </h4>
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {analysisReport.chapters.map((ch, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-[var(--text-ink)]">
                      {ch.title}
                    </span>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1">
                      {ch.coreConcepts.slice(0, 2).join(", ") || "Khái niệm và quy định cốt lõi"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--mint-bg)] dark:bg-[#1e3b28] text-[10px] font-bold text-[var(--mint-dark)] dark:text-[#7fc498] shrink-0">
                    Trang {ch.startPage} - {ch.endPage}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="rounded-2xl space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Nạp lại file</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl px-6 space-x-2 font-bold cursor-pointer"
            >
              <span>Tiếp tục: Cấu hình mục tiêu</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CHOOSE DURATION & TARGET GRADE ================= */}
      {step === 3 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-ink)]">
              🐰 Thiết lập Thời gian & Định hướng Học tập
            </h2>
            <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693]">
              Lộ trình sẽ phân bổ đều đặn toàn bộ các chương đã phát hiện trong tài liệu.
            </p>
          </div>

          {/* Lựa chọn Mục đích học: Tự học đam mê vs Ôn thi */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-ink)]">
              Mục đích học tập của bạn:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setStudyPurpose("PASSION");
                  setTargetGrade("Hiểu & Ứng dụng");
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  studyPurpose === "PASSION"
                    ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1c3324] ring-1 ring-[#2d6a4f] shadow-xs"
                    : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--mint-soft)]"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">🌱</span>
                  <span className="text-xs font-bold text-[var(--text-ink)]">
                    Chỉ thích học (Không thi)
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-subtle)] dark:text-[#8aa693] mt-1 font-medium">
                  Học vì đam mê, nâng cao chuyên môn, không áp lực thi cử hay ngày hạn
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStudyPurpose("EXAM");
                  setTargetGrade("A");
                }}
                className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                  studyPurpose === "EXAM"
                    ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1c3324] ring-1 ring-[#2d6a4f] shadow-xs"
                    : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--mint-soft)]"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-base">🎯</span>
                  <span className="text-xs font-bold text-[var(--text-ink)]">
                    Có kỳ thi / Mục tiêu điểm số
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-subtle)] dark:text-[#8aa693] mt-1 font-medium">
                  Chuẩn bị thi chứng chỉ, kiểm tra học kỳ hoặc thi tuyển
                </p>
              </button>
            </div>
          </div>

          {/* Preset Days Grid */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-[var(--text-ink)]">
              Thời lượng lộ trình:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {DURATION_PRESETS.map((p) => {
                const isSelected = !isCustomDays && targetDays === p.days;
                return (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => {
                      setIsCustomDays(false);
                      setTargetDays(p.days);
                    }}
                    className={`p-4 rounded-[22px] border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1c3324] shadow-xs ring-1 ring-[#2d6a4f]"
                        : "border-[var(--border)] bg-[var(--bg-muted)] hover:border-[var(--mint-soft)]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-base text-[var(--text-ink)]">
                        {p.label}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--mint-bg)] dark:bg-[#203b29] text-[var(--mint-dark)] dark:text-[#7fc498] font-bold">
                        {p.workload}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693] mt-1 font-medium">
                      {p.note}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Days Input */}
          <div
            onClick={() => setIsCustomDays(true)}
            className={`p-4 rounded-[22px] border transition-all cursor-pointer ${
              isCustomDays
                ? "border-[var(--mint)] bg-[var(--mint-bg)] dark:bg-[#1c3324] ring-1 ring-[#2d6a4f]"
                : "border-[var(--border)] bg-[var(--bg-muted)]"
            }`}
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-[var(--text-ink)] mb-2">
              <Calendar className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>✨ Tự nhập số ngày học mong muốn:</span>
            </div>
            <div className="flex items-center space-x-3">
              <Input
                type="number"
                min="1"
                max="60"
                value={customDaysInput}
                onChange={(e) => {
                  setCustomDaysInput(e.target.value);
                  setIsCustomDays(true);
                }}
                className="max-w-[120px] rounded-xl text-center font-bold text-sm"
              />
              <span className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693]">
                ngày (phân bổ dàn đều qua các chương)
              </span>
            </div>
          </div>

          {/* Target Grade / Goal Selector */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-muted)] px-1">
              <span>{studyPurpose === "PASSION" ? "Mục tiêu nắm bắt kiến thức:" : "Mục tiêu điểm số:"}</span>
              <span className="text-[var(--mint-dark)] font-bold">{targetGrade}</span>
            </div>

            {studyPurpose === "PASSION" ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {PASSION_LEARNING_GOALS.map((g) => {
                  const isSelected = targetGrade === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTargetGrade(g.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--mint)] text-white border-[var(--mint)] shadow-md scale-102"
                          : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-ink)] hover:border-[var(--mint-soft)]"
                      }`}
                    >
                      <div className="font-extrabold text-xs">{g.label}</div>
                      <div className={`text-[10px] mt-1 ${isSelected ? "text-[#d8ebe0]" : "text-[var(--text-subtle)] dark:text-[#8aa693]"}`}>
                        {g.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {TARGET_GRADES.map((g) => {
                  const isSelected = targetGrade === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setTargetGrade(g.id)}
                      className={`p-3 rounded-2xl border text-center font-extrabold text-sm transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[var(--mint)] text-white border-[var(--mint)] shadow-md scale-105"
                          : "bg-[var(--bg-muted)] border-[var(--border)] text-[var(--text-ink)] hover:border-[var(--mint-soft)]"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="rounded-2xl space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Xem phân tích tài liệu</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStep(4)}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl px-6 space-x-2 font-bold cursor-pointer"
            >
              <span>Review Lộ trình học</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: REVIEW LEARNING ROADMAP (Step 19 Review & Step 20 Never Generate Immediately) ================= */}
      {step === 4 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div>
              <span className="text-[11px] font-bold text-[var(--mint-dark)] uppercase tracking-wider">
                XEM TRƯỚC LỘ TRÌNH (PREVIEW)
              </span>
              <h3 className="text-lg font-black text-[var(--text-ink)] mt-0.5">
                Lộ trình {daysToSend} ngày • Mục tiêu {targetGrade}
              </h3>
              <p className="text-xs text-[var(--text-subtle)] dark:text-[#8aa693] mt-0.5">
                Kiểm tra cấu trúc phân bổ trước khi khởi tạo dữ liệu chính thức.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(3)}
              className="rounded-full text-xs space-x-1 border-[#b7d8c3]"
              title="Thay đổi số ngày hoặc mục tiêu điểm"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--mint-dark)]" />
              <span>Điều chỉnh</span>
            </Button>
          </div>

          {/* Stages List Preview */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {previewStages.map((stg) => (
              <div
                key={stg.dayNumber}
                className="p-4 rounded-2xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[var(--mint-dark)] dark:text-[#7fc498]">
                    {stg.title}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--mint-bg)] dark:bg-[#1e3b28] px-2 py-0.5 rounded-full font-semibold">
                    {stg.pageRange}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {stg.concepts.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-full bg-[var(--mint-bg)] dark:bg-[#1c3324] text-[10px] font-medium text-[var(--mint-dark)] dark:text-[#8aa693]"
                    >
                      • {c}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] text-[var(--text-subtle)] pt-1">
                  <span>Khoảng 20 phút/ngày</span>
                  <span className="font-bold text-[var(--mint-dark)]">+{stg.xpReward} XP</span>
                </div>
              </div>
            ))}
          </div>

          {/* Confirmation Notice (Step 20) */}
          <div className="p-3.5 rounded-2xl bg-[#eef7ee] dark:bg-[#1a3322] border border-[#b7d8c3] dark:border-[var(--mint)] text-xs space-y-1">
            <span className="font-bold text-[var(--text-ink)] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[var(--mint-dark)]" />
              <span>Xác nhận khởi tạo Lộ trình chính thức</span>
            </span>
            <p className="text-[var(--text-subtle)] dark:text-[#8aa693] text-[11px]">
              Khi nhấn nút dưới đây, hệ thống sẽ chính thức lưu trữ Lộ trình {daysToSend} ngày, bộ bài giảng Markdown và toàn bộ câu hỏi trắc nghiệm chất lượng cao vào cơ sở dữ liệu.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="rounded-2xl space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleConfirmAndSaveRoadmap}
              className="bg-[var(--mint)] hover:bg-[var(--mint-dark)] text-white rounded-2xl px-6 space-x-2 font-bold cursor-pointer shadow-sm"
            >
              <span>{loading ? "Đang tạo lộ trình..." : "Tạo Lộ trình Học tập (Confirm)"}</span>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 5: PROCESSING & SAVING ================= */}
      {step === 5 && (
        <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[30px] p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[var(--mint-bg)] dark:bg-[#1f3b29] text-[var(--mint-dark)] mx-auto flex items-center justify-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[var(--text-ink)]">
              Đang hoàn thiện Lộ trình Chinh phục...
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Hệ thống đang lưu trữ các chặng học, bài giảng Markdown và bộ Quiz trắc nghiệm vào cơ sở dữ liệu.
            </p>
          </div>

          {/* Pipeline Checklist */}
          <div className="max-w-xs mx-auto text-left space-y-2 text-xs font-medium">
            <div className="flex items-center space-x-2 text-[var(--mint-dark)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Bản đồ học thuật đã phân tích hoàn tất</span>
            </div>
            <div className="flex items-center space-x-2 text-[var(--mint-dark)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã loại bỏ hoàn toàn metadata hành chính</span>
            </div>
            <div className="flex items-center space-x-2 text-[var(--mint-dark)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Biên soạn bộ câu hỏi tình huống & bài giảng</span>
            </div>
            <div className="flex items-center space-x-2 text-[var(--mint-dark)]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đang lưu trữ nguyên tử vào Supabase Database</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
