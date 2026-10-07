"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
import { toast } from "sonner";
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  BookOpen,
  Target,
  CheckSquare,
  FileDown,
  Eye,
  Edit3,
  Heading1,
  Heading2,
  Heading3,
  Bold,
  Italic,
  ListOrdered,
  List as ListIcon,
  CheckSquare as CheckIcon,
  Quote,
  Code,
  Minus,
  Sparkles,
  Tag as TagIcon,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Note State
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subjectId, setSubjectId] = useState<string>("");
  const [goalId, setGoalId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [documentId, setDocumentId] = useState<string>("");
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubjectId, setFilterSubjectId] = useState("ALL");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const [mobileViewTab, setMobileViewTab] = useState<"list" | "editor">("editor");
  const [extracting, setExtracting] = useState(false);

  const handleExtractFlashcards = async () => {
    if (!content.trim() || extracting) return;
    try {
      setExtracting(true);
      const res = await fetch("/api/flashcards/generate-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: subjectId || null,
          newDeckTitle: `Flashcards: ${title || "Ghi chú"}`,
          customText: content,
          count: 8,
        }),
      });
      const data = await res.json();
      if (data.success || data.deckId) {
        toast.success("Đã trích xuất thành công bộ thẻ ghi nhớ từ ghi chú này! Bạn có thể vào mục Flashcards để ôn tập ngay.");
      } else {
        toast.error(data.error || "Không thể trích xuất flashcards");
      }
    } catch (err) {
      console.error("Error extracting flashcards:", err);
      toast.error("Đã xảy ra lỗi khi trích xuất thẻ");
    } finally {
      setExtracting(false);
    }
  };

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const selectNote = (note: any) => {
    setSelectedNoteId(note.id);
    setTitle(note.title || "");
    setContent(note.content || "");
    setSubjectId(note.subjectId || "");
    setGoalId(note.goalId || "");
    setTaskId(note.taskId || "");
    setDocumentId(note.documentId || "");
    setIsPinned(Boolean(note.isPinned));
    setTags((note.tags || []).map((t: any) => t.tag?.name).filter(Boolean));
    setSaveStatus("saved");
    setMobileViewTab("editor");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [resNotes, resSubs, resGoals, resTasks, resDocs] = await Promise.all([
        fetch("/api/notes").then((r) => r.json()),
        fetch("/api/subjects").then((r) => r.json()),
        fetch("/api/goals").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/learning/roadmaps").then((r) => r.json()).catch(() => ({})),
      ]);

      if (resNotes.notes) {
        setNotes(resNotes.notes);
        if (resNotes.notes.length > 0 && !selectedNoteId) {
          selectNote(resNotes.notes[0]);
        }
      }
      if (resSubs.subjects) setSubjects(resSubs.subjects);
      if (resGoals.goals) setGoals(resGoals.goals);
      if (resTasks.tasks) setTasks(resTasks.tasks);
    } catch (err) {
      console.error("Error loading notes data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNewNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Trang ghi chú mới",
          content: "# Tiêu đề bài học\n\nNội dung ghi chú bắt đầu từ đây...",
          subjectId: filterSubjectId !== "ALL" ? filterSubjectId : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi tạo ghi chú");

      await loadData();
      selectNote(data.note);
    } catch (e: any) {
      toast.error(e.message || "Không thể tạo ghi chú");
    }
  };

  const triggerSave = (updates?: Partial<{ title: string; content: string; subjectId: string; goalId: string; taskId: string; documentId: string; isPinned: boolean; tags: string[] }>) => {
    if (!selectedNoteId) return;

    setSaveStatus("saving");
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const payload = {
          id: selectedNoteId,
          title: updates?.title !== undefined ? updates.title : title,
          content: updates?.content !== undefined ? updates.content : content,
          subjectId: updates?.subjectId !== undefined ? updates.subjectId : subjectId,
          goalId: updates?.goalId !== undefined ? updates.goalId : goalId,
          taskId: updates?.taskId !== undefined ? updates.taskId : taskId,
          documentId: updates?.documentId !== undefined ? updates.documentId : documentId,
          isPinned: updates?.isPinned !== undefined ? updates.isPinned : isPinned,
          tagNames: updates?.tags !== undefined ? updates.tags : tags,
        };

        const res = await fetch("/api/notes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          setSaveStatus("saved");
          // Refresh list silently
          const resNotes = await fetch("/api/notes").then((r) => r.json());
          if (resNotes.notes) setNotes(resNotes.notes);
        } else {
          setSaveStatus("unsaved");
        }
      } catch {
        setSaveStatus("unsaved");
      }
    }, 600);
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Bạn có chắc chắn muốn xóa trang ghi chú này?")) return;

    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Lỗi xóa");

      const remaining = notes.filter((n) => n.id !== id);
      setNotes(remaining);
      if (selectedNoteId === id) {
        if (remaining.length > 0) selectNote(remaining[0]);
        else setSelectedNoteId(null);
      }
    } catch (e: any) {
      toast.error(e.message || "Không thể xóa ghi chú");
    }
  };

  // Block Formatting Helpers
  const insertTextAtCursor = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || "văn bản"}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    triggerSave({ content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 7));
    }, 0);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, "");
      if (val && !tags.includes(val)) {
        const nextTags = [...tags, val];
        setTags(nextTags);
        triggerSave({ tags: nextTags });
        setTagInput("");
      }
    }
  };

  const removeTag = (tToRemove: string) => {
    const nextTags = tags.filter((t) => t !== tToRemove);
    setTags(nextTags);
    triggerSave({ tags: nextTags });
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = filterSubjectId === "ALL" || n.subjectId === filterSubjectId;
    return matchesSearch && matchesSubject;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.isPinned);
  const regularNotes = filteredNotes.filter((n) => !n.isPinned);

  // Render Markdown preview
  const renderMarkdownPreview = (text: string) => {
    const lines = text.split("\n");
    return (
      <div className="space-y-2 text-[#192e22] dark:text-[#f0f7f2] leading-relaxed select-text font-sans">
        {lines.map((line, idx) => {
          if (line.startsWith("# ")) {
            return (
              <h1 key={idx} className="text-2xl font-black text-[#192e22] dark:text-[#f0f7f2] mt-4 mb-2 pb-1 border-b border-[#dbe7dd] dark:border-[#263d2e]">
                {line.replace("# ", "")}
              </h1>
            );
          }
          if (line.startsWith("## ")) {
            return (
              <h2 key={idx} className="text-xl font-bold text-[#192e22] dark:text-[#f0f7f2] mt-3 mb-1">
                {line.replace("## ", "")}
              </h2>
            );
          }
          if (line.startsWith("### ")) {
            return (
              <h3 key={idx} className="text-base font-bold text-[#2d6a4f] dark:text-[#52b788] mt-2 mb-1">
                {line.replace("### ", "")}
              </h3>
            );
          }
          if (line.startsWith("> ")) {
            return (
              <blockquote key={idx} className="border-l-4 border-[#2d6a4f] pl-3 py-1 my-1.5 italic text-[#526b5c] dark:text-[#a3bda9] bg-[#eef5f0]/60 dark:bg-[#1d3024]/40 rounded-r-xl">
                {line.replace("> ", "")}
              </blockquote>
            );
          }
          if (line.startsWith("- [ ] ") || line.startsWith("- [x] ")) {
            const isChecked = line.startsWith("- [x] ");
            return (
              <div key={idx} className="flex items-center space-x-2 text-xs py-0.5">
                <input
                  type="checkbox"
                  checked={isChecked}
                  readOnly
                  className="rounded text-[#2d6a4f]"
                />
                <span className={isChecked ? "line-through opacity-60" : ""}>
                  {line.replace(/- \[[ x]\] /, "")}
                </span>
              </div>
            );
          }
          if (line.startsWith("- ")) {
            return (
              <li key={idx} className="list-disc ml-5 text-xs py-0.5">
                {line.replace("- ", "")}
              </li>
            );
          }
          if (line.startsWith("---")) {
            return <hr key={idx} className="border-t border-[#dbe7dd] dark:border-[#263d2e] my-3" />;
          }
          if (!line.trim()) {
            return <div key={idx} className="h-2" />;
          }
          return (
            <p key={idx} className="text-xs">
              {line}
            </p>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#d8ebe0] dark:bg-[#1d3827] text-[#1b4332] dark:text-[#86e2a8] text-xs font-bold mb-1.5">
            <FileText className="w-3.5 h-3.5 text-[#2d6a4f] dark:text-[#52b788]" />
            <span>NOTION-STYLE KNOWLEDGE BASE</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#192e22] dark:text-[#f0f7f2]">
            Ghi chú & Cơ sở tri thức (Notes)
          </h1>
        </div>

        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Mobile view toggle */}
          <div className="flex lg:hidden items-center p-1 rounded-2xl bg-white dark:bg-[#17261c] border border-[#dbe7dd] dark:border-[#263d2e] text-xs">
            <button
              onClick={() => setMobileViewTab("list")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                mobileViewTab === "list"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              Danh sách ({notes.length})
            </button>
            <button
              onClick={() => setMobileViewTab("editor")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                mobileViewTab === "editor"
                  ? "bg-[#2d6a4f] text-white shadow-2xs"
                  : "text-[#526b5c] dark:text-[#a3bda9]"
              }`}
            >
              Soạn thảo
            </button>
          </div>

          <Button
            onClick={handleCreateNewNote}
            className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold space-x-1.5 h-9"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo mới</span>
          </Button>
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Notes List (4 cols) */}
        <div className={`lg:col-span-4 space-y-3 ${mobileViewTab === "editor" && selectedNoteId ? "hidden lg:block" : "block"}`}>
          <Card className="rounded-[28px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 shadow-sm space-y-3">
            {/* Search & Subject filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#73927d] absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm ghi chú..."
                  className="pl-8 rounded-xl border-[#dbe7dd] text-xs h-8"
                />
              </div>

              <select
                value={filterSubjectId}
                onChange={(e) => setFilterSubjectId(e.target.value)}
                className="w-full rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#142318] px-2.5 py-1.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
              >
                <option value="ALL">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes List with Pinned Section */}
            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-1 text-[10px] font-bold text-[#73927d] uppercase tracking-wider px-1">
                    <Pin className="w-3 h-3 text-[#2d6a4f]" />
                    <span>Đã ghim ({pinnedNotes.length})</span>
                  </div>
                  {pinnedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        selectedNoteId === note.id
                          ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] font-bold text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                          : "border-[#dbe7dd]/70 dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{note.title}</span>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-[#73927d] mt-0.5 truncate">
                        {note.subject?.name || "Không gắn môn"}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Regular Notes Section */}
              <div className="space-y-1">
                <div className="text-[10px] font-bold text-[#73927d] uppercase tracking-wider px-1">
                  Tất cả ({regularNotes.length})
                </div>
                {regularNotes.length === 0 && pinnedNotes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#73927d] italic">
                    Chưa có ghi chú nào.
                  </div>
                ) : (
                  regularNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => selectNote(note)}
                      className={`p-2.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                        selectedNoteId === note.id
                          ? "border-[#2d6a4f] bg-[#eef5f0] dark:bg-[#1d3024] font-bold text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
                          : "border-[#dbe7dd]/70 dark:border-[#263d2e] hover:bg-[#f8fbf8] dark:hover:bg-[#142318] text-[#526b5c] dark:text-[#a3bda9]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{note.title}</span>
                        <button
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          className="text-[#a3a86c] hover:text-rose-500 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-[10px] text-[#73927d] mt-0.5 truncate">
                        {note.subject?.name || "Ghi chú tự do"} • {new Date(note.updatedAt).toLocaleDateString("vi-VN")}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Notion-style Editor Pane (8 cols) */}
        <div className={`lg:col-span-8 ${mobileViewTab === "list" ? "hidden lg:block" : "block"}`}>
          {selectedNoteId ? (
            <Card className="rounded-[30px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-4 sm:p-8 shadow-sm space-y-4 min-h-[640px] flex flex-col justify-between">
              <div className="space-y-4">
                {/* Save status & View switcher */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-[#dbe7dd]/60 dark:border-[#263d2e] flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => setMobileViewTab("list")}
                      className="lg:hidden px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800 text-[#2d6a4f] dark:text-[#52b788] font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Danh sách</span>
                    </button>
                    <span className="text-[11px] font-semibold text-[#73927d]">
                      {saveStatus === "saving" ? "Đang lưu..." : saveStatus === "saved" ? "✓ Đã lưu" : "Chưa lưu"}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const nextPinned = !isPinned;
                        setIsPinned(nextPinned);
                        triggerSave({ isPinned: nextPinned });
                      }}
                      className={`p-1.5 rounded-xl border text-xs flex items-center space-x-1 cursor-pointer transition-colors ${
                        isPinned
                          ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60"
                          : "border-[#dbe7dd] text-[#73927d] hover:bg-[#eef5f0]"
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{isPinned ? "Đã ghim" : "Ghim"}</span>
                    </button>

                    <button
                      type="button"
                      disabled={extracting}
                      onClick={handleExtractFlashcards}
                      className="px-2.5 py-1 rounded-xl border border-purple-200 text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/30 flex items-center space-x-1 font-semibold text-[11px] disabled:opacity-60"
                    >
                      <Sparkles className="w-3 h-3 text-purple-600" />
                      <span>{extracting ? "Đang trích xuất..." : "Trích xuất Flashcards AI"}</span>
                    </button>
                  </div>

                  {/* Mode switcher */}
                  <div className="flex items-center space-x-1 p-0.5 bg-[#f4f8f5] dark:bg-[#101c14] border border-[#dbe7dd] dark:border-[#263d2e] rounded-xl text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setViewMode("edit")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        viewMode === "edit" ? "bg-[#2d6a4f] text-white" : "text-[#73927d]"
                      }`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("split")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        viewMode === "split" ? "bg-[#2d6a4f] text-white" : "text-[#73927d]"
                      }`}
                    >
                      Song song
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("preview")}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        viewMode === "preview" ? "bg-[#2d6a4f] text-white" : "text-[#73927d]"
                      }`}
                    >
                      Xem trước
                    </button>
                  </div>
                </div>

                {/* Giant Seamless Notion Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    triggerSave({ title: e.target.value });
                  }}
                  placeholder="Tiêu đề trang ghi chú..."
                  className="w-full text-2xl sm:text-3xl font-black text-[#192e22] dark:text-[#f0f7f2] bg-transparent border-none outline-none focus:ring-0 placeholder:text-[#b0c4b6]"
                />

                {/* Metadata Links Bar (Subject, Goal, Task) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-2xl bg-[#f8fbf8] dark:bg-[#132217] border border-[#dbe7dd] dark:border-[#223829] text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-[#73927d] mb-1">
                      Môn học liên kết:
                    </span>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        triggerSave({ subjectId: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-1.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                    >
                      <option value="">(Chưa gắn môn)</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-[#73927d] mb-1">
                      Mục tiêu (Goal):
                    </span>
                    <select
                      value={goalId}
                      onChange={(e) => {
                        setGoalId(e.target.value);
                        triggerSave({ goalId: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-1.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                    >
                      <option value="">(Không gắn mục tiêu)</option>
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-[#73927d] mb-1">
                      Task công việc:
                    </span>
                    <select
                      value={taskId}
                      onChange={(e) => {
                        setTaskId(e.target.value);
                        triggerSave({ taskId: e.target.value });
                      }}
                      className="w-full rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-1.5 text-xs text-[#192e22] dark:text-[#f0f7f2]"
                    >
                      <option value="">(Không gắn task)</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <TagIcon className="w-3.5 h-3.5 text-[#73927d]" />
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1e3827] dark:text-[#86e2a8] text-[10px] font-bold"
                    >
                      <span>#{t}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(t)}
                        className="hover:text-rose-500 font-bold ml-1 cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    placeholder="+ Thêm #tag (Enter)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="text-xs bg-transparent border-none outline-none text-[#526b5c] placeholder:text-[#8ba393] w-36"
                  />
                </div>

                {/* Rich Block Inserter Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-2xl bg-[#f4f8f5] dark:bg-[#101c14] border border-[#dbe7dd] dark:border-[#263d2e] text-xs">
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("# ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c] font-bold text-xs"
                    title="Tiêu đề 1"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("## ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c] font-bold text-xs"
                    title="Tiêu đề 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("### ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c] font-bold text-xs"
                    title="Tiêu đề 3"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-4 bg-[#dbe7dd] dark:bg-[#263d2e] mx-1" />
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("**", "**")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c] font-bold"
                    title="In đậm"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("*", "*")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c] italic"
                    title="In nghiêng"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-[1px] h-4 bg-[#dbe7dd] dark:bg-[#263d2e] mx-1" />
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("- [ ] ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c]"
                    title="Checklist todo"
                  >
                    <CheckIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("- ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c]"
                    title="Danh sách gạch đầu dòng"
                  >
                    <ListIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("> ")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c]"
                    title="Trích dẫn / Quote"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("```\n", "\n```")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c]"
                    title="Khối mã nguồn / Code"
                  >
                    <Code className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertTextAtCursor("\n---\n")}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#17261c]"
                    title="Đường kẻ ngang chia khối"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Editor Content Area based on ViewMode */}
                <div className={`grid gap-4 ${viewMode === "split" ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                  {/* Textarea Input */}
                  {(viewMode === "edit" || viewMode === "split") && (
                    <textarea
                      ref={textareaRef}
                      rows={16}
                      value={content}
                      onChange={(e) => {
                        setContent(e.target.value);
                        triggerSave({ content: e.target.value });
                      }}
                      placeholder="Viết nội dung bài học bằng Markdown hoặc phím tắt ở trên..."
                      className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#fdfefe] dark:bg-[#142318] p-4 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#52b788] text-[#192e22] dark:text-[#f0f7f2] leading-relaxed resize-y"
                    />
                  )}

                  {/* Notion-style Live Preview */}
                  {(viewMode === "preview" || viewMode === "split") && (
                    <div className="rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-[#f8fbf8] dark:bg-[#121f15] p-5 overflow-y-auto max-h-[460px]">
                      {renderMarkdownPreview(content)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="rounded-[30px] border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-[#eef5f0] text-[#2d6a4f] flex items-center justify-center mx-auto mb-2">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[#192e22] dark:text-[#f0f7f2]">
                Chọn một trang ghi chú hoặc tạo trang mới
              </h3>
              <p className="text-xs text-[#526b5c] max-w-sm mx-auto">
                Cơ sở tri thức Notion hỗ trợ Markdown, ghim trang, gắn nhãn #tags và liên kết chặt chẽ với Goal & Task.
              </p>
              <Button
                onClick={handleCreateNewNote}
                className="rounded-2xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-bold"
              >
                + Tạo ghi chú ngay
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
