"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Upload,
  Plus,
  Trash2,
  HelpCircle,
  Zap,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  FileCode,
  Sparkles,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { QuickAddPasteModal, ParsedWordRow } from "./quick-add-paste-modal";

export interface WordRow {
  id: string;
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence: string;
  explanation: string;
}

export interface SetOption {
  id: string;
  title: string;
  courseTitle?: string;
  totalWords?: number;
}

interface AddWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWordSetId?: string;
  onWordsAdded?: (count: number, wordSetId: string) => void;
}

export function AddWordsModal({
  isOpen,
  onClose,
  defaultWordSetId,
  onWordsAdded,
}: AddWordsModalProps) {
  // Word Sets State
  const [sets, setSets] = useState<SetOption[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  const [loadingSets, setLoadingSets] = useState(false);

  // New Set Inline Modal State
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetTitle, setNewSetTitle] = useState("");
  const [creatingSetLoading, setCreatingSetLoading] = useState(false);

  // Rows State
  const [rows, setRows] = useState<WordRow[]>([
    {
      id: "row-1",
      term: "Hello",
      phonetic: "/hə'ləʊ/",
      meaning: "Xin chào",
      partOfSpeech: "noun",
      exampleSentence: "Hello world",
      explanation: "Đồng/trái nghĩa...",
    },
  ]);

  // Modals & Popovers
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [showImportDropdown, setShowImportDropdown] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileType, setImportFileType] = useState<"excel" | "csv" | "json" | "txt">("excel");

  // Fetch available word sets
  const fetchSets = async () => {
    try {
      setLoadingSets(true);
      const res = await fetch("/api/vocab/sets");
      const data = await res.json();
      if (res.ok && data.sets) {
        setSets(data.sets);
        if (defaultWordSetId && data.sets.some((s: SetOption) => s.id === defaultWordSetId)) {
          setSelectedSetId(defaultWordSetId);
        } else if (data.defaultSetId) {
          setSelectedSetId(data.defaultSetId);
        } else if (data.sets.length > 0) {
          setSelectedSetId(data.sets[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSets(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSets();
      setStatusMessage(null);
    }
  }, [isOpen, defaultWordSetId]);

  // Calculate valid words count
  const validWordsCount = useMemo(() => {
    return rows.filter((r) => r.term.trim() && r.meaning.trim()).length;
  }, [rows]);

  // Row operations
  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `row-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        term: "",
        phonetic: "",
        partOfSpeech: "",
        meaning: "",
        exampleSentence: "",
        explanation: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      // Clear instead of removing last row
      setRows([
        {
          id: `row-${Date.now()}`,
          term: "",
          phonetic: "",
          partOfSpeech: "",
          meaning: "",
          exampleSentence: "",
          explanation: "",
        },
      ]);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateRow = (id: string, field: keyof WordRow, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Append words from Quick Add Paste Modal
  const handleQuickAddWords = (parsed: ParsedWordRow[]) => {
    const newRows: WordRow[] = parsed.map((p, idx) => ({
      id: `paste-${Date.now()}-${idx}`,
      term: p.term,
      phonetic: p.phonetic,
      partOfSpeech: p.partOfSpeech,
      meaning: p.meaning,
      exampleSentence: p.exampleSentence,
      explanation: p.explanation,
    }));

    // If initial row is empty or untouched, replace it
    setRows((prev) => {
      const isFirstEmpty =
        prev.length === 1 && !prev[0].term.trim() && !prev[0].meaning.trim();
      return isFirstEmpty ? newRows : [...prev, ...newRows];
    });

    setStatusMessage({
      type: "success",
      text: `Đã thêm nhanh ${newRows.length} từ vào bảng!`,
    });
  };

  // Handle Quick Set Creation
  const handleCreateNewSet = async () => {
    if (!newSetTitle.trim()) return;
    try {
      setCreatingSetLoading(true);
      const res = await fetch("/api/vocab/sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newSetTitle.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tạo bộ từ");

      setSets((prev) => [data.set, ...prev]);
      setSelectedSetId(data.set.id);
      setIsCreatingSet(false);
      setNewSetTitle("");
      setStatusMessage({
        type: "success",
        text: `Đã tạo bộ từ "${data.set.title}" thành công!`,
      });
    } catch (e: any) {
      alert(e.message || "Lỗi tạo bộ từ");
    } finally {
      setCreatingSetLoading(false);
    }
  };

  // Handle File Upload & Parsing
  const triggerFileUpload = (type: "excel" | "csv" | "json" | "txt") => {
    setImportFileType(type);
    setShowImportDropdown(false);
    if (fileInputRef.current) {
      if (type === "excel") fileInputRef.current.accept = ".xlsx, .xls";
      else if (type === "csv") fileInputRef.current.accept = ".csv";
      else if (type === "json") fileInputRef.current.accept = ".json";
      else if (type === "txt") fileInputRef.current.accept = ".txt, .tsv";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let importedRows: WordRow[] = [];

      if (importFileType === "excel" || importFileType === "csv") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Iterate rows
        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i];
          if (!row || !Array.isArray(row) || row.length < 2) continue;

          // Check if header row
          const col0 = String(row[0] || "").toLowerCase();
          const col1 = String(row[1] || "").toLowerCase();
          if (
            (col0.includes("từ") || col0.includes("term") || col0.includes("word")) &&
            (col1.includes("nghĩa") || col1.includes("meaning") || col1.includes("phiên"))
          ) {
            continue;
          }

          // Expected columns: Term, Phonetic, Meaning, PartOfSpeech, Example, Note
          // Or flexible detection
          const term = String(row[0] || "").trim();
          const phonetic = String(row[1] || "").trim();
          const meaning = String(row[2] || row[1] || "").trim();
          const partOfSpeech = String(row[3] || "").trim();
          const exampleSentence = String(row[4] || "").trim();
          const explanation = String(row[5] || "").trim();

          if (term && meaning) {
            importedRows.push({
              id: `import-${Date.now()}-${i}`,
              term,
              phonetic,
              meaning,
              partOfSpeech,
              exampleSentence,
              explanation,
            });
          }
        }
      } else if (importFileType === "json") {
        const text = await file.text();
        const json = JSON.parse(text);
        const list = Array.isArray(json) ? json : json.words || [];

        importedRows = list
          .filter((item: any) => item && (item.term || item.word) && (item.meaning || item.definition))
          .map((item: any, idx: number) => ({
            id: `json-${Date.now()}-${idx}`,
            term: item.term || item.word || "",
            phonetic: item.phonetic || item.ipa || "",
            meaning: item.meaning || item.definition || "",
            partOfSpeech: item.partOfSpeech || item.type || "",
            exampleSentence: item.exampleSentence || item.example || "",
            explanation: item.explanation || item.note || "",
          }));
      } else if (importFileType === "txt") {
        const text = await file.text();
        const lines = text.split(/\r?\n/);
        importedRows = lines
          .map((line, idx) => {
            const separator = line.includes("\t") ? "\t" : line.includes("|") ? "|" : ",";
            const parts = line.split(separator).map((s) => s.trim());
            if (parts.length >= 2 && parts[0] && parts[1]) {
              return {
                id: `txt-${Date.now()}-${idx}`,
                term: parts[0],
                phonetic: parts.length > 2 ? parts[1] : "",
                meaning: parts.length > 2 ? parts[2] : parts[1],
                partOfSpeech: parts[3] || "",
                exampleSentence: parts[4] || "",
                explanation: parts.slice(5).join(" - "),
              };
            }
            return null;
          })
          .filter(Boolean) as WordRow[];
      }

      if (importedRows.length > 0) {
        setRows((prev) => {
          const isFirstEmpty =
            prev.length === 1 && !prev[0].term.trim() && !prev[0].meaning.trim();
          return isFirstEmpty ? importedRows : [...prev, ...importedRows];
        });
        setStatusMessage({
          type: "success",
          text: `Đã nhập thành công ${importedRows.length} từ từ file!`,
        });
      } else {
        alert("Không tìm thấy dòng từ vựng hợp lệ trong file. Vui lòng kiểm tra định dạng!");
      }
    } catch (err: any) {
      console.error(err);
      alert("Lỗi đọc file: " + (err.message || "Định dạng file không hợp lệ"));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Submit and save batch words to DB
  const handleSaveWords = async () => {
    if (!selectedSetId) {
      alert("Vui lòng chọn bộ từ vựng muốn lưu vào!");
      return;
    }

    const wordsToSave = rows
      .filter((r) => r.term.trim() && r.meaning.trim())
      .map((r) => ({
        term: r.term.trim(),
        phonetic: r.phonetic.trim() || null,
        partOfSpeech: r.partOfSpeech.trim() || null,
        meaning: r.meaning.trim(),
        exampleSentence: r.exampleSentence.trim() || null,
        explanation: r.explanation.trim() || null,
      }));

    if (wordsToSave.length === 0) {
      alert("Vui lòng điền ít nhất một từ vựng có đủ TỪ VỰNG và NGHĨA!");
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage(null);

      const res = await fetch("/api/vocab/words/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId: selectedSetId,
          words: wordsToSave,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể lưu danh sách từ");

      setStatusMessage({
        type: "success",
        text: `Tuyệt vời! Đã lưu ${data.count} từ vào bộ từ thành công!`,
      });

      setTimeout(() => {
        if (onWordsAdded) onWordsAdded(data.count, selectedSetId);
        onClose();
      }, 1000);
    } catch (e: any) {
      setStatusMessage({
        type: "error",
        text: e.message || "Lỗi lưu danh sách từ vựng",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-6xl rounded-3xl shadow-2xl border border-gray-100 dark:border-[#263d2e] overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Top Header matching Image 1 */}
        <div className="px-6 py-5 border-b border-gray-100 dark:border-[#263d2e] flex flex-wrap items-center justify-between gap-4">
          {/* Left: Thêm vào bộ từ dropdown + Tạo mới */}
          <div className="flex items-center space-x-3">
            <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white shrink-0">
              Thêm vào bộ từ:
            </span>

            <div className="relative min-w-[200px]">
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                disabled={loadingSets}
                className="w-full px-4 py-2 pr-9 rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#10b981] appearance-none"
              >
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.totalWords ?? 0} từ)
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Tạo mới button */}
            <button
              type="button"
              onClick={() => setIsCreatingSet(true)}
              className="px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-[#263d2e] bg-gray-50/80 dark:bg-[#132217] hover:bg-gray-100 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo mới</span>
            </button>
          </div>

          {/* Right Action buttons matching Image 1 */}
          <div className="flex items-center space-x-2.5">
            {/* Nhập file button with dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowImportDropdown(!showImportDropdown)}
                className="px-4 py-2 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Nhập file</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-80" />
              </button>

              {showImportDropdown && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white dark:bg-[#18281d] border border-gray-100 dark:border-[#263d2e] shadow-xl p-1.5 z-20 space-y-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => triggerFileUpload("excel")}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>File Excel (.xlsx, .xls)</span>
                  </button>
                  <button
                    onClick={() => triggerFileUpload("csv")}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>File CSV (.csv)</span>
                  </button>
                  <button
                    onClick={() => triggerFileUpload("json")}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2"
                  >
                    <FileCode className="w-4 h-4 text-amber-600" />
                    <span>File JSON (.json)</span>
                  </button>
                  <button
                    onClick={() => triggerFileUpload("txt")}
                    className="w-full px-3 py-2 rounded-xl text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium flex items-center space-x-2"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>Anki / Tab text (.txt)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hướng dẫn */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-2 rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] hover:bg-gray-50 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
              <span>Hướng dẫn</span>
            </button>

            {/* Thêm nhanh (Green Pill with Bolt icon) */}
            <button
              type="button"
              onClick={() => setIsQuickAddOpen(true)}
              className="px-4 py-2 rounded-full bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold shadow-xs flex items-center space-x-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>Thêm nhanh</span>
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Inline Create Set Dialog */}
        {isCreatingSet && (
          <div className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center space-x-3 flex-1 max-w-lg">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                Tạo bộ từ mới:
              </span>
              <input
                type="text"
                autoFocus
                value={newSetTitle}
                onChange={(e) => setNewSetTitle(e.target.value)}
                placeholder="Nhập tên bộ từ (ví dụ: Từ vựng IELTS Writing...)"
                onKeyDown={(e) => e.key === "Enter" && handleCreateNewSet()}
                className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-[#132217] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleCreateNewSet}
                disabled={creatingSetLoading || !newSetTitle.trim()}
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50"
              >
                {creatingSetLoading ? "Đang tạo..." : "Xác nhận"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingSet(false);
                  setNewSetTitle("");
                }}
                className="px-3 py-1.5 rounded-full text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Feedback alert message */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center justify-between border-b ${
              statusMessage.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200"
                : "bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border-red-200"
            }`}
          >
            <span>{statusMessage.text}</span>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}

        {/* Table of Words matching Screenshot 1 */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-4 sm:p-6 space-y-3">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-[#132217] text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider rounded-t-2xl">
                <th className="py-2.5 px-3 w-10 text-center rounded-l-xl">#</th>
                <th className="py-2.5 px-3 min-w-[150px]">
                  TỪ VỰNG <span className="text-red-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[130px]">PHIÊN ÂM</th>
                <th className="py-2.5 px-3 min-w-[150px]">
                  NGHĨA <span className="text-red-500">*</span>
                </th>
                <th className="py-2.5 px-3 min-w-[110px]">LOẠI TỪ</th>
                <th className="py-2.5 px-3 min-w-[160px]">VÍ DỤ</th>
                <th className="py-2.5 px-3 min-w-[140px]">GHI CHÚ</th>
                <th className="py-2.5 px-3 w-10 text-center rounded-r-xl"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#263d2e]/50">
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className="hover:bg-gray-50/40 dark:hover:bg-[#132217]/50 transition-colors group"
                >
                  {/* # */}
                  <td className="py-2.5 px-3 text-xs font-semibold text-gray-400 text-center">
                    {index + 1}
                  </td>

                  {/* TỪ VỰNG */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.term}
                      onChange={(e) => handleUpdateRow(row.id, "term", e.target.value)}
                      placeholder="Hello"
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* PHIÊN ÂM */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.phonetic}
                      onChange={(e) => handleUpdateRow(row.id, "phonetic", e.target.value)}
                      placeholder="/hə'ləʊ/"
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* NGHĨA */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.meaning}
                      onChange={(e) => handleUpdateRow(row.id, "meaning", e.target.value)}
                      placeholder="Xin chào"
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* LOẠI TỪ */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.partOfSpeech}
                      onChange={(e) => handleUpdateRow(row.id, "partOfSpeech", e.target.value)}
                      placeholder="noun"
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* VÍ DỤ */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.exampleSentence}
                      onChange={(e) =>
                        handleUpdateRow(row.id, "exampleSentence", e.target.value)
                      }
                      placeholder="Hello world"
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* GHI CHÚ */}
                  <td className="py-2.5 px-2">
                    <input
                      type="text"
                      value={row.explanation}
                      onChange={(e) =>
                        handleUpdateRow(row.id, "explanation", e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddRow();
                        }
                      }}
                      placeholder="Đồng/trái nghĩa..."
                      className="w-full px-3 py-1.5 text-xs rounded-full border border-gray-200 dark:border-[#263d2e] bg-white dark:bg-[#132217] text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981]"
                    />
                  </td>

                  {/* Delete row */}
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(row.id)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Xóa dòng"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Full-width dashed "+ Thêm dòng" button matching Image 1 */}
          <button
            type="button"
            onClick={handleAddRow}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#263d2e] text-gray-700 dark:text-gray-300 hover:border-[#10b981] hover:text-[#10b981] font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dòng</span>
          </button>
        </div>

        {/* Footer Actions matching Image 1 */}
        <div className="px-6 py-4 bg-gray-50/80 dark:bg-[#132217] border-t border-gray-100 dark:border-[#263d2e] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-sky-500 hover:text-sky-600 transition-colors"
          >
            Hủy
          </button>

          <button
            type="button"
            onClick={handleSaveWords}
            disabled={validWordsCount === 0 || isSubmitting}
            className={`px-7 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center space-x-2 ${
              validWordsCount > 0 && !isSubmitting
                ? "bg-[#16a34a] hover:bg-[#15803d] text-white active:scale-95 cursor-pointer"
                : "bg-emerald-200 dark:bg-emerald-950/60 text-emerald-500/50 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <span>Lưu {validWordsCount} từ</span>
            )}
          </button>
        </div>
      </div>

      {/* Quick Add Paste Modal (Screenshot 2) */}
      <QuickAddPasteModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onAddWords={handleQuickAddWords}
      />

      {/* Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#18281d] w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-[#263d2e] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                <span>Hướng dẫn thêm từ vựng</span>
              </h3>
              <button
                onClick={() => setShowGuideModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              <p>
                <strong>1. Nhập thủ công:</strong> Điền trực tiếp vào từng ô trong bảng. Hai cột <code>Từ vựng *</code> và <code>Nghĩa *</code> là bắt buộc. Nhấn phím <em>Enter</em> ở ô cuối để tự động thêm dòng mới.
              </p>
              <p>
                <strong>2. Thêm nhanh bằng ChatGPT:</strong> Bấm nút <code>⚡ Thêm nhanh</code>, sao chép prompt mẫu gửi cho ChatGPT để nhận danh sách 20-50 từ phân cách bằng dấu <code>|</code> rồi dán vào một lần.
              </p>
              <p>
                <strong>3. Nhập từ file:</strong> Hỗ trợ import tự động file Excel (.xlsx, .xls), CSV (.csv), JSON hoặc Anki tab text (.txt). Hệ thống tự map các cột tương ứng.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-5 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
