import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RoomsDashboard } from "@/components/rooms/rooms-dashboard";

export const metadata = {
  title: "Phòng họp & Không gian cộng tác | ChronoMind",
  description: "Không gian cộng tác học tập nhóm, quản lý thẻ công việc kiểu Trello và theo dõi tiến độ.",
};

export default async function RoomsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return <RoomsDashboard />;
}
