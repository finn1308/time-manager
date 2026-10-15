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
  Columns,
  UserCheck,
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

const getLabelColorClass = (color?: string | null) => {
  switch (color) {
    case "rose":
      return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30";
    case "amber":
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30";
    case "mint":
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30";
    case "sky":
      return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30";
    case "lavender":
      return "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30";
    case "peach":
      return "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30";
    default:
      return "bg-primary/10 text-primary border border-primary/20";
  }
};

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
  const [viewGrouping, setViewGrouping] = useState<"status" | "member">("status");

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

  const handleQuickAdd = async (columnId: string, assigneeMembershipId?: string) => {
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
          assigneeMembershipIds: assigneeMembershipId ? [assigneeMembershipId] : [],
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

  // Render a single Trello-style card
  const renderCardItem = (card: Card, currentColumnId: string) => {
    const overdue = isOverdue(card.dueAt, card.isCompleted);
    const isAllChecklistDone =
      card.checklistProgress.total > 0 &&
      card.checklistProgress.completed === card.checklistProgress.total;

    return (
      <div
        key={card.id}
        onClick={() => openCardDetail(card.id)}
        className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2.5 group select-none"
      >
        {/* Labels and Group badge with authentic Trello pastel colors */}
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
                className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${getLabelColorClass(lbl.color)}`}
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
          <div className="flex items-center gap-2">
            {card.dueAt && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  overdue
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30"
                    : card.isCompleted
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "text-muted-foreground bg-muted/60"
                }`}
              >
                <Calendar className="w-3 h-3" />
                {new Date(card.dueAt).toLocaleDateString([], { month: "numeric", day: "numeric" })}
              </span>
            )}

            {card.checklistProgress.total > 0 && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isAllChecklistDone
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30"
                    : "bg-muted/60 text-muted-foreground"
                }`}
              >
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

        {/* Quick Move Selector (touch friendly & fast) */}
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
              .filter((c) => c.id !== currentColumnId)
              .map((targetCol) => (
                <option key={targetCol.id} value={targetCol.id}>
                  → {targetCol.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thẻ công việc..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl bg-background border-border"
            />
          </div>

          {/* Group Filter */}
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

          {/* View Grouping: By Status vs By Member */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setViewGrouping("status")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewGrouping === "status"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Trạng thái</span>
            </button>
            <button
              type="button"
              onClick={() => setViewGrouping("member")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                viewGrouping === "member"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Theo cá nhân</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-muted-foreground">
          <span>
            Tổng số: <strong>{cards.length}</strong> thẻ
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-xs font-medium">Đang tải bảng công việc...</p>
        </div>
      ) : viewGrouping === "member" ? (
        /* ============================================================== */
        /* VIEW 1: GROUP BY MEMBER — MỖI CÁ NHÂN LÀ MỘT Ô CƠ SỞ          */
        /* ============================================================== */
        <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none scrollbar-thin">
          {members.map((member) => {
            const memberCards = cards.filter((c) =>
              c.assignees.some((a) => a.userId === member.userId)
            );
            const isMe = member.userId === currentUserId;
            const defaultColumnId = columns[0]?.id;

            return (
              <div
                key={member.id}
                className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[78vh] rounded-2xl bg-muted/40 border border-border/80 shadow-xs snap-start"
              >
                {/* Column Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-muted/20 rounded-t-2xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-foreground">
                        {member.name} {isMe && <span className="text-[10px] text-primary">(Tôi)</span>}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {memberCards.length} thẻ phụ trách
                      </span>
                    </div>
                  </div>

                  {defaultColumnId && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openNewCardModal(defaultColumnId)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Thêm thẻ cho thành viên này"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Cards List */}
                <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 pr-1.5 scrollbar-thin">
                  {memberCards.map((card) => renderCardItem(card, card.columnId))}

                  {memberCards.length === 0 && (
                    <div className="py-8 text-center rounded-xl bg-card/60 border border-dashed border-border/80 p-4 space-y-1">
                      <p className="text-xs font-medium text-foreground">Chưa có nhiệm vụ</p>
                      <p className="text-[11px] text-muted-foreground">
                        Thành viên này chưa được giao nhiệm vụ nào
                      </p>
                    </div>
                  )}

                  {defaultColumnId && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => openNewCardModal(defaultColumnId)}
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground justify-start gap-1.5 rounded-xl hover:bg-muted"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Giao thẻ mới...
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Unassigned Cards Column */}
          {cards.some((c) => c.assignees.length === 0) && (
            <div className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[78vh] rounded-2xl bg-muted/40 border border-border/80 shadow-xs snap-start">
              <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-muted/20 rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Chưa phân công
                  </h4>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-background font-semibold text-muted-foreground border border-border">
                    {cards.filter((c) => c.assignees.length === 0).length}
                  </span>
                </div>
              </div>
              <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 pr-1.5 scrollbar-thin">
                {cards
                  .filter((c) => c.assignees.length === 0)
                  .map((card) => renderCardItem(card, card.columnId))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW 2: GROUP BY STATUS (TRUYỀN THỐNG TRELLO KANBAN)          */
        /* ============================================================== */
        <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none scrollbar-thin">
          {columns.map((column) => {
            const columnCards = cards.filter((c) => c.columnId === column.id);

            return (
              <div
                key={column.id}
                className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[78vh] rounded-2xl bg-muted/40 border border-border/80 shadow-xs snap-start"
              >
                {/* Column Header */}
                <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-muted/20 rounded-t-2xl">
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
                <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 pr-1.5 scrollbar-thin">
                  {columnCards.map((card) => renderCardItem(card, column.id))}

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
                          {creatingQuickCard ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Thêm thẻ"
                          )}
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
      )}

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
