import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoomWorkspace } from "@/components/rooms/room-workspace";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export async function generateMetadata({ params }: RoomPageProps) {
  const { roomId } = await params;
  return {
    title: `Không gian phòng họp | ChronoMind`,
    description: "Không gian làm việc và bảng công việc kiểu Trello.",
  };
}

export default async function RoomWorkspacePage({ params }: RoomPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { roomId } = await params;

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <RoomWorkspace roomId={roomId} currentUser={user} />
    </div>
  );
}
