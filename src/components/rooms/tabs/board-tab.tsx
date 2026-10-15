"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Calendar,
  CheckSquare,
  MessageSquare,
  Users,
  Tag,
  ArrowRight,
  MoreHorizontal,
  MoveRight,
  Loader2,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { CardDetailModal } from "../modals/card-detail-modal";

interface Column {
  id: string;
  name: string;
  key: string;
  color?: string | null;
  sortOrder: number;
}

interface Card {
  id: string;
  roomId: string;
  columnId: string;
  columnName: string;
  columnKey: string;
  groupId?: string | null;
  group?: { id: string; name: string; color: string | null } | null;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  sortOrder: number;
  isCompleted: boolean;
  assignees: Array<{ membershipId: string; userId: string; name: string; image?: string | null }>;
  labels: Array<{ id: string; name: string; color: string }>;
  checklistProgress: { total: number; completed: number };
  commentsCount: number;
  attachmentsCount: number;
}

interface BoardTabProps {
  roomId: string;
  columns: Column[];
  groups: Array<{ id: string; name: string; color: string | null }>;
  labels: Array<{ id: string; name: string; color: string }>;
  members: Array<{ id: string; userId: string; name: string; image?: string | null }>;
  isAdmin: boolean;
  isHost: boolean;
  currentUserId: string;
  onBoardChanged?: () => void;
}

