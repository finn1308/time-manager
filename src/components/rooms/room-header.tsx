"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  Settings2,
  Copy,
  Check,
  Share2,
  UserCheck,
  Shield,
  Sparkles,
  ExternalLink,
  FolderKanban,
  LayoutGrid,
  BarChart2,
  History,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";

export type RoomTab = "personal" | "groups" | "board" | "tracking" | "activity";

interface RoomHeaderProps {
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
    description?: string | null;
    coverColor?: string | null;
  };
  membership: {
    role: string;
    status: string;
  };
  memberCount: number;
  activeTab: RoomTab;
  onTabChange: (tab: RoomTab) => void;
  onOpenMembers: () => void;
  onOpenSettings: () => void;
  isAdmin: boolean;
  isHost: boolean;
}

export function RoomHeader({
  room,
  membership,
  memberCount,
  activeTab,
  onTabChange,
  onOpenMembers,
  onOpenSettings,
  isAdmin,
  isHost,
}: RoomHeaderProps) {
  const [copied, setCopied] = useState(false);

  const getFullRoomUrl = () => {
    if (typeof window === "undefined") return `/rooms/${room.publicId}`;
    return `${window.location.origin}/rooms/${room.publicId}`;
  };

  const copyRoomLink = () => {
    navigator.clipboard.writeText(getFullRoomUrl());
    setCopied(true);
    toast.success("Đã sao chép liên kết phòng họp");
    setTimeout(() => setCopied(false), 2000);
  };

  const TABS = [
    { key: "personal", label: "Cá nhân", icon: MessageSquare },
    { key: "groups", label: "Nhóm", icon: Users },
    { key: "board", label: "Bảng công việc", icon: LayoutGrid },
    { key: "tracking", label: "Tracking", icon: BarChart2 },
    { key: "activity", label: "Hoạt động", icon: History },
  ] as const;

  return (
    <div className="space-y-4 bg-card border-b border-border pb-2 pt-2">
      {/* Top row: Title, Subject, Role, Link, Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              {room.title}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
              {room.subject}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                membership.role === "ADMIN"
                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                  : membership.role === "HOST"
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Vai trò: {membership.role}
            </span>
          </div>

          {room.description && (
            <p className="text-xs text-muted-foreground max-w-2xl line-clamp-2">
              {room.description}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyRoomLink}
            className="h-8 px-2.5 text-xs rounded-xl gap-1.5"
            title="Sao chép URL phòng"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Đã chép link" : "Sao chép link"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenMembers}
            className="h-8 px-2.5 text-xs rounded-xl gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thành viên ({memberCount})</span>
          </Button>

          {isAdmin && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenSettings}
              className="h-8 px-2.5 text-xs rounded-xl gap-1.5"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Cài đặt</span>
            </Button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto pt-2 border-t border-border/40 scrollbar-none">
        {TABS.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.key;

          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onTabChange(t.key)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
