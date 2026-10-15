"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Image as ImageIcon,
  Paperclip,
  Trash2,
  Users,
  Clock,
  Sparkles,
  Loader2,
  ExternalLink,
  MessageSquare,
  Plus,
  Search,
  Tag,
  Check,
  Columns,
  LayoutGrid,
  UserCheck,
  CheckSquare,
  Calendar,
  X,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Upload,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";
import { CardDetailModal } from "../modals/card-detail-modal";

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
  author: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  group?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  isOwner: boolean;
  canDelete: boolean;
}

interface MemberItem {
  id: string;
  userId: string;
  name: string;
  email?: string;
  image?: string | null;
  role?: string;
}

interface TaskCardItem {
  id: string;
  roomId: string;
  columnId: string;
  columnName: string;
  columnKey: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  isCompleted: boolean;
  assignees: Array<{ membershipId: string; userId: string; name: string; image?: string | null }>;
  labels: Array<{ id: string; name: string; color: string }>;
  checklistProgress: { total: number; completed: number };
  commentsCount: number;
  attachmentsCount: number;
}

interface PersonalTabProps {
  roomId: string;
  groups: Array<{ id: string; name: string; color?: string | null }>;
  members?: MemberItem[];
  columns?: Array<{ id: string; name: string; key: string; color?: string | null }>;
  labels?: Array<{ id: string; name: string; color: string }>;
  isAdmin?: boolean;
  isHost?: boolean;
  currentUserId: string;
  currentUser?: { id: string; name: string | null; email: string };
  mustChangePassword?: boolean;
  onOpenMembers?: () => void;
}

const PRESET_TAGS = [
  { name: "Tiến độ", color: "mint" },
  { name: "Ghi chú", color: "sky" },
  { name: "Ý tưởng", color: "lavender" },
  { name: "Tài liệu", color: "amber" },
  { name: "Cần hỗ trợ", color: "rose" },
];

