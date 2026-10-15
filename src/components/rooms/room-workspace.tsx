"use client";

import React, { useState, useEffect } from "react";
import { RoomHeader, RoomTab } from "./room-header";
import { PersonalTab } from "./tabs/personal-tab";
import { GroupsTab } from "./tabs/groups-tab";
import { BoardTab } from "./tabs/board-tab";
import { TrackingTab } from "./tabs/tracking-tab";
import { ActivityTab } from "./tabs/activity-tab";
import { MemberManagementModal } from "./modals/member-management-modal";
import { EditRoomModal } from "./edit-room-modal";
import { ForcePasswordModal } from "./modals/force-password-modal";
import { AdminCredentialsModal } from "./modals/admin-credentials-modal";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

interface RoomData {
  room: {
    id: string;
    publicId: string;
    title: string;
    subject: string;
    description: string | null;
    coverColor: string | null;
    coverImage: string | null;
    ownerId: string;
    status: string;
    joinPolicy: string;
  };
  membership: {
    id: string;
    role: string;
    status: string;
    joinedAt: string;
  };
  permissions: {
    isAdmin: boolean;
    isHost: boolean;
    isMember: boolean;
  };
  mustChangePassword: boolean;
  columns: Array<{ id: string; name: string; key: string; color: string | null; sortOrder: number }>;
  groups: Array<{ id: string; name: string; description?: string | null; color: string | null; joinPolicy: string; memberCount: number }>;
  labels: Array<{ id: string; name: string; color: string }>;
  memberCount: number;
}

interface RoomWorkspaceProps {
  roomId: string;
  currentUser: {
    id: string;
    name: string | null;
    email: string;
  };
  onLogout?: () => void;
}

export function RoomWorkspace({ roomId, currentUser, onLogout }: RoomWorkspaceProps) {
  const [data, setData] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<RoomTab>("personal"); // Default: Cá nhân

  // Members list for card assignment
  const [members, setMembers] = useState<Array<{ id: string; userId: string; name: string; image?: string | null; role?: string; email?: string }>>([]);

  // Modals state
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAdminCredsModal, setShowAdminCredsModal] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);

  const fetchRoomData = async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Không thể tải phòng họp");
      }

      setData(json);
      setMustChangePassword(!!json.mustChangePassword);

      // Fetch member list for assignment
      const memRes = await fetch(`/api/rooms/${roomId}/members`);
      const memJson = await memRes.json();
      if (memRes.ok) {
        setMembers(
          (memJson.members || []).map((m: any) => ({
            id: m.id,
            userId: m.userId,
            name: m.name,
            image: m.image,
            role: m.role,
            email: m.email,
          }))
        );
      }
    } catch (err: any) {
      setError(err.message || "Lỗi tải phòng họp");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`/api/rooms/${roomId}/auth/logout`, { method: "POST" });
      toast.success("Đã đăng xuất khỏi phòng họp");
      if (onLogout) {
        onLogout();
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchRoomData();
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Đang chuẩn bị không gian làm việc phòng họp...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 p-6 rounded-2xl bg-card border border-destructive/30 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">Không thể truy cập phòng họp</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {error || "Phòng họp không tồn tại hoặc bạn chưa được cấp quyền truy cập."}
          </p>
        </div>
        {onLogout ? (
          <Button variant="outline" onClick={onLogout} className="text-xs rounded-xl gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Đăng nhập lại
          </Button>
        ) : (
          <Link href="/rooms">
            <Button variant="outline" className="text-xs rounded-xl gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              Quay lại danh sách phòng
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mandatory First-Login Password Change Modal */}
      <ForcePasswordModal
        open={mustChangePassword}
        onSuccess={() => {
          setMustChangePassword(false);
          fetchRoomData();
        }}
      />

      {/* Room Header with Tabs */}
      <RoomHeader
        room={data.room}
        membership={data.membership}
        memberCount={data.memberCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenMembers={() => setShowMembersModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenCredentials={() => setShowAdminCredsModal(true)}
        onLogout={handleLogout}
        isAdmin={data.permissions.isAdmin}
        isHost={data.permissions.isHost}
      />

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === "personal" && (
          <PersonalTab
            roomId={data.room.id}
            groups={data.groups}
            members={members}
            columns={data.columns}
            labels={data.labels}
            isAdmin={data.permissions.isAdmin}
            isHost={data.permissions.isHost}
            currentUserId={currentUser.id}
            currentUser={currentUser}
            mustChangePassword={mustChangePassword}
            onOpenMembers={() => setShowMembersModal(true)}
          />
        )}

        {activeTab === "groups" && (
          <GroupsTab
            roomId={data.room.id}
            isAdmin={data.permissions.isAdmin}
            isHost={data.permissions.isHost}
            currentUserId={currentUser.id}
            onGroupsChanged={fetchRoomData}
          />
        )}

        {activeTab === "board" && (
          <BoardTab
            roomId={data.room.id}
            columns={data.columns}
            groups={data.groups}
            labels={data.labels}
            members={members}
            isAdmin={data.permissions.isAdmin}
            isHost={data.permissions.isHost}
            currentUserId={currentUser.id}
            onBoardChanged={fetchRoomData}
          />
        )}

        {activeTab === "tracking" && (
          <TrackingTab
            roomId={data.room.id}
            groups={data.groups}
          />
        )}

        {activeTab === "activity" && (
          <ActivityTab
            roomId={data.room.id}
          />
        )}
      </div>

      {/* Member Management Modal */}
      <MemberManagementModal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        roomId={data.room.id}
        isAdmin={data.permissions.isAdmin}
        isHost={data.permissions.isHost}
        onMembersUpdated={fetchRoomData}
      />

      {/* Edit Room Modal */}
      {data.permissions.isAdmin && (
        <EditRoomModal
          open={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          room={data.room}
          onRoomUpdated={fetchRoomData}
        />
      )}

      {/* Admin Credentials Modal */}
      {data.permissions.isAdmin && (
        <AdminCredentialsModal
          open={showAdminCredsModal}
          onClose={() => setShowAdminCredsModal(false)}
          room={data.room}
        />
      )}
    </div>
  );
}