export function BoardTab({
  roomId,
  columns,
  groups,
  labels,
  members,
  isAdmin,
  isHost,
  currentUserId,
  onBoardChanged,
}: BoardTabProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // Modals state
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [modalColumnId, setModalColumnId] = useState<string | undefined>(undefined);
  const [showCardModal, setShowCardModal] = useState(false);

  // Inline quick-add per column
  const [quickAddColumnId, setQuickAddColumnId] = useState<string | null>(null);
  const [quickAddTitle, setQuickAddTitle] = useState("");
  const [creatingQuickCard, setCreatingQuickCard] = useState(false);

  // Moving state
  const [movingCardId, setMovingCardId] = useState<string | null>(null);

  const fetchCards = async () => {
    setLoading(true);
    try {
      let url = `/api/rooms/${roomId}/cards?`;
      if (selectedGroupId) url += `groupId=${selectedGroupId}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải thẻ");
      setCards(data.cards || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải bảng công việc");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [roomId, selectedGroupId, search]);

  const handleQuickAdd = async (columnId: string) => {
    if (!quickAddTitle.trim()) return;

    setCreatingQuickCard(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: quickAddTitle.trim(),
          columnId,
          groupId: selectedGroupId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tạo thẻ thất bại");

      toast.success("Đã thêm thẻ mới!");
      setQuickAddTitle("");
      setQuickAddColumnId(null);
      fetchCards();
      onBoardChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo thẻ");
    } finally {
      setCreatingQuickCard(false);
    }
  };

  const handleMoveCard = async (cardId: string, targetColumnId: string) => {
    setMovingCardId(cardId);
    try {
      const res = await fetch(`/api/rooms/${roomId}/cards/${cardId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetColumnId,
          newSortOrder: 9999, // append to end
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể di chuyển");

      toast.success("Đã di chuyển thẻ công việc!");
      fetchCards();
      onBoardChanged?.();
    } catch (err: any) {
      toast.error(err.message || "Lỗi di chuyển thẻ");
    } finally {
      setMovingCardId(null);
    }
  };

  const openCardDetail = (cardId: string) => {
    setActiveCardId(cardId);
    setShowCardModal(true);
  };

  const openNewCardModal = (colId: string) => {
    setActiveCardId(null);
    setModalColumnId(colId);
    setShowCardModal(true);
  };

  const isOverdue = (dueAt?: string | null, isCompleted?: boolean) => {
    if (!dueAt || isCompleted) return false;
    return new Date(dueAt) < new Date();
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thẻ công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-background border-border"
            />
          </div>

          {groups.length > 0 && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-border bg-background text-foreground"
            >
              <option value="">Tất cả nhóm</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  Nhóm: {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
          <span>Tổng số: <strong>{cards.length}</strong> thẻ</span>
        </div>
      </div>

      {/* Kanban Board Container (Trello-inspired horizontal columns) */}
      <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none">
        {columns.map((column) => {
          const columnCards = cards.filter((c) => c.columnId === column.id);

          return (
            <div
              key={column.id}
              className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[78vh] rounded-2xl bg-muted/40 border border-border/80 shadow-xs snap-start"
            >
              {/* Column Header */}
              <div className="p-3.5 flex items-center justify-between border-b border-border/60">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    {column.name}
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-background font-semibold text-muted-foreground border border-border">
                    {columnCards.length}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => openNewCardModal(column.id)}
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                  title="Thêm thẻ mới"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Cards List */}
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 pr-1.5">
                {columnCards.map((card) => {
                  const overdue = isOverdue(card.dueAt, card.isCompleted);

                  return (
                    <div
                      key={card.id}
                      onClick={() => openCardDetail(card.id)}
                      className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group"
                    >
                      {/* Labels and Group badge */}
                      {(card.labels.length > 0 || card.group) && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {card.group && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                              {card.group.name}
                            </span>
                          )}
                          {card.labels.map((lbl) => (
                            <span
                              key={lbl.id}
                              className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-muted text-muted-foreground"
                            >
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Card Title */}
                      <p className="text-xs font-semibold text-foreground leading-snug line-clamp-3">
                        {card.title}
                      </p>

                      {/* Badges: Due date, Checklist, Comments */}
                      <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/40">
                        <div className="flex items-center gap-2.5">
                          {card.dueAt && (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                overdue
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Calendar className="w-3 h-3" />
                              {new Date(card.dueAt).toLocaleDateString([], { month: "numeric", day: "numeric" })}
                            </span>
                          )}

                          {card.checklistProgress.total > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                              <CheckSquare className="w-3 h-3" />
                              {card.checklistProgress.completed}/{card.checklistProgress.total}
                            </span>
                          )}

                          {card.commentsCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px]">
                              <MessageSquare className="w-3 h-3" />
                              {card.commentsCount}
                            </span>
                          )}
                        </div>

                        {/* Assignee Avatars */}
                        <div className="flex items-center -space-x-1.5">
                          {card.assignees.map((a) => (
                            <div
                              key={a.membershipId}
                              title={a.name}
                              className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[9px] font-bold flex items-center justify-center border-2 border-card"
                            >
                              {a.name.charAt(0).toUpperCase()}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Quick Move Selector (touch friendly for mobile & fast click on desktop) */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="pt-1.5 flex items-center justify-between text-[11px] text-muted-foreground"
                      >
                        <span className="text-[10px] text-muted-foreground/70">Chuyển:</span>
                        <select
                          value=""
                          onChange={(e) => {
                            if (e.target.value) handleMoveCard(card.id, e.target.value);
                          }}
                          className="h-6 px-1.5 text-[10px] rounded border border-border bg-background text-foreground"
                        >
                          <option value="">Di chuyển...</option>
                          {columns
                            .filter((c) => c.id !== column.id)
                            .map((targetCol) => (
                              <option key={targetCol.id} value={targetCol.id}>
                                → {targetCol.name}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {/* Inline Quick Add Form */}
                {quickAddColumnId === column.id ? (
                  <div className="p-3 rounded-xl bg-card border border-primary/40 space-y-2 shadow-xs">
                    <Input
                      placeholder="Nhập tiêu đề thẻ..."
                      value={quickAddTitle}
                      autoFocus
                      onChange={(e) => setQuickAddTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleQuickAdd(column.id);
                        } else if (e.key === "Escape") {
                          setQuickAddColumnId(null);
                        }
                      }}
                      className="h-8 text-xs bg-background"
                    />
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        disabled={creatingQuickCard || !quickAddTitle.trim()}
                        onClick={() => handleQuickAdd(column.id)}
                        className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground"
                      >
                        {creatingQuickCard ? <Loader2 className="w-3 h-3 animate-spin" /> : "Thêm thẻ"}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuickAddColumnId(null)}
                        className="h-7 px-2 text-xs"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setQuickAddColumnId(column.id);
                      setQuickAddTitle("");
                    }}
                    className="w-full h-8 text-xs text-muted-foreground hover:text-foreground justify-start gap-1.5 rounded-xl hover:bg-muted"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm thẻ...
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Card detail / modal */}
      <CardDetailModal
        open={showCardModal}
        onClose={() => setShowCardModal(false)}
        roomId={roomId}
        cardId={activeCardId}
        initialColumnId={modalColumnId}
        columns={columns}
        groups={groups}
        labels={labels}
        members={members}
        currentUserId={currentUserId}
        onCardUpdated={() => {
          fetchCards();
          onBoardChanged?.();
        }}
      />
    </div>
  );
}
