"use client";

import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Clock,
  Tag,
  Users,
  CheckSquare,
  MessageSquare,
  Paperclip,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  Send,
  MoveRight,
  Upload,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

interface CardDetailModalProps {
  open: boolean;
  onClose: () => void;
  roomId: string;
  cardId?: string | null; // null if creating a new card
  initialColumnId?: string;
  columns: Array<{ id: string; name: string; key: string }>;
  groups: Array<{ id: string; name: string; color: string | null }>;
  labels: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; userId: string; name: string; image?: string | null }>;
  currentUserId: string;
  onCardUpdated?: () => void;
}

export function CardDetailModal({
  open,
  onClose,
  roomId,
  cardId,
  initialColumnId,
  columns,
  groups,
  labels,
  members,
  currentUserId,
  onCardUpdated,
}: CardDetailModalProps) {
  const isEditing = !!cardId;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState(initialColumnId || (columns[0]?.id ?? ""));
  const [groupId, setGroupId] = useState<string>("");
  const [dueAt, setDueAt] = useState<string>("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

  // Checklist items
  const [checklist, setChecklist] = useState<Array<{ id: string; text: string; isCompleted: boolean }>>([]);
  const [newChecklistText, setNewChecklistText] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; url: string; size?: number | null; type?: string | null }>>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comments
  const [comments, setComments] = useState<Array<{ id: string; body: string; createdAt: string; author: { name: string; image?: string | null } }>>([]);
  const [newCommentText, setNewCommentText] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (cardId) {
        fetchCardDetails(cardId);
      } else {
        // Reset for new card
        setTitle("");
        setDescription("");
        setColumnId(initialColumnId || (columns[0]?.id ?? ""));
        setGroupId("");
        setDueAt("");
        setSelectedLabels([]);
        setSelectedAssignees([]);
        setChecklist([]);
        setAttachments([]);
        setComments([]);
      }
    }
  }, [open, cardId, initialColumnId]);

  const fetchCardDetails = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải thẻ");

      const c = data.card;
      setTitle(c.title || "");
      setDescription(c.description || "");
      setColumnId(c.columnId || "");
      setGroupId(c.groupId || "");
      setDueAt(c.dueAt ? c.dueAt.slice(0, 16) : "");
      setSelectedLabels(c.labelAssignments?.map((la: any) => la.labelId) || []);
      setSelectedAssignees(c.assignees?.map((a: any) => a.membershipId) || []);
      setChecklist(c.checklistItems || []);
      setAttachments(c.attachments || []);
      setComments(c.comments || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải chi tiết thẻ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề thẻ");
      return;
    }

    setSaving(true);
    try {
      if (isEditing) {
        const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            columnId,
            groupId: groupId || null,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            assigneeMembershipIds: selectedAssignees,
            labelIds: selectedLabels,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Cập nhật thất bại");
        toast.success("Cập nhật thẻ thành công!");
      } else {
        const res = await fetch(`/api/rooms/${roomId}/cards`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            columnId,
            groupId: groupId || null,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            assigneeMembershipIds: selectedAssignees,
            labelIds: selectedLabels,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Tạo thẻ thất bại");
        toast.success("Tạo thẻ mới thành công!");
      }

      onCardUpdated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi lưu thẻ");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCard = async () => {
    if (!cardId || !confirm("Bạn có chắc muốn xóa thẻ công việc này?")) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa thẻ thất bại");

      toast.success("Đã xóa thẻ công việc!");
      onCardUpdated?.();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa thẻ");
    }
  };

  const handleAddChecklist = async () => {
    if (!newChecklistText.trim() || !cardId) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newChecklistText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thêm checklist thất bại");

      setChecklist([...checklist, data.item]);
      setNewChecklistText("");
      onCardUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm checklist");
    }
  };

  const handleToggleChecklist = async (itemId: string, currentStatus: boolean) => {
    if (!cardId) return;
    const nextStatus = !currentStatus;

    setChecklist(checklist.map((i) => (i.id === itemId ? { ...i, isCompleted: nextStatus } : i)));

    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, isCompleted: nextStatus }),
      });
      if (!res.ok) throw new Error();
      onCardUpdated?.();
    } catch {
      // rollback
      setChecklist(checklist.map((i) => (i.id === itemId ? { ...i, isCompleted: currentStatus } : i)));
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    if (!cardId) return;
    try {
      await fetch(`/api/rooms/${roomId}/cards/${cardId}/checklist?itemId=${itemId}`, {
        method: "DELETE",
      });
      setChecklist(checklist.filter((i) => i.id !== itemId));
      onCardUpdated?.();
    } catch (err) {
      toast.error("Lỗi xóa mục checklist");
    }
  };

  const handleUploadCardFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !cardId) return;
    setUploadingAttachments(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    try {
      const uploadRes = await fetch(`/api/rooms/${roomId}/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || "Tải tệp lên thất bại");

      const urls: string[] = uploadData.urls || [];
      for (let i = 0; i < urls.length; i++) {
        const file = files[i];
        const attachRes = await fetch(`/api/rooms/${roomId}/cards/${cardId}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: file?.name || `Tệp đính kèm ${i + 1}`,
            url: urls[i],
            size: file?.size || null,
            type: file?.type || null,
          }),
        });
        const attachData = await attachRes.json();
        if (attachRes.ok && attachData.attachment) {
          setAttachments((prev) => [attachData.attachment, ...prev]);
        }
      }

      toast.success(`Đã thêm ${urls.length} tệp đính kèm thành công!`);
      onCardUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi thêm tệp đính kèm");
    } finally {
      setUploadingAttachments(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!cardId) return;
    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}/attachments?attachmentId=${attachmentId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa tệp thất bại");

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Đã xóa tệp đính kèm");
      onCardUpdated?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa tệp");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !cardId) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: newCommentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gửi bình luận thất bại");

      setComments([...comments, data.comment]);
      setNewCommentText("");
    } catch (err: any) {
      toast.error(err.message || "Lỗi gửi bình luận");
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId) ? prev.filter((id) => id !== labelId) : [...prev, labelId]
    );
  };

  const toggleAssignee = (membershipId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(membershipId) ? prev.filter((id) => id !== membershipId) : [...prev, membershipId]
    );
  };

  const completedChecklistCount = checklist.filter((i) => i.isCompleted).length;
  const checklistPercent = checklist.length > 0 ? Math.round((completedChecklistCount / checklist.length) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl p-6 bg-card border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs">Đang tải thẻ công việc...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-5">
            <DialogHeader className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  {isEditing ? "Chi tiết thẻ công việc" : "Tạo thẻ mới"}
                </span>
                {isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteCard}
                    className="h-8 px-2 text-xs text-destructive hover:bg-destructive/10 gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa thẻ
                  </Button>
                )}
              </div>
              <Input
                placeholder="Nhập tiêu đề công việc..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="text-base font-bold h-11 rounded-xl border-border bg-background"
              />
            </DialogHeader>

            {/* Grid properties: Column, Group, Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-muted/40 border border-border">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <MoveRight className="w-3 h-3" />
                  Cột công việc
                </label>
                <select
                  value={columnId}
                  onChange={(e) => setColumnId(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background"
                >
                  {columns.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Gắn nhóm (tùy chọn)
                </label>
                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background"
                >
                  <option value="">(Toàn phòng)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Hạn hoàn thành
                </label>
                <input
                  type="datetime-local"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  className="w-full h-8 px-2 text-xs rounded-lg border border-border bg-background"
                />
              </div>
            </div>

            {/* Pastel Labels */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                Nhãn màu sắc
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {labels.map((lbl) => {
                  const isSelected = selectedLabels.includes(lbl.id);
                  return (
                    <button
                      key={lbl.id}
                      type="button"
                      onClick={() => toggleLabel(lbl.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary"
                          : "bg-muted/80 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {lbl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Assignees */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                Người phụ trách
              </label>
              <div className="flex flex-wrap items-center gap-1.5">
                {members.map((m) => {
                  const isAssigned = selectedAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleAssignee(m.id)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                        isAssigned
                          ? "bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted border border-transparent"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      {m.name}
                      {isAssigned && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Mô tả chi tiết
              </label>
              <textarea
                placeholder="Ghi chú các yêu cầu, liên kết tài liệu hoặc hướng dẫn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            {/* Checklist section (for existing card) */}
            {isEditing && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" />
                    Danh sách công việc (Checklist)
                  </label>
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    {completedChecklistCount}/{checklist.length} ({checklistPercent}%)
                  </span>
                </div>

                {checklist.length > 0 && (
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${checklistPercent}%` }}
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={() => handleToggleChecklist(item.id, item.isCompleted)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                        />
                        <span
                          className={`text-xs truncate select-none ${
                            item.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {item.text}
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Thêm mục checklist mới..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddChecklist();
                      }
                    }}
                    className="h-8 text-xs rounded-lg border-border bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddChecklist}
                    className="h-8 px-3 text-xs gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm
                  </Button>
                </div>
              </div>
            )}

            {/* Attachments section (for existing card) */}
            {isEditing && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Tệp & Ảnh đính kèm ({attachments.length})
                  </label>

                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleUploadCardFiles(e.target.files)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingAttachments}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-7 px-2.5 text-xs gap-1 border-dashed border-primary/40 hover:border-primary"
                    >
                      {uploadingAttachments ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin text-primary" />
                          <span>Đang tải lên...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3 h-3 text-primary" />
                          <span>Tải nhiều tệp/ảnh</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {attachments.map((att) => {
                      const isImg =
                        att.type?.startsWith("image/") ||
                        att.url.match(/\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i);

                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between gap-2 p-2 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border transition-colors group"
                        >
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 min-w-0 flex-1"
                          >
                            {isImg ? (
                              <img
                                src={att.url}
                                alt={att.name}
                                className="w-8 h-8 rounded-lg object-cover border border-border shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Paperclip className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate group-hover:text-primary">
                                {att.name}
                              </p>
                              {att.size && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  {(att.size / 1024).toFixed(0)} KB
                                </p>
                              )}
                            </div>
                          </a>

                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 rounded text-muted-foreground hover:text-foreground"
                              title="Mở tệp"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleDeleteAttachment(att.id)}
                              className="p-1 rounded text-muted-foreground hover:text-destructive"
                              title="Xóa tệp"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Comments Thread (for existing card) */}
            {isEditing && (
              <div className="space-y-3 pt-2 border-t border-border">
                <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Bình luận & Thảo luận ({comments.length})
                </label>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">Chưa có bình luận nào trên thẻ này.</p>
                  ) : (
                    comments.map((cm) => (
                      <div key={cm.id} className="p-2.5 rounded-xl bg-muted/30 border border-border space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-foreground">{cm.author?.name || "Thành viên"}</span>
                          <span className="text-muted-foreground text-[10px]">
                            {new Date(cm.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                            {new Date(cm.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap">{cm.body}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Viết bình luận cho thẻ này..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddComment(e);
                      }
                    }}
                    className="h-8 text-xs rounded-lg border-border bg-background"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddComment}
                    className="h-8 px-3 text-xs gap-1 bg-primary text-primary-foreground"
                  >
                    <Send className="w-3 h-3" />
                    Gửi
                  </Button>
                </div>
              </div>
            )}

            {/* Form actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-4 text-xs">
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    {isEditing ? "Lưu thay đổi" : "Tạo thẻ công việc"}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
