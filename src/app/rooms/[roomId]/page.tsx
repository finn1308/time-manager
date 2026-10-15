import React from "react";
import { findRoom } from "@/lib/rooms/room-auth";
import { StandaloneRoomClient } from "@/components/rooms/standalone-room-client";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  const { roomId } = await params;
  const room = await findRoom(roomId);

  if (!room) {
    return {
      title: `Phòng họp ID = ${roomId} | ChronoMind`,
    };
  }

  return {
    title: `${room.title} (${room.subject}) | Không gian phòng họp`,
    description: room.description || `Không gian làm việc và cộng tác phòng họp ${room.title}`,
  };
}

export default async function StandaloneRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const room = await findRoom(roomId);

  // If room not found or closed, render friendly error state without ChronoMind sidebar
  if (!room || room.status === "ARCHIVED" || room.status === "LOCKED") {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-pastel-grid"
        style={{
          backgroundColor: "var(--bg-base)",
          color: "var(--text-ink)",
        }}
      >
        <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-destructive/20 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-black text-foreground">
              Không tìm thấy phòng họp
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Phòng họp với mã <span className="font-mono font-bold text-foreground">"{roomId}"</span> không tồn tại hoặc đã bị khóa/xóa bởi quản trị viên.
            </p>
          </div>

          <div className="pt-2">
            <Link href="/rooms">
              <Button variant="outline" className="rounded-xl text-xs gap-2">
                <ArrowLeft className="w-4 h-4" />
                Về danh sách phòng họp
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StandaloneRoomClient
      roomId={roomId}
      roomInfo={{
        id: room.id,
        publicId: room.publicId,
        title: room.title,
        subject: room.subject,
        description: room.description,
      }}
    />
  );
}
