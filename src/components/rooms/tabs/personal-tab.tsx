"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
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

interface PersonalTabProps {
  roomId: string;
  groups: Array<{ id: string; name: string }>;
  currentUserId: string;
  mustChangePassword?: boolean;
}

export function PersonalTab({ roomId, groups, currentUserId, mustChangePassword }: PersonalTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"all" | "my">("all");
  const [loading, setLoading] = useState(false);

  // Composer state
  const [content, setContent] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [showAttachInputs, setShowAttachInputs] = useState(false);
  const [posting, setPosting] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/posts?filter=${filter}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải bài viết");
      setPosts(data.posts || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải bài viết");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [roomId, filter]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (mustChangePassword) {
      toast.error("Vui lòng đổi mật khẩu tạm trước khi chia sẻ cập nhật.");
      return;
    }

    setPosting(true);
    try {
      const res = await fetch(`/api/rooms/${roomId}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          groupId: selectedGroupId || null,
          imageUrl: imageUrl.trim() || null,
          attachmentUrl: attachmentUrl.trim() || null,
          attachmentName: attachmentName.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Đăng bài thất bại");

      toast.success("Đã đăng cập nhật thành công!");
      setContent("");
      setImageUrl("");
      setAttachmentUrl("");
      setAttachmentName("");
      setShowAttachInputs(false);
      fetchPosts();
    } catch (err: any) {
      toast.error(err.message || "Lỗi đăng bài");
    } finally {
      setPosting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Bạn có chắc muốn xóa cập nhật này?")) return;

    try {
      const res = await fetch(`/api/rooms/${roomId}/posts/${postId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Xóa thất bại");

      toast.success("Đã xóa cập nhật");
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err: any) {
      toast.error(err.message || "Lỗi xóa bài");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Post Composer */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Chia sẻ cập nhật cá nhân
          </span>
          {groups.length > 0 && (
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="h-7 px-2 text-xs rounded-lg border border-border bg-background text-muted-foreground"
            >
              <option value="">Toàn phòng</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  Nhóm: {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            placeholder="Bạn đang làm phần nào? Ghi chú tiến độ, báo cáo tài liệu hoặc câu hỏi cho nhóm..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          />

          {showAttachInputs && (
            <div className="p-3 rounded-xl bg-muted/40 border border-border space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Đường dẫn ảnh minh họa (URL)
                </label>
                <Input
                  placeholder="https://example.com/screenshot.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-8 text-xs bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    Tên tài liệu
                  </label>
                  <Input
                    placeholder="Báo cáo tuần 3.pdf"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Link tài liệu (URL)
                  </label>
                  <Input
                    placeholder="https://drive.google.com/..."
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    className="h-8 text-xs bg-background"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAttachInputs(!showAttachInputs)}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 gap-1.5"
            >
              <Paperclip className="w-3.5 h-3.5" />
              {showAttachInputs ? "Ẩn đính kèm" : "Thêm ảnh / Link tài liệu"}
            </Button>

            <Button
              type="submit"
              disabled={posting || !content.trim()}
              className="h-8 px-4 rounded-xl text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
            >
              {posting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang đăng...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Đăng cập nhật
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">
          Dòng hoạt động cá nhân ({posts.length})
        </span>

        <div className="flex items-center p-1 bg-muted/60 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Tất cả thành viên
          </button>
          <button
            type="button"
            onClick={() => setFilter("my")}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              filter === "my" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            Của tôi
          </button>
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <p className="text-xs">Đang tải dòng hoạt động...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-card border border-border p-6 space-y-2">
            <p className="text-sm font-semibold text-foreground">Chưa có cập nhật nào</p>
            <p className="text-xs text-muted-foreground">
              Hãy là người đầu tiên chia sẻ tiến độ học tập hoặc ghi chú cho phòng họp!
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {post.author.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">
                        {post.author.name || "Thành viên"}
                      </span>
                      {post.group && (
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                          {post.group.name}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{" "}
                      - {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {post.canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeletePost(post.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    title="Xóa cập nhật"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>

              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>

              {post.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-border max-h-80">
                  <img
                    src={post.imageUrl}
                    alt="Đính kèm"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {post.attachmentUrl && (
                <a
                  href={post.attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 p-2.5 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border text-xs font-medium text-primary transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{post.attachmentName || "Xem tài liệu đính kèm"}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </a>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
