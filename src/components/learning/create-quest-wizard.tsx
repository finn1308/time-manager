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
  HelpCircle,
  ChevronLeft,
} from "lucide-react";
import { StudyBunnyMascot } from "./study-bunny-mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  { days: 7, label: "7 Ngày", note: "~43 câu/ngày • Hiệu quả cao", workload: "Cao" },
  { days: 14, label: "14 Ngày", note: "~21 câu/ngày • Hiệu quả cao", workload: "Vừa phải" },
  { days: 21, label: "21 Ngày", note: "~14 câu/ngày • Cân bằng", workload: "Vừa phải" },
  { days: 30, label: "30 Ngày", note: "~10 câu/ngày • Bền bỉ", workload: "Nhẹ nhàng" },
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

export function CreateQuestWizard({
  subjects = [],
  onQuestCreated,
  onCancel,
}: CreateQuestWizardProps) {
  // Wizard steps: 1: Material -> 2: Duration -> 3: Target Grade -> 4: Processing
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Material state
  const [importType, setImportType] = useState<"PDF" | "TEXT">("PDF");
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [textTitle, setTextTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [uploadedDocId, setUploadedDocId] = useState<string | null>(null);
  const [uploadedDocMeta, setUploadedDocMeta] = useState<{
    filename: string;
    pageCount: number;
    characterCount: number;
  } | null>(null);

  // Roadmap configs
  const [targetDays, setTargetDays] = useState<number>(14);
  const [isCustomDays, setIsCustomDays] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState("14");
  const [targetGrade, setTargetGrade] = useState("A");

  // Loading & error
  const [loading, setLoading] = useState(false);
  const [processStage, setProcessStage] = useState<string>("UPLOADING");
  const [error, setError] = useState<string | null>(null);

  // Step 1: Upload & Extract Material
  const handleUploadMaterial = async () => {
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
        setUploadedDocMeta({
          filename: data.filename,
          pageCount: data.pageCount,
          characterCount: data.characterCount,
        });
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
        setUploadedDocMeta({
          filename: data.filename,
          pageCount: 1,
          characterCount: data.characterCount,
        });
      }

      setStep(2); // Move to duration selection
    } catch (err: any) {
      setError(err.message || "Lỗi xử lý tài liệu");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Final Generation
  const handleGenerateRoadmap = async () => {
    setError(null);
    setStep(4);
    setLoading(true);
    setProcessStage("EXTRACTING");

    try {
      // Simulate progress stages for smooth UX
      setTimeout(() => setProcessStage("ANALYZING"), 800);
      setTimeout(() => setProcessStage("GENERATING"), 1800);

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
      }, 600);
    } catch (err: any) {
      setError(err.message || "Lỗi tạo lộ trình");
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Indicators */}
      <div className="flex items-center justify-between px-3">
        {[
          { num: 1, title: "Tài liệu học tập" },
          { num: 2, title: "Thời gian chinh phục" },
          { num: 3, title: "Mục tiêu điểm" },
        ].map((s) => (
          <div key={s.num} className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                step === s.num
                  ? "bg-[#2d6a4f] text-white shadow-xs"
                  : step > s.num
                  ? "bg-[#d8ebe0] text-[#1b4332]"
                  : "bg-[#e5ede7] text-[#73927d]"
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span
              className={`text-xs font-semibold hidden sm:inline ${
                step === s.num
                  ? "text-[#192e22] dark:text-[#f0f7f2]"
                  : "text-[#73927d] dark:text-[#8aa693]"
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
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <StudyBunnyMascot message="Chào bạn! Hãy nạp tài liệu học tập (PDF bài giảng, đề cương hoặc giáo trình) để mình giúp bạn biến thành Lộ trình học tương tác và bộ Quiz chất lượng cao nhé!" />

          {/* Import Type Tabs */}
          <div className="flex rounded-2xl bg-[#eef5f0] dark:bg-[#142318] p-1 border border-[#dbe7dd] dark:border-[#263d2e]">
            <button
              type="button"
              onClick={() => setImportType("PDF")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                importType === "PDF"
                  ? "bg-white dark:bg-[#203627] text-[#1b4332] dark:text-[#d8ebe0] shadow-xs"
                  : "text-[#526b5c] dark:text-[#8aa693]"
              }`}
            >
              📄 Tải lên file PDF
            </button>
            <button
              type="button"
              onClick={() => setImportType("TEXT")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                importType === "TEXT"
                  ? "bg-white dark:bg-[#203627] text-[#1b4332] dark:text-[#d8ebe0] shadow-xs"
                  : "text-[#526b5c] dark:text-[#8aa693]"
              }`}
            >
              ✍️ Dán văn bản / Ghi chú
            </button>
          </div>

          {/* Subject Selector (Optional) */}
          {subjects.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                Liên kết với Môn học hiện có (tùy chọn):
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full text-xs p-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#192e22] dark:text-[#f0f7f2]"
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
                className="border-2 border-dashed border-[#b7d8c3] dark:border-[#2d6a4f] rounded-[26px] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-[#eef5f0]/50 dark:hover:bg-[#1c3022]/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#d8ebe0] dark:bg-[#1e3827] flex items-center justify-center text-[#2d6a4f] dark:text-[#52b788] mb-3 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="font-bold text-sm text-[#192e22] dark:text-[#f0f7f2]">
                  {file ? file.name : "Kéo & Thả file PDF bài học vào đây"}
                </p>
                <p className="text-xs text-[#73927d] mt-1">
                  {file
                    ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Nhấp để chọn file khác`
                    : "Hỗ trợ giáo trình, bài giảng slide hoặc đề cương ôn tập (tối đa 25MB)"}
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
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Tiêu đề tài liệu:
                </label>
                <Input
                  type="text"
                  placeholder="Ví dụ: Chiến lược Thương mại điện tử"
                  value={textTitle}
                  onChange={(e) => setTextTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#192e22] dark:text-[#d8ebe0] mb-1.5">
                  Nội dung bài học hoặc ghi chú:
                </label>
                <textarea
                  rows={8}
                  placeholder="Dán nội dung kiến thức, định nghĩa, chương mục hoặc tóm tắt tài liệu vào đây..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full text-xs p-3.5 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] text-[#192e22] dark:text-[#f0f7f2] focus:outline-hidden"
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
              onClick={handleUploadMaterial}
              className="ml-auto bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl px-6 space-x-2"
            >
              <span>{loading ? "Đang trích xuất văn bản..." : "Tiếp tục: Chọn thời gian"}</span>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: CHOOSE DURATION (PDF Page 1) ================= */}
      {step === 2 && (
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
              🐰 Bạn muốn chinh phục môn này trong bao lâu?
            </h2>
            <p className="text-xs text-[#526b5c] dark:text-[#8aa693]">
              Chọn lộ trình thời gian phù hợp với lịch trình cá nhân của bạn.
            </p>
          </div>

          <StudyBunnyMascot
            message="Hành trình vạn dặm khởi đầu từ một bước chân! Hãy chọn số ngày bạn muốn hoàn thành nhé."
            mood="cheering"
          />

          {/* Preset Days Grid */}
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
                      ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1c3324] shadow-xs ring-1 ring-[#2d6a4f]"
                      : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] hover:border-[#74a882]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-[#192e22] dark:text-[#f0f7f2]">
                      {p.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#d8ebe0] dark:bg-[#203b29] text-[#1b4332] dark:text-[#7fc498] font-bold">
                      {p.workload}
                    </span>
                  </div>
                  <p className="text-xs text-[#526b5c] dark:text-[#8aa693] mt-1 font-medium">
                    {p.note}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Custom Days Input */}
          <div
            onClick={() => setIsCustomDays(true)}
            className={`p-4 rounded-[22px] border transition-all cursor-pointer ${
              isCustomDays
                ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1c3324] ring-1 ring-[#2d6a4f]"
                : "border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318]"
            }`}
          >
            <div className="flex items-center space-x-2 text-xs font-bold text-[#192e22] dark:text-[#f0f7f2] mb-2">
              <Calendar className="w-4 h-4 text-[#2d6a4f]" />
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
              <span className="text-xs text-[#526b5c] dark:text-[#8aa693]">
                ngày (khoảng {Math.max(1, Math.round(300 / (parseInt(customDaysInput, 10) || 14)))} câu hỏi/ngày)
              </span>
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
              <span>Quay lại</span>
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl px-6 space-x-2"
            >
              <span>Tiếp tục: Chọn mục tiêu điểm</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CHOOSE TARGET GRADE (PDF Page 2) ================= */}
      {step === 3 && (
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
              🎯 Bạn muốn đạt mục tiêu điểm nào?
            </h2>
            <p className="text-xs text-[#526b5c] dark:text-[#8aa693]">
              Hệ thống sẽ điều chỉnh độ sâu kiến thức và các dạng câu hỏi thích ứng theo mục tiêu của bạn.
            </p>
          </div>

          <StudyBunnyMascot
            message="Mục tiêu điểm A cao ngất ngưởng! Chăm chỉ ôn luyện và làm quiz mỗi ngày là đạt được ngay thôi."
            mood="happy"
          />

          {/* Target Grade Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#73927d] px-1">
              <span>Cơ bản</span>
              <span className="text-[#2d6a4f] font-bold">Mục tiêu: {targetGrade}</span>
              <span>Xuất sắc</span>
            </div>
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
                        ? "bg-[#2d6a4f] text-white border-[#2d6a4f] shadow-md scale-105"
                        : "bg-[#f8fbf8] dark:bg-[#142318] border-[#dbe7dd] dark:border-[#263d2e] text-[#192e22] dark:text-[#f0f7f2] hover:border-[#74a882]"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Adaptive Difficulty Callout (From PDF Page 2) */}
          <div className="p-4 rounded-[22px] border border-[#b7d8c3] dark:border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#193322] space-y-2 text-xs">
            <p className="font-bold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#2d6a4f] dark:text-[#52b788]" />
              <span>Hệ thống Adaptive Difficulty tự động tối ưu:</span>
            </p>
            <ul className="space-y-1 text-[#2d4734] dark:text-[#b5d6be] pl-5 list-disc text-[11px]">
              <li>
                Phân bổ tỷ lệ câu hỏi lý thuyết, hiểu bản chất và vận dụng tình huống phù hợp với mục tiêu điểm {targetGrade}.
              </li>
              <li>
                Thời lượng dự kiến: <strong>15–25 phút/ngày</strong> với workload tối ưu.
              </li>
              <li>
                Mỗi câu hỏi đều có giải thích cặn kẽ và trích dẫn trực tiếp từ tài liệu gốc.
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="rounded-2xl space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Quay lại</span>
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={handleGenerateRoadmap}
              className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-2xl px-6 space-x-2 font-bold"
            >
              <span>Tạo lộ trình học tập ngay</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: PROCESSING INDICATOR (Section 4 in prompt) ================= */}
      {step === 4 && (
        <div className="bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] rounded-[30px] p-8 text-center space-y-6 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-[#d8ebe0] dark:bg-[#1f3b29] text-[#2d6a4f] dark:text-[#52b788] mx-auto flex items-center justify-center shadow-xs">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Analyzing your material & Generating Quest...
            </h3>
            <p className="text-xs text-[#73927d]">
              AI đang phân tích cấu trúc tài liệu, trích xuất kiến thức cốt lõi và biên soạn bộ đề Quiz chuẩn sư phạm.
            </p>
          </div>

          {/* Pipeline Checklist */}
          <div className="max-w-xs mx-auto text-left space-y-2 text-xs font-medium">
            <div className="flex items-center space-x-2 text-[#2d6a4f]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Tài liệu đã được tải lên an toàn</span>
            </div>
            <div className="flex items-center space-x-2 text-[#2d6a4f]">
              <CheckCircle2 className="w-4 h-4" />
              <span>Văn bản và số trang đã được bóc tách</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                processStage === "ANALYZING" || processStage === "GENERATING" || processStage === "READY"
                  ? "text-[#2d6a4f]"
                  : "text-[#73927d]"
              }`}
            >
              {processStage === "UPLOADING" || processStage === "EXTRACTING" ? (
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Phát hiện chương mục & khái niệm cốt lõi</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                processStage === "GENERATING" || processStage === "READY"
                  ? "text-[#2d6a4f]"
                  : "text-[#73927d]"
              }`}
            >
              {processStage === "GENERATING" ? (
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
              ) : processStage === "READY" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />
              )}
              <span>Biên soạn câu hỏi tình huống & lời giải</span>
            </div>
            <div
              className={`flex items-center space-x-2 ${
                processStage === "READY" ? "text-[#2d6a4f]" : "text-[#73927d]"
              }`}
            >
              {processStage === "READY" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-gray-300 inline-block" />
              )}
              <span>Hoàn tất & Khởi tạo lộ trình</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
