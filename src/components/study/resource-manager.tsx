"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  FileText,
  Image as ImageIcon,
  FolderOpen,
  Cloud,
  GraduationCap,
  ExternalLink,
  Plus,
  Trash2,
  Pin,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Sparkles,
  Send,
  Share2,
  Check,
  X,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

export interface ResourceItem {
  id: string;
  title: string;
  type: string;
  subType?: string | null;
  url: string;
  externalFileId?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
}

interface ResourceManagerProps {
  calendarEventId?: string;
  subjectId?: string | null;
  subjectName?: string;
  sessionTitle?: string;
  timeFormatted?: string;
  onClose?: () => void;
  onRefreshCalendar?: () => void;
}

export function ResourceManager({
  calendarEventId,
  subjectId,
  subjectName = "Chung",
  sessionTitle = "Buổi học",
  timeFormatted,
  onClose,
  onRefreshCalendar,
}: ResourceManagerProps) {
  const [activeTab, setActiveTab] = useState<"resources" | "notes">("resources");

  // Resources state
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Link input state
  const [aiLinkText, setAiLinkText] = useState("");
  const [aiParsing, setAiParsing] = useState(false);
  const [aiMessage, setAiMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Google Drive state
  const [driveStatus, setDriveStatus] = useState<{
    connected: boolean;
    email?: string;
    autoShare: boolean;
    hasOAuthCredentials?: boolean;
  }>({ connected: false, autoShare: false });
  const [showDriveConnectModal, setShowDriveConnectModal] = useState(false);
  const [driveConnecting, setDriveConnecting] = useState(false);

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [duplicateModal, setDuplicateModal] = useState<{
    file: File;
    existingName: string;
  } | null>(null);

  // Notes state
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean event ID
  const cleanEventId = calendarEventId?.includes("_")
    ? calendarEventId.split("_")[0]
    : calendarEventId;

  // 1. Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Drive status
      const driveRes = await fetch("/api/drive/status");
      if (driveRes.ok) {
        const driveData = await driveRes.json();
        setDriveStatus(driveData);
      }

      // Fetch resources
      const params = new URLSearchParams();
      if (cleanEventId) params.set("calendarEventId", cleanEventId);
      if (subjectId) params.set("subjectId", subjectId);

      const [resResponse, notesResponse] = await Promise.all([
        fetch(`/api/resources?${params.toString()}`),
        fetch(`/api/notes?${params.toString()}`),
      ]);

      if (resResponse.ok) {
        const d = await resResponse.json();
        setResources(d.resources || []);
      }
      if (notesResponse.ok) {
        const d = await notesResponse.json();
        setNotes(d.notes || []);
      }
    } catch (err) {
      console.error("Error loading resources/notes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [cleanEventId, subjectId]);

  // Connect Google Drive
  const handleConnectDrive = async () => {
    try {
      setDriveConnecting(true);
      const res = await fetch("/api/drive/auth/url?returnUrl=/calendar");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Không thể tạo liên kết xác thực Google Drive.");
      }
    } catch (err) {
      alert("Lỗi khi kết nối Google Drive.");
    } finally {
      setDriveConnecting(false);
    }
  };

  // Toggle Auto-share
  const handleToggleAutoShare = async (enabled: boolean) => {
    try {
      const res = await fetch("/api/drive/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoShare: enabled }),
      });
      if (res.ok) {
        setDriveStatus((prev) => ({ ...prev, autoShare: enabled }));
      }
    } catch (err) {
      console.error("Error updating auto-share setting:", err);
    }
  };

  // AI Link submit
  const handleAiLinkSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiLinkText.trim() || aiParsing) return;

    setAiParsing(true);
    setAiMessage(null);

    try {
      const res = await fetch("/api/ai/parse-resource", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: aiLinkText.trim(),
          currentCalendarEventId: cleanEventId,
          currentSubjectId: subjectId,
          autoSave: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể phân tích link");
      }

      setAiMessage({
        text: data.message || "Đã lưu tài nguyên thành công!",
        type: "success",
      });
      setAiLinkText("");
      fetchData();
      if (onRefreshCalendar) onRefreshCalendar();
    } catch (err: any) {
      setAiMessage({
        text: err.message || "Lỗi khi nhận diện link",
        type: "error",
      });
    } finally {
      setAiParsing(false);
    }
  };

  // Upload file to Google Drive
  const handleFileUpload = async (files: FileList | null, duplicateAction: "check" | "use_existing" | "upload_anyway" = "check", specificFile?: File) => {
    if (!files && !specificFile) return;

    const fileList = specificFile ? [specificFile] : Array.from(files || []);
    if (fileList.length === 0) return;

    // Check Drive connection
    if (!driveStatus.connected) {
      setShowDriveConnectModal(true);
      return;
    }

    setUploading(true);
    setUploadError(null);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setUploadProgress(`Đang tải ${file.name} (${i + 1}/${fileList.length})...`);

      try {
        const formData = new FormData();
        formData.append("file", file);
        if (cleanEventId) formData.append("calendarEventId", cleanEventId);
        if (subjectId) formData.append("subjectId", subjectId);
        formData.append("subjectName", subjectName);
        formData.append("sessionTitle", sessionTitle);
        formData.append("duplicateAction", duplicateAction);

        const res = await fetch("/api/drive/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.status === 400 && data.requiresDriveAuth) {
          setShowDriveConnectModal(true);
          setUploading(false);
          return;
        }

        if (data.isDuplicate && duplicateAction === "check") {
          setDuplicateModal({
            file,
            existingName: data.fileName,
          });
          setUploading(false);
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Lỗi tải file");
        }
      } catch (err: any) {
        setUploadError(err.message || "Tải lên thất bại");
        setUploading(false);
        return;
      }
    }

    setUploadProgress(null);
    setUploading(false);
    fetchData();
    if (onRefreshCalendar) onRefreshCalendar();
  };

  // Delete resource
  const handleDeleteResource = async (id: string) => {
    if (!confirm("Bạn có chắc muốn gỡ tài nguyên này khỏi buổi học?")) return;
    try {
      const res = await fetch(`/api/resources?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        if (onRefreshCalendar) onRefreshCalendar();
      }
    } catch (err) {
      alert("Không thể xóa tài nguyên.");
    }
  };

  // Add / Edit / Pin / Delete Note
  const handleAddNote = async () => {
    if (!newNoteText.trim() || isSavingNote) return;
    setIsSavingNote(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newNoteText.trim(),
          calendarEventId: cleanEventId,
          subjectId,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        setNotes((prev) => [d.note, ...prev]);
        setNewNoteText("");
      }
    } catch (err) {
      alert("Không thể tạo ghi chú.");
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleUpdateNote = async (id: string, content: string, isPinned?: boolean) => {
    try {
      const res = await fetch("/api/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content, isPinned }),
      });
      if (res.ok) {
        const d = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n.id === id ? d.note : n)).sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
        );
        setEditingNoteId(null);
      }
    } catch (err) {
      alert("Không thể cập nhật ghi chú.");
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      const res = await fetch(`/api/notes?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      alert("Không thể xóa ghi chú.");
    }
  };

  // Helper for resource icon
  const getResourceIcon = (subType?: string | null, type?: string) => {
    switch (subType) {
      case "ZOOM":
      case "MEET":
      case "TEAMS":
        return <Video className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case "GDRIVE":
        return <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case "ONEDRIVE":
      case "DROPBOX":
        return <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case "YOUTUBE":
        return <YoutubeIcon className="w-4 h-4 text-red-600 dark:text-red-400" />;
      case "LMS":
        return <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case "FILE_IMAGE":
        return <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case "FILE_PDF":
        return <FileText className="w-4 h-4 text-rose-600 dark:text-rose-400" />;
      default:
        return <ExternalLink className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getBadgeLabel = (subType?: string | null) => {
    switch (subType) {
      case "ZOOM":
        return "Zoom";
      case "MEET":
        return "Google Meet";
      case "TEAMS":
        return "MS Teams";
      case "GDRIVE":
        return "Google Drive";
      case "FILE_PDF":
        return "PDF Drive";
      case "FILE_IMAGE":
        return "Ảnh Drive";
      case "YOUTUBE":
        return "YouTube";
      case "LMS":
        return "LMS Course";
      default:
        return "Link";
    }
  };

  return (
    <div className="flex flex-col space-y-4 text-[#192e22] dark:text-[#f0f7f2]">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-[#dbe7dd] dark:border-[#263d2e] gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-sm sm:text-base text-[#192e22] dark:text-[#f0f7f2]">
              {sessionTitle}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1d3827] dark:text-[#a3bda9] font-medium">
              {subjectName}
            </span>
          </div>
          {timeFormatted && (
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] mt-0.5 font-mono">
              {timeFormatted}
            </p>
          )}
        </div>

        {/* Google Drive Status Bar */}
        <div className="flex items-center space-x-2">
          {driveStatus.connected ? (
            <div className="flex items-center space-x-2 bg-[#edf7f0] dark:bg-[#152a1d] px-2.5 py-1.5 rounded-xl border border-[#cbe4d3] dark:border-[#284832] text-xs">
              <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold text-[11px] text-emerald-900 dark:text-emerald-200">
                  Google Drive kết nối
                </span>
                {driveStatus.email && (
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 truncate max-w-[120px]">
                    {driveStatus.email}
                  </span>
                )}
              </div>
              <label
                title="Bật/Tắt tự động mở quyền xem cho người có link"
                className="flex items-center space-x-1 pl-2 border-l border-emerald-300 dark:border-emerald-800 cursor-pointer text-[10px]"
              >
                <input
                  type="checkbox"
                  checked={driveStatus.autoShare}
                  onChange={(e) => handleToggleAutoShare(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-3 h-3"
                />
                <span className="text-emerald-800 dark:text-emerald-300 select-none">Auto-share</span>
              </label>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDriveConnectModal(true)}
              className="text-xs h-8 rounded-xl border-dashed border-[#52b788] text-[#1b4332] dark:text-[#74c69d] hover:bg-[#d8ebe0]/40 flex items-center space-x-1.5"
            >
              <Cloud className="w-3.5 h-3.5 text-[#52b788]" />
              <span>Kết nối Google Drive</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex rounded-xl bg-[#f0f6f2] dark:bg-[#15251b] p-1 border border-[#dbe7dd] dark:border-[#263d2e]">
        <button
          type="button"
          onClick={() => setActiveTab("resources")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "resources"
              ? "bg-white dark:bg-[#1f3426] text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>📚 Tài liệu & Link ({resources.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("notes")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === "notes"
              ? "bg-white dark:bg-[#1f3426] text-[#192e22] dark:text-[#f0f7f2] shadow-2xs"
              : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22]"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>📝 Ghi chú ({notes.length})</span>
        </button>
      </div>

      {/* TAB 1: RESOURCES */}
      {activeTab === "resources" && (
        <div className="space-y-4">
          {/* AI Natural Link Input */}
          <form onSubmit={handleAiLinkSubmit} className="space-y-1.5">
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#52b788]" />
              <label className="text-xs font-bold text-[#192e22] dark:text-[#d8ebe0]">
                AI Study Assistant: Nhận diện Link tự động
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={aiLinkText}
                onChange={(e) => setAiLinkText(e.target.value)}
                placeholder="Dán link Zoom, Meet, YouTube, Drive hoặc gõ: 'Đây là link Zoom IELTS...'"
                className="text-xs h-10 rounded-xl bg-white dark:bg-[#16271c] border-[#dbe7dd] dark:border-[#263d2e] placeholder:text-gray-400"
                disabled={aiParsing}
              />
              <Button
                type="submit"
                disabled={aiParsing || !aiLinkText.trim()}
                className="h-10 px-3.5 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl text-xs font-semibold shrink-0"
              >
                {aiParsing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 mr-1" />
                    <span>Gắn link</span>
                  </>
                )}
              </Button>
            </div>
            {aiMessage && (
              <p
                className={`text-xs flex items-center space-x-1 ${
                  aiMessage.type === "success"
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {aiMessage.type === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{aiMessage.text}</span>
              </p>
            )}
          </form>

          {/* Document Dropzone */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#192e22] dark:text-[#d8ebe0] flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-[#52b788]" />
                <span>📁 Tải tài liệu lên Google Drive</span>
              </label>
              <span className="text-[10px] text-[#526b5c] dark:text-[#a3bda9]">
                Tự động lưu: Study Manager/{subjectName}/{sessionTitle}
              </span>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#b7d8c3] dark:border-[#284832] bg-[#f8fbf8] dark:bg-[#132417] hover:bg-[#edf7f0] dark:hover:bg-[#172c1c] rounded-2xl p-4 text-center cursor-pointer transition-all active:scale-[0.99] touch-manipulation"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center space-y-1.5">
                <div className="p-2.5 rounded-full bg-[#d8ebe0] dark:bg-[#1e3827] text-[#1b4332] dark:text-[#52b788]">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                  {uploading
                    ? uploadProgress || "Đang tải lên Google Drive..."
                    : "Kéo thả PDF hoặc ảnh vào đây, hoặc chạm để chọn file"}
                </div>
                <p className="text-[10px] text-[#73927d]">
                  Hỗ trợ: PDF, JPG, PNG, WEBP (File lưu trực tiếp trên Drive, không lưu binary vào DB)
                </p>
              </div>
            </div>

            {uploadError && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
                <span>{uploadError}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-7 text-xs rounded-lg border-rose-300"
                >
                  Thử lại
                </Button>
              </div>
            )}
          </div>

          {/* Attached Resources List */}
          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9]">
              Danh sách tài liệu & link ({resources.length})
            </h4>

            {loading ? (
              <div className="py-6 text-center text-xs text-[#8ba393]">Đang tải tài liệu...</div>
            ) : resources.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e] bg-[#f9faf9] dark:bg-[#142318] text-xs text-[#8ba393]">
                Chưa có tài liệu hoặc link cho buổi học này.
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs rounded-xl h-8 text-[#2d6a4f] border-[#b7d8c3]"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Thêm tài liệu / link
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {resources.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] hover:border-[#74a882] transition-all flex items-start justify-between group shadow-2xs"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start space-x-2.5 flex-1 min-w-0"
                    >
                      <div className="p-2 rounded-xl bg-[#f0f6f2] dark:bg-[#1f3426] shrink-0 mt-0.5">
                        {getResourceIcon(item.subType, item.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#d8ebe0] text-[#1b4332] dark:bg-[#1e3a27] dark:text-[#a3bda9]">
                            {getBadgeLabel(item.subType)}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] truncate mt-1">
                          {item.title}
                        </p>
                        <span className="text-[10px] text-[#52b788] hover:underline flex items-center space-x-1 mt-0.5">
                          <span>Mở link / Drive</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteResource(item.id)}
                      title="Xóa tài nguyên"
                      className="text-[#8ba393] hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NOTES */}
      {activeTab === "notes" && (
        <div className="space-y-4">
          {/* Add Note Input */}
          <div className="space-y-2">
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Ghi chú buổi học (ví dụ: Hôm nay học Unit 1, cần xem lại vocabulary...)"
              className="w-full rounded-2xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c] p-3 text-xs placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#52b788]"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || isSavingNote}
                className="h-9 px-4 bg-[#2d6a4f] hover:bg-[#1b4332] text-white rounded-xl text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Lưu ghi chú
              </Button>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#526b5c] dark:text-[#a3bda9]">
              Ghi chú buổi học ({notes.length})
            </h4>

            {notes.length === 0 ? (
              <div className="py-8 text-center rounded-2xl border border-dashed border-[#dbe7dd] dark:border-[#263d2e] bg-[#f9faf9] dark:bg-[#142318] text-xs text-[#8ba393]">
                Chưa có ghi chú nào cho buổi học này.
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      note.isPinned
                        ? "border-[#52b788] bg-[#f4faf6] dark:bg-[#16291d]"
                        : "border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#17261c]"
                    }`}
                  >
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          rows={2}
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full text-xs p-2 rounded-xl border border-[#52b788] bg-white dark:bg-[#142318]"
                        />
                        <div className="flex justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingNoteId(null)}
                            className="h-7 text-xs"
                          >
                            Hủy
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleUpdateNote(note.id, editingNoteText)}
                            className="h-7 text-xs bg-[#2d6a4f] text-white"
                          >
                            Lưu
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <p className="text-xs text-[#192e22] dark:text-[#f0f7f2] whitespace-pre-wrap flex-1">
                          {note.content}
                        </p>
                        <div className="flex items-center space-x-1 ml-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateNote(note.id, note.content, !note.isPinned)}
                            title={note.isPinned ? "Bỏ ghim" : "Ghim ghi chú"}
                            className={`p-1 rounded-lg transition-colors ${
                              note.isPinned
                                ? "text-[#2d6a4f] bg-[#d8ebe0] dark:bg-[#1d3d28]"
                                : "text-gray-400 hover:text-gray-600"
                            }`}
                          >
                            <Pin className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(note.id);
                              setEditingNoteText(note.content);
                            }}
                            title="Sửa"
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNote(note.id)}
                            title="Xóa"
                            className="text-gray-400 hover:text-rose-600 p-1 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Duplicate File Prompt Modal */}
      {duplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-[24px] bg-white dark:bg-[#17261c] p-5 shadow-2xl border border-[#dbe7dd] dark:border-[#263d2e] space-y-4">
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm">File đã tồn tại trong Google Drive</h3>
            </div>
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              Tài liệu <strong>"{duplicateModal.existingName}"</strong> đã có sẵn trong thư mục Google Drive của buổi học này. Bạn muốn xử lý thế nào?
            </p>
            <div className="flex flex-col space-y-2">
              <Button
                type="button"
                onClick={() => {
                  const file = duplicateModal.file;
                  setDuplicateModal(null);
                  handleFileUpload(null, "use_existing", file);
                }}
                className="w-full h-10 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-xs font-semibold"
              >
                Dùng file có sẵn (Use existing)
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const file = duplicateModal.file;
                  setDuplicateModal(null);
                  handleFileUpload(null, "upload_anyway", file);
                }}
                className="w-full h-10 rounded-xl border-[#dbe7dd] text-xs font-semibold"
              >
                Tải lên bản mới (Upload anyway)
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setDuplicateModal(null)}
                className="w-full text-xs text-gray-500"
              >
                Hủy
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Connect Information Modal */}
      {showDriveConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white dark:bg-[#17261c] p-6 shadow-2xl border border-[#dbe7dd] dark:border-[#263d2e] space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2.5 rounded-2xl bg-[#d8ebe0] dark:bg-[#1d3d28] text-[#1b4332] dark:text-[#52b788]">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2]">
                  Kết nối Google Drive cá nhân
                </h3>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                  Bảo mật • Quyền tối thiểu • Dữ liệu của bạn
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#f8fbf8] dark:bg-[#142318] border border-[#dbe7dd] dark:border-[#263d2e] text-xs space-y-2 text-[#2d4736] dark:text-[#a3bda9]">
              <p className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                Website cần quyền để làm gì?
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1">
                <li>Tạo thư mục cấu trúc: <code>Study Manager/{subjectName}/{sessionTitle}</code></li>
                <li>Tải tài liệu PDF, ảnh học tập trực tiếp vào Drive của bạn</li>
                <li>Tạo link xem nhanh cho bạn (không public tài liệu nếu chưa bật Auto-share)</li>
                <li>Phạm vi (Scope): <code>drive.file</code> - chỉ quản lý file do website tạo ra, KHÔNG đọc các file khác của bạn</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDriveConnectModal(false)}
                className="rounded-xl text-xs h-10 border-[#dbe7dd]"
              >
                Để sau
              </Button>
              <Button
                type="button"
                onClick={handleConnectDrive}
                disabled={driveConnecting}
                className="rounded-xl text-xs h-10 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold"
              >
                {driveConnecting ? "Đang kết nối..." : "Ủy quyền Google Drive ngay"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
