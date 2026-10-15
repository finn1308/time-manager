"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Copy,
  Check,
  FolderKanban,
  Settings2,
  Clock,
  Sparkles,
  Loader2,
  Shield,
  Layers,
  KeyRound,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { CreateRoomModal } from "./create-room-modal";
import { AdminCredentialsModal } from "./modals/admin-credentials-modal";
import { DeleteRoomModal } from "./modals/delete-room-modal";

interface RoomSummary {
  id: string;
  publicId: string;
  title: string;
  subject: string;
  description?: string | null;
  coverColor?: string | null;
  ownerId: string;
  role: string;
  memberCount: number;
  groupCount: number;
  taskCount: number;
  createdAt: string;
  updatedAt: string;
}

export function RoomsDashboard() {
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedRoomForCreds, setSelectedRoomForCreds] = useState<RoomSummary | null>(null);
  const [selectedRoomForDelete, setSelectedRoomForDelete] = useState<RoomSummary | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rooms");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể tải danh sách");
      setRooms(data.rooms || []);
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải phòng họp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const copyLink = (publicId: string) => {
    const url = `${window.location.origin}/rooms/${publicId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(publicId);
    toast.success("Đã sao chép liên kết phòng họp");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "ALL" || r.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Phòng họp & Không gian cộng tác</h1>
              <p className="text-xs text-muted-foreground">
                Quản lý các không gian học tập riêng tư, bảng công việc kiểu Trello và chia sẻ tiến độ học tập.
              </p>
            </div>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="rounded-2xl h-11 px-5 text-xs font-bold bg-primary text-primary-foreground shadow-md gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo phòng họp mới
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-card border border-border">
        <div className="relative flex-1 w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên phòng hoặc môn học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl bg-background border-border"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-muted-foreground">Vai trò:</span>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 px-3 text-xs rounded-xl border border-border bg-background text-foreground"
          >
            <option value="ALL">Tất cả ({rooms.length})</option>
            <option value="ADMIN">Admin</option>
            <option value="HOST">Host</option>
            <option value="MEMBER">Thành viên</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse p-5 space-y-4">
              <div className="h-5 bg-muted rounded-md w-3/4" />
              <div className="h-4 bg-muted rounded-md w-1/2" />
              <div className="h-8 bg-muted rounded-md mt-6" />
            </div>
          ))}
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="py-20 text-center rounded-3xl bg-card border border-border p-8 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Bạn chưa tham gia phòng họp nào</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Nhấn <strong>"+ Tạo phòng họp mới"</strong> để bắt đầu tạo không gian cộng tác với URL ngẫu nhiên bảo mật cao và mời bạn bè tham gia.
            </p>
          </div>
          <div className="pt-2">
            <Button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="rounded-xl h-10 px-4 text-xs font-semibold bg-primary text-primary-foreground gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo phòng họp đầu tiên
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              className="p-5 rounded-2xl bg-card border border-border hover:border-primary/50 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header row: Subject badge + Role badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20 truncate max-w-[160px]">
                    {room.subject}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                      room.role === "ADMIN"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                        : room.role === "HOST"
                        ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {room.role}
                  </span>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {room.title}
                  </h3>
                  {room.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Meta stats */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <strong>{room.memberCount}</strong> thành viên
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <strong>{room.groupCount}</strong> nhóm
                  </span>
                  <span className="flex items-center gap-1">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <strong>{room.taskCount}</strong> thẻ
                  </span>
                </div>
              </div>

              {/* Action Buttons: Open & Copy Link */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(room.publicId)}
                  className="h-8 px-2.5 text-xs rounded-xl gap-1.5"
                  title="Sao chép liên kết phòng"
                >
                  {copiedId === room.publicId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copiedId === room.publicId ? "Đã chép" : "Sao chép link"}
                </Button>

                <Link href={`/rooms/${room.publicId}`}>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-4 text-xs font-semibold rounded-xl bg-primary text-primary-foreground gap-1.5"
                  >
                    Mở phòng
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Room Modal */}
      <CreateRoomModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={fetchRooms}
      />
    </div>
  );
}
