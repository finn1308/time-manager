"use client";

import React, { useState, useMemo } from "react";
import { X, ChevronDown, ChevronUp, Copy, Check, Sparkles, AlertCircle } from "lucide-react";

export interface ParsedWordRow {
  term: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  exampleSentence: string;
  explanation: string;
}

interface QuickAddPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWords: (words: ParsedWordRow[]) => void;
}

const CHATGPT_PROMPT_TEMPLATE = `Hãy tạo cho tôi danh sách từ vựng tiếng Anh theo chủ đề [Nhập chủ đề vào đây, ví dụ: Công nghệ thông tin, Giao tiếp công sở, Du lịch...].
Định dạng mỗi dòng 1 từ, các cột cách nhau bằng dấu gạch đứng | theo đúng thứ tự sau:
từ vựng | phiên âm | loại từ | nghĩa | ví dụ | ghi chú

Ví dụ chuẩn mẫu:
abandon | /ə'bæn.dən/ | verb | từ bỏ | She abandoned her car | thường dùng trong văn viết
ability | /ə'bɪl.ə.ti/ | noun | khả năng | He has great ability | đồng nghĩa với capability`;

export function QuickAddPasteModal({
  isOpen,
  onClose,
  onAddWords,
}: QuickAddPasteModalProps) {
  const [inputText, setInputText] = useState("");
  const [guideExpanded, setGuideExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Parse lines matching format: từ vựng | phiên âm | loại từ | nghĩa | ví dụ | ghi chú
  const parsedWords = useMemo(() => {
    if (!inputText.trim()) return [];

    const lines = inputText.split(/\r?\n/);
    const results: ParsedWordRow[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Skip header line if pasted by mistake
      if (
        line.toLowerCase().includes("từ vựng") &&
        line.toLowerCase().includes("nghĩa")
      ) {
        continue;
      }

      const parts = line.split("|").map((p) => p.trim());
      if (parts.length >= 2) {
        // Format: từ vựng | phiên âm | loại từ | nghĩa | ví dụ | ghi chú
        // If 6 parts:
        // parts[0]: term
        // parts[1]: phonetic
        // parts[2]: partOfSpeech
        // parts[3]: meaning
        // parts[4]: exampleSentence
        // parts[5]: explanation/notes
        // If fewer parts (e.g. 2 parts: term | meaning or 4 parts):
        let term = parts[0] || "";
        let phonetic = "";
        let partOfSpeech = "";
        let meaning = "";
        let exampleSentence = "";
        let explanation = "";

        if (parts.length === 2) {
          meaning = parts[1] || "";
        } else if (parts.length === 3) {
          phonetic = parts[1] || "";
          meaning = parts[2] || "";
        } else if (parts.length === 4) {
          phonetic = parts[1] || "";
          partOfSpeech = parts[2] || "";
          meaning = parts[3] || "";
        } else if (parts.length === 5) {
          phonetic = parts[1] || "";
          partOfSpeech = parts[2] || "";
          meaning = parts[3] || "";
          exampleSentence = parts[4] || "";
        } else {
          phonetic = parts[1] || "";
          partOfSpeech = parts[2] || "";
          meaning = parts[3] || "";
          exampleSentence = parts[4] || "";
          explanation = parts.slice(5).join(" | ");
        }

        if (term && meaning) {
          results.push({
            term,
            phonetic,
            partOfSpeech,
            meaning,
            exampleSentence,
            explanation,
          });
        }
      }
    }

    return results;
  }, [inputText]);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT_TEMPLATE);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = () => {
    if (parsedWords.length === 0) return;
    onAddWords(parsedWords);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-3xl rounded-3xl shadow-2xl border border-gray-100 dark:border-[#263d2e] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Thêm nhanh từ vựng (Paste)
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Purple Accordion Banner: Dùng ChatGPT để tạo từ nhanh */}
          <div className="rounded-2xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/80 dark:bg-purple-950/20 overflow-hidden transition-all">
            <button
              onClick={() => setGuideExpanded(!guideExpanded)}
              type="button"
              className="w-full px-4 py-3 flex items-center justify-between text-left text-purple-900 dark:text-purple-200 font-semibold text-xs sm:text-sm hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">💡</span>
                <span>Hướng dẫn: Dùng ChatGPT để tạo từ nhanh</span>
              </div>
              {guideExpanded ? (
                <ChevronUp className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-purple-700 dark:text-purple-400" />
              )}
            </button>

            {guideExpanded && (
              <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-purple-950 dark:text-purple-200 border-t border-purple-200/50 dark:border-purple-900/30">
                <p className="leading-relaxed">
                  Bạn có thể yêu cầu ChatGPT hoặc bất kỳ AI nào tạo sẵn bảng từ vựng đúng định dạng phân cách bằng dấu gạch đứng (<code className="px-1.5 py-0.5 rounded bg-purple-200 dark:bg-purple-900/60 font-mono font-bold">|</code>) để dán vào đây:
                </p>
                <div className="relative p-3 rounded-xl bg-white dark:bg-[#121c15] border border-purple-200 dark:border-purple-900/50 font-mono text-[11px] leading-relaxed text-gray-800 dark:text-gray-300">
                  <pre className="whitespace-pre-wrap">{CHATGPT_PROMPT_TEMPLATE}</pre>
                  <button
                    onClick={handleCopyPrompt}
                    type="button"
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold flex items-center space-x-1 shadow-sm transition-all"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-300" />
                        <span>Đã chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Sao chép prompt</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Format text instructions matching Image 2 */}
          <div className="space-y-1 text-xs">
            <p className="font-bold text-gray-800 dark:text-gray-200">
              Định dạng: mỗi dòng 1 từ, cột cách bằng{" "}
              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                |
              </span>
            </p>
            <p className="text-gray-500 dark:text-gray-400 font-mono text-[11px]">
              từ vựng | phiên âm | loại từ | nghĩa | ví dụ | ghi chú
            </p>
          </div>

          {/* Large Monospace Textarea */}
          <div className="relative">
            <textarea
              rows={9}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`abandon | /ə'bæn.dən/ | verb | từ bỏ | She abandoned her car | thường dùng trong văn viết\nability | /ə'bɪl.ə.ti/ | noun | khả năng | He has great ability | `}
              className="w-full p-4 rounded-2xl border border-gray-200 dark:border-[#263d2e] bg-gray-50/50 dark:bg-[#121f16] font-mono text-xs text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#10b981] resize-none leading-relaxed"
            />
          </div>

          {parsedWords.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
              <span className="font-medium">
                ✅ Đã nhận diện thành công <strong>{parsedWords.length}</strong> từ vựng hợp lệ sẵn sàng thêm.
              </span>
            </div>
          )}
        </div>

        {/* Footer Actions matching Image 2 */}
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
            onClick={handleConfirm}
            disabled={parsedWords.length === 0}
            className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
              parsedWords.length > 0
                ? "bg-[#22c55e] hover:bg-[#16a34a] text-white active:scale-95"
                : "bg-emerald-200 dark:bg-emerald-950/60 text-emerald-500/50 cursor-not-allowed"
            }`}
          >
            Xem trước ({parsedWords.length} dòng)
          </button>
        </div>
      </div>
    </div>
  );
}