const getTagColorClass = (color?: string | null) => {
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

const getRoleBadge = (role?: string) => {
  switch (role) {
    case "ADMIN":
      return {
        label: "Admin",
        className: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "HOST":
      return {
        label: "Host",
        className: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      };
    default:
      return {
        label: "Thành viên",
        className: "bg-muted text-muted-foreground border-border",
      };
  }
};

// Multi-Image Gallery component with responsive layout (1, 2, 3, 4, 6+ images) and click to view lightbox
function MultiImageGallery({
  images,
  onImageClick,
}: {
  images: string[];
  onImageClick: (index: number) => void;
}) {
  if (!images || images.length === 0) return null;

  const count = images.length;

  if (count === 1) {
    return (
      <div
        onClick={() => onImageClick(0)}
        className="relative group rounded-xl overflow-hidden border border-border/60 max-h-56 bg-muted/30 cursor-pointer"
      >
        <img
          src={images[0]}
          alt="Ảnh đính kèm"
          className="w-full h-full max-h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="p-1.5 rounded-full bg-black/60 text-white text-xs backdrop-blur-xs">
            <Maximize2 className="w-4 h-4" />
          </span>
        </div>
      </div>
    );
  }

  if (count === 2) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-border/60">
        {images.map((url, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick(idx)}
            className="relative group h-32 sm:h-36 bg-muted/30 overflow-hidden cursor-pointer"
          >
            <img
              src={url}
              alt={`Ảnh ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="p-1.5 rounded-full bg-black/60 text-white text-xs backdrop-blur-xs">
                <Maximize2 className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden border border-border/60">
        {images.map((url, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick(idx)}
            className="relative group h-24 sm:h-28 bg-muted/30 overflow-hidden cursor-pointer"
          >
            <img
              src={url}
              alt={`Ảnh ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="p-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-xs">
                <Maximize2 className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (count === 4) {
    return (
      <div className="grid grid-cols-2 gap-1.5 rounded-xl overflow-hidden border border-border/60">
        {images.map((url, idx) => (
          <div
            key={idx}
            onClick={() => onImageClick(idx)}
            className="relative group h-28 bg-muted/30 overflow-hidden cursor-pointer"
          >
            <img
              src={url}
              alt={`Ảnh ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="p-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-xs">
                <Maximize2 className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // 5, 6, or more images: 3 columns grid (perfect 2 rows of 3 for 6 images)
  const displayImages = images.slice(0, 6);
  const remaining = images.length - 6;

  return (
    <div className="grid grid-cols-3 gap-1.5 rounded-xl overflow-hidden border border-border/60">
      {displayImages.map((url, idx) => {
        const isLastAndExtra = idx === 5 && remaining > 0;
        return (
          <div
            key={idx}
            onClick={() => onImageClick(idx)}
            className="relative group h-24 bg-muted/30 overflow-hidden cursor-pointer"
          >
            <img
              src={url}
              alt={`Ảnh ${idx + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {isLastAndExtra ? (
              <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center font-bold text-white text-sm">
                +{remaining}
              </div>
            ) : (
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <span className="p-1 rounded-full bg-black/60 text-white text-xs backdrop-blur-xs">
                  <Maximize2 className="w-3 h-3" />
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PersonalTab({
  roomId,
  groups,
  members = [],
  columns = [],
  labels = [],
  isAdmin = false,
  isHost = false,
  currentUserId,
  currentUser,
  mustChangePassword,
  onOpenMembers,
}: PersonalTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [cards, setCards] = useState<TaskCardItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [viewMode, setViewMode] = useState<"columns" | "my" | "grid">("columns");
  const [itemTypeFilter, setItemTypeFilter] = useState<"all" | "posts" | "tasks">("all");

  // Inline Quick-Add per Member Column
  const [quickAddAuthorId, setQuickAddAuthorId] = useState<string | null>(null);
  const [quickAddContent, setQuickAddContent] = useState("");
  const [quickAddTag, setQuickAddTag] = useState<string>("");
  const [quickAddImageUrl, setQuickAddImageUrl] = useState("");
  const [quickAddImageUrls, setQuickAddImageUrls] = useState<string[]>([]);
  const [quickAddAttachmentUrl, setQuickAddAttachmentUrl] = useState("");
  const [quickAddAttachmentName, setQuickAddAttachmentName] = useState("");
  const [showQuickAttach, setShowQuickAttach] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fullscreen Lightbox state
  const [lightboxData, setLightboxData] = useState<{ images: string[]; index: number } | null>(null);

  // Card detail modal state (for task cards)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);

  // Lightbox keyboard navigation
  useEffect(() => {
    if (!lightboxData) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLightboxData(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxData((prev) =>
          prev ? { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length } : null
        );
      } else if (e.key === "ArrowRight") {
        setLightboxData((prev) =>
          prev ? { ...prev, index: (prev.index + 1) % prev.images.length } : null
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxData]);

  const fetchPostsAndCards = async () => {
    setLoading(true);
    try {
      const [postsRes, cardsRes] = await Promise.all([
        fetch(`/api/rooms/${roomId}/posts`),
        fetch(`/api/rooms/${roomId}/cards`),
      ]);

      const [postsData, cardsData] = await Promise.all([
        postsRes.json(),
        cardsRes.json(),
      ]);

      if (postsRes.ok) {
        setPosts(postsData.posts || []);
      }
      if (cardsRes.ok) {
        setCards(cardsData.cards || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải dữ liệu cá nhân");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostsAndCards();
  }, [roomId]);

  // Ensure members list includes current user at the top
  const displayMembers = useMemo(() => {
    const list = [...members];
    // If members empty, create entry for current user
    if (list.length === 0) {
      list.push({
        id: "me",
        userId: currentUserId,
        name: currentUser?.name || "Tôi",
        email: currentUser?.email,
        role: isAdmin ? "ADMIN" : "MEMBER",
      });
      return list;
    }

    // Sort so current user is always first
    return list.sort((a, b) => {
      if (a.userId === currentUserId) return -1;
      if (b.userId === currentUserId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [members, currentUserId, currentUser, isAdmin]);

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingFiles(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }
    try {
      const res = await fetch(`/api/rooms/${roomId}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Tải ảnh lên thất bại");
      if (data.urls && data.urls.length > 0) {
        setQuickAddImageUrls((prev) => [...prev, ...data.urls]);
        toast.success(`Đã tải lên ${data.urls.length} ảnh thành công!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải ảnh lên");
    } finally {
      setUploadingFiles(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleQuickAdd = async (authorUserId: string) => {
    if (!quickAddContent.trim()) return;

    if (mustChangePassword) {
      toast.error("Vui lòng đổi mật khẩu tạm trước khi tạo thẻ cá nhân.");
      return;
    }

    setSubmitting(true);
    try {
      // Include tag prefix if selected
      const finalContent = quickAddTag
        ? `[${quickAddTag}] ${quickAddContent.trim()}`
        : quickAddContent.trim();

      const allImages = [...quickAddImageUrls];
      if (quickAddImageUrl.trim() && !allImages.includes(quickAddImageUrl.trim())) {
        allImages.push(quickAddImageUrl.trim());
      }

      const res = await fetch(`/api/rooms/${roomId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: finalContent,
          groupId: selectedGroupId || null,
          imageUrl: allImages.length > 0 ? allImages[0] : null,
          imageUrls: allImages,
          attachmentUrl: quickAddAttachmentUrl.trim() || null,
          attachmentName: quickAddAttachmentName.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thêm thẻ thất bại");

      toast.success("Đã thêm thẻ cá nhân thành công!");
      setQuickAddContent("");
      setQuickAddTag("");
      setQuickAddImageUrl("");
      setQuickAddImageUrls([]);
      setQuickAddAttachmentUrl("");
      setQuickAddAttachmentName("");
      setShowQuickAttach(false);
      setQuickAddAuthorId(null);
      fetchPostsAndCards();
    } catch (err: any) {
      toast.error(err.message || "Lỗi tạo thẻ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc muốn xóa thẻ cá nhân này?")) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/posts/${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa thất bại");

      toast.success("Đã xóa thẻ cá nhân");
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa bài");
    }
  };

  // Filter items by search, group, and item type
  const filterPost = (p: Post) => {
    if (itemTypeFilter === "tasks") return false;
    if (selectedGroupId && p.group?.id !== selectedGroupId) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const contentMatch = p.content.toLowerCase().includes(q);
      const authorMatch = p.author.name?.toLowerCase().includes(q);
      return contentMatch || authorMatch;
    }
    return true;
  };

  const filterTask = (c: TaskCardItem) => {
    if (itemTypeFilter === "posts") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const titleMatch = c.title.toLowerCase().includes(q);
      const descMatch = c.description?.toLowerCase().includes(q);
      return titleMatch || descMatch;
    }
    return true;
  };

  // Parse tag from content if prefixed with [Tag]
  const extractTagAndContent = (content: string) => {
    const match = content.match(/^\[(.*?)\]\s*([\s\S]*)$/);
    if (match) {
      return { tag: match[1], cleanContent: match[2] };
    }
    return { tag: null, cleanContent: content };
  };

  // Count total cards for stats
  const totalItemsCount = useMemo(() => {
    const validPosts = posts.filter(filterPost);
    const validTasks = cards.filter(filterTask);
    return validPosts.length + validTasks.length;
  }, [posts, cards, search, selectedGroupId, itemTypeFilter]);

  return (
    <div className="space-y-4">
      {/* Trello Board Top Bar: Search, Group Filter, View Toggle, Quick Add */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm thẻ / ghi chú cá nhân..."
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

          {/* Item Type Filter */}
          <div className="flex items-center p-0.5 bg-muted/60 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setItemTypeFilter("all")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                itemTypeFilter === "all"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => setItemTypeFilter("posts")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                itemTypeFilter === "posts"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Cập nhật
            </button>
            <button
              type="button"
              onClick={() => setItemTypeFilter("tasks")}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                itemTypeFilter === "tasks"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Nhiệm vụ
            </button>
          </div>
        </div>

        {/* View Mode Toggle & Primary Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border">
            <button
              type="button"
              title="Bảng Trello (Mỗi cá nhân 1 ô cơ sở)"
              onClick={() => setViewMode("columns")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === "columns"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Bảng cá nhân</span>
            </button>
            <button
              type="button"
              title="Chỉ cá nhân tôi"
              onClick={() => setViewMode("my")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === "my"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Của tôi</span>
            </button>
            <button
              type="button"
              title="Dạng lưới thẻ"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                viewMode === "grid"
                  ? "bg-background text-primary shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden md:inline text-[11px]">Lưới</span>
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={() => {
              setQuickAddAuthorId(currentUserId);
              setQuickAddContent("");
              setShowQuickAttach(false);
            }}
            className="h-8 px-3 text-xs font-semibold bg-primary text-primary-foreground rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm thẻ</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-xs font-medium">Đang chuẩn bị bảng cá nhân kiểu Trello...</p>
        </div>
      ) : viewMode === "grid" ? (
        /* ============================================================== */
        /* VIEW MODE 1: GRID OF CARDS                                      */
        /* ============================================================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {posts.filter(filterPost).length === 0 && cards.filter(filterTask).length === 0 ? (
            <div className="col-span-full py-16 text-center rounded-2xl bg-card border border-border p-6 space-y-2">
              <p className="text-sm font-semibold text-foreground">Chưa có thẻ cá nhân nào</p>
              <p className="text-xs text-muted-foreground">
                Nhấn "Thêm thẻ" để tạo ghi chú hoặc cập nhật đầu tiên cho phòng họp!
              </p>
            </div>
          ) : (
            <>
              {posts.filter(filterPost).map((post) => {
                const { tag, cleanContent } = extractTagAndContent(post.content);
                const postImages = (post.imageUrls && post.imageUrls.length > 0)
                  ? post.imageUrls
                  : (post.imageUrl ? [post.imageUrl] : []);

                return (
                  <div
                    key={post.id}
                    className="p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-md transition-all space-y-2.5 group"
                  >
                    {/* Tags & Group */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {tag && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${getTagColorClass("sky")}`}>
                          {tag}
                        </span>
                      )}
                      {post.group && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          {post.group.name}
                        </span>
                      )}
                    </div>

                    {/* Image Cover / Multi-Image Gallery */}
                    {postImages.length > 0 && (
                      <MultiImageGallery
                        images={postImages}
                        onImageClick={(idx) => setLightboxData({ images: postImages, index: idx })}
                      />
                    )}

                    {/* Content */}
                    <p className="text-xs font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                      {cleanContent}
                    </p>

                    {/* Attachment Link */}
                    {post.attachmentUrl && (
                      <a
                        href={post.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 text-[11px] font-medium text-primary transition-colors"
                      >
                        <Paperclip className="w-3 h-3 shrink-0" />
                        <span className="truncate flex-1">{post.attachmentName || "Tài liệu đính kèm"}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                      </a>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                      <span className="text-[10px] flex items-center gap-1 font-mono text-muted-foreground/80">
                        <Clock className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                        - {new Date(post.createdAt).toLocaleDateString([], { month: "numeric", day: "numeric" })}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {post.canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Xóa thẻ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div
                          title={post.author.name || "Thành viên"}
                          className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/30"
                        >
                          {post.author.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        /* ============================================================== */
        /* VIEW MODE 2: TRELLO BOARD — MỖI CÁ NHÂN LÀ MỘT Ô CƠ SỞ (CỘT)  */
        /* ============================================================== */
        <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 snap-x select-none scrollbar-thin">
          {displayMembers
            .filter((member) => {
              if (viewMode === "my") {
                return member.userId === currentUserId;
              }
              return true;
            })
            .map((member) => {
              const isMe = member.userId === currentUserId;
              const roleBadge = getRoleBadge(member.role);

              // Member's posts
              const memberPosts = posts
                .filter((p) => p.author.id === member.userId)
                .filter(filterPost);

              // Member's assigned tasks
              const memberTasks = cards
                .filter((c) => c.assignees.some((a) => a.userId === member.userId))
                .filter(filterTask);

              const memberTotalItems = memberPosts.length + memberTasks.length;
              const isQuickAddOpen = quickAddAuthorId === member.userId;

              return (
                <div
                  key={member.id || member.userId}
                  className="w-72 sm:w-80 shrink-0 flex flex-col max-h-[78vh] rounded-2xl bg-muted/40 border border-border/80 shadow-xs snap-start"
                >
                  {/* Column Header: Member Info */}
                  <div className="p-3.5 flex items-center justify-between border-b border-border/60 bg-muted/20 rounded-t-2xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/30">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {member.name}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-primary/15 text-primary">
                              Tôi
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider border ${roleBadge.className}`}
                          >
                            {roleBadge.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {memberTotalItems} thẻ
                          </span>
                        </div>
                      </div>
                    </div>

                    {(isMe || isAdmin || isHost) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isQuickAddOpen) {
                            setQuickAddAuthorId(null);
                          } else {
                            setQuickAddAuthorId(member.userId);
                            setQuickAddContent("");
                            setShowQuickAttach(false);
                          }
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title={`Thêm thẻ cho ${member.name}`}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Cards List in Column */}
                  <div className="p-2.5 overflow-y-auto space-y-2.5 flex-1 pr-1.5 scrollbar-thin">
                    {/* Render Tasks assigned to this member */}
                    {memberTasks.map((card) => {
                      const isComplete =
                        card.checklistProgress.total > 0 &&
                        card.checklistProgress.completed === card.checklistProgress.total;

                      return (
                        <div
                          key={`task-${card.id}`}
                          onClick={() => {
                            setSelectedTaskId(card.id);
                            setShowCardModal(true);
                          }}
                          className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-2 group"
                        >
                          {/* Top Labels */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Nhiệm vụ: {card.columnName}
                            </span>
                            {card.labels.map((lbl) => (
                              <span
                                key={lbl.id}
                                className={`text-[9px] px-2 py-0.5 rounded font-semibold ${getTagColorClass(lbl.color)}`}
                              >
                                {lbl.name}
                              </span>
                            ))}
                          </div>

                          {/* Task Title */}
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {card.title}
                          </p>

                          {/* Badges: Due date & Checklist */}
                          <div className="flex items-center justify-between text-[11px] pt-1 text-muted-foreground border-t border-border/40">
                            <div className="flex items-center gap-2">
                              {card.dueAt && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-mono">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(card.dueAt).toLocaleDateString([], {
                                    month: "numeric",
                                    day: "numeric",
                                  })}
                                </span>
                              )}

                              {card.checklistProgress.total > 0 && (
                                <span
                                  className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                                    isComplete
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold"
                                      : ""
                                  }`}
                                >
                                  <CheckSquare className="w-3 h-3" />
                                  {card.checklistProgress.completed}/{card.checklistProgress.total}
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] text-primary group-hover:underline">
                              Chi tiết →
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Render Posts created by this member (e.g. "Xin chào") */}
                    {memberPosts.map((post) => {
                      const { tag, cleanContent } = extractTagAndContent(post.content);
                      const postImages = (post.imageUrls && post.imageUrls.length > 0)
                        ? post.imageUrls
                        : (post.imageUrl ? [post.imageUrl] : []);

                      return (
                        <div
                          key={`post-${post.id}`}
                          className="p-3.5 rounded-xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all space-y-2.5 group relative"
                        >
                          {/* Tags & Groups */}
                          {(tag || post.group) && (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {tag && (
                                <span
                                  className={`text-[9px] px-2 py-0.5 rounded-md font-semibold ${getTagColorClass(
                                    "sky"
                                  )}`}
                                >
                                  {tag}
                                </span>
                              )}
                              {post.group && (
                                <span className="text-[9px] px-2 py-0.5 rounded-md font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                  {post.group.name}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Image Cover / Multi-Image Gallery */}
                          {postImages.length > 0 && (
                            <MultiImageGallery
                              images={postImages}
                              onImageClick={(idx) => setLightboxData({ images: postImages, index: idx })}
                            />
                          )}

                          {/* Card Text Content (e.g. "Xin chào") */}
                          <p className="text-xs font-semibold text-foreground whitespace-pre-wrap leading-relaxed">
                            {cleanContent}
                          </p>

                          {/* Attachment Link Chip */}
                          {post.attachmentUrl && (
                            <a
                              href={post.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 border border-border/60 text-[11px] font-medium text-primary transition-colors"
                            >
                              <Paperclip className="w-3 h-3 shrink-0" />
                              <span className="truncate flex-1">
                                {post.attachmentName || "Tài liệu đính kèm"}
                              </span>
                              <ExternalLink className="w-3 h-3 shrink-0 text-muted-foreground" />
                            </a>
                          )}

                          {/* Card Footer: Timestamp, Author Avatar, Delete */}
                          <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground border-t border-border/40">
                            <span className="text-[10px] flex items-center gap-1 font-mono text-muted-foreground/80">
                              <Clock className="w-3 h-3" />
                              {new Date(post.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}{" "}
                              -{" "}
                              {new Date(post.createdAt).toLocaleDateString([], {
                                month: "numeric",
                                day: "numeric",
                              })}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {post.canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeletePost(post.id)}
                                  className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                  title="Xóa thẻ"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <div
                                title={post.author.name || "Thành viên"}
                                className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border border-primary/30"
                              >
                                {post.author.name?.charAt(0).toUpperCase() || "U"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Empty State for Column */}
                    {memberTotalItems === 0 && !isQuickAddOpen && (
                      <div className="py-8 text-center rounded-xl bg-card/60 border border-dashed border-border/80 p-4 space-y-1">
                        <p className="text-xs font-medium text-foreground">Chưa có thẻ nào</p>
                        <p className="text-[11px] text-muted-foreground">
                          Nhấn "+ Thêm thẻ" bên dưới để tạo thẻ mới cho {isMe ? "bạn" : member.name}
                        </p>
                      </div>
                    )}

                    {/* Inline Quick Add Form in this Column */}
                    {isQuickAddOpen ? (
                      <div className="p-3 rounded-xl bg-card border border-primary/40 space-y-2.5 shadow-xs">
                        {/* Quick Tag Selector */}
                        <div className="flex flex-wrap items-center gap-1 pb-1">
                          {PRESET_TAGS.map((t) => (
                            <button
                              key={t.name}
                              type="button"
                              onClick={() => setQuickAddTag(quickAddTag === t.name ? "" : t.name)}
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold transition-all ${
                                quickAddTag === t.name
                                  ? `${getTagColorClass(t.color)} ring-1 ring-primary`
                                  : "bg-muted text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </div>

                        <textarea
                          placeholder="Nhập nội dung thẻ (Enter để lưu)..."
                          value={quickAddContent}
                          autoFocus
                          rows={2}
                          onChange={(e) => setQuickAddContent(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleQuickAdd(member.userId);
                            } else if (e.key === "Escape") {
                              setQuickAddAuthorId(null);
                            }
                          }}
                          className="w-full px-2.5 py-2 text-xs rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                        />

                        {/* Selected Images Preview Strip (e.g. 6 uploaded photos) */}
                        {quickAddImageUrls.length > 0 && (
                          <div className="space-y-1.5 p-2 rounded-xl bg-muted/40 border border-border">
                            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                              <span>Đã chọn {quickAddImageUrls.length} ảnh:</span>
                              <button
                                type="button"
                                onClick={() => setQuickAddImageUrls([])}
                                className="text-destructive hover:underline text-[10px]"
                              >
                                Xóa tất cả
                              </button>
                            </div>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                              {quickAddImageUrls.map((url, i) => (
                                <div
                                  key={i}
                                  className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-background"
                                >
                                  <img src={url} alt="" className="w-full h-full object-cover" />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setQuickAddImageUrls((prev) => prev.filter((_, idx) => idx !== i))
                                    }
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive transition-colors"
                                    title="Xóa ảnh này"
                                  >
                                    <X className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Hidden file input for multi-image uploads */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                          className="hidden"
                          onChange={(e) => handleUploadFiles(e.target.files)}
                        />

                        {showQuickAttach && (
                          <div className="space-y-2 p-2.5 rounded-xl bg-muted/40 border border-border text-[11px]">
                            {/* Upload Multiple Images Button */}
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">Ảnh đính kèm:</span>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={uploadingFiles}
                                onClick={() => fileInputRef.current?.click()}
                                className="h-7 px-2.5 text-[11px] font-medium rounded-lg gap-1.5 border-dashed border-primary/40 hover:border-primary"
                              >
                                {uploadingFiles ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                                    <span>Đang tải ảnh...</span>
                                  </>
                                ) : (
                                  <>
                                    <Upload className="w-3.5 h-3.5 text-primary" />
                                    <span>Tải nhiều ảnh từ máy</span>
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Or add Image via URL */}
                            <div className="flex items-center gap-1.5">
                              <Input
                                placeholder="Hoặc dán URL ảnh (https://...)"
                                value={quickAddImageUrl}
                                onChange={(e) => setQuickAddImageUrl(e.target.value)}
                                className="h-7 text-[11px] bg-background flex-1"
                              />
                              {quickAddImageUrl.trim() && (
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    if (quickAddImageUrl.trim()) {
                                      setQuickAddImageUrls((prev) => [...prev, quickAddImageUrl.trim()]);
                                      setQuickAddImageUrl("");
                                    }
                                  }}
                                  className="h-7 px-2 text-[10px]"
                                >
                                  + Thêm
                                </Button>
                              )}
                            </div>

                            {/* Document attachment links */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
                              <Input
                                placeholder="Tên tài liệu"
                                value={quickAddAttachmentName}
                                onChange={(e) => setQuickAddAttachmentName(e.target.value)}
                                className="h-7 text-[11px] bg-background"
                              />
                              <Input
                                placeholder="Link tài liệu (URL)"
                                value={quickAddAttachmentUrl}
                                onChange={(e) => setQuickAddAttachmentUrl(e.target.value)}
                                className="h-7 text-[11px] bg-background"
                              />
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => setShowQuickAttach(!showQuickAttach)}
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            <Paperclip className="w-3 h-3" />
                            {showQuickAttach ? "Ẩn đính kèm" : "Thêm ảnh / Link"}
                          </button>

                          <div className="flex items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={submitting || !quickAddContent.trim()}
                              onClick={() => handleQuickAdd(member.userId)}
                              className="h-7 px-2.5 text-xs font-semibold bg-primary text-primary-foreground gap-1"
                            >
                              {submitting ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Plus className="w-3 h-3" />
                              )}
                              Thêm thẻ
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setQuickAddAuthorId(null);
                                setQuickAddContent("");
                                setShowQuickAttach(false);
                              }}
                              className="h-7 px-2 text-xs"
                            >
                              Hủy
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      (isMe || isAdmin || isHost) && (
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            setQuickAddAuthorId(member.userId);
                            setQuickAddContent("");
                            setShowQuickAttach(false);
                          }}
                          className="w-full h-8 text-xs text-muted-foreground hover:text-foreground justify-start gap-1.5 rounded-xl hover:bg-muted"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Thêm thẻ...
                        </Button>
                      )
                    )}
                  </div>
                </div>
              );
            })}

          {/* "+ Thêm thành viên" Column card at the end for Admin / Host */}
          {(isAdmin || isHost) && onOpenMembers && (
            <div
              onClick={onOpenMembers}
              className="w-72 sm:w-80 shrink-0 min-h-[160px] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-card/40 hover:bg-card flex flex-col items-center justify-center gap-2.5 p-6 cursor-pointer transition-all snap-start text-muted-foreground hover:text-foreground"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-foreground">Thêm thành viên mới</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mở rộng bảng làm việc cho phòng họp
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card Detail Modal when clicking on a task card */}
      <CardDetailModal
        open={showCardModal}
        onClose={() => setShowCardModal(false)}
        roomId={roomId}
        cardId={selectedTaskId}
        columns={columns}
        groups={groups.map((g) => ({ id: g.id, name: g.name, color: g.color || null }))}
        labels={labels}
        members={members}
        currentUserId={currentUserId}
        onCardUpdated={() => {
          fetchPostsAndCards();
        }}
      />

      {/* Fullscreen Lightbox Modal for multi-image viewing */}
      {lightboxData && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 select-none animate-in fade-in duration-150"
          onClick={() => setLightboxData(null)}
        >
          {/* Top Bar */}
          <div
            className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-3 py-1 rounded-full bg-white/10 text-xs font-mono font-medium backdrop-blur-md">
              {lightboxData.index + 1} / {lightboxData.images.length} ảnh
            </div>
            <div className="flex items-center gap-2">
              <a
                href={lightboxData.images[lightboxData.index]}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Mở ảnh gốc trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxData(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Center Image Container */}
          <div
            className="relative max-w-5xl max-h-[82vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={lightboxData.images[lightboxData.index]}
              alt={`Xem ảnh ${lightboxData.index + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border border-white/10"
            />

            {/* Prev / Next controls */}
            {lightboxData.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index - 1 + prev.images.length) % prev.images.length,
                          }
                        : null
                    );
                  }}
                  className="absolute -left-2 sm:-left-12 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 backdrop-blur-md"
                  title="Ảnh trước (←)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxData((prev) =>
                      prev
                        ? {
                            ...prev,
                            index: (prev.index + 1) % prev.images.length,
                          }
                        : null
                    );
                  }}
                  className="absolute -right-2 sm:-right-12 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-black/60 hover:bg-black/90 text-white transition-transform hover:scale-110 backdrop-blur-md"
                  title="Ảnh tiếp theo (→)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Bottom Thumbnails Strip */}
          {lightboxData.images.length > 1 && (
            <div
              className="absolute bottom-4 flex items-center gap-2 max-w-xl overflow-x-auto p-2 rounded-2xl bg-black/50 backdrop-blur-md z-10 scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxData.images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLightboxData((prev) => (prev ? { ...prev, index: i } : null))}
                  className={`w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    i === lightboxData.index
                      ? "border-primary scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
