"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function DashboardRefresher() {
  const router = useRouter();

  useEffect(() => {
    const handleStudyUpdated = () => {
      router.refresh();
    };

    window.addEventListener("chronomind-study-updated", handleStudyUpdated);
    return () => {
      window.removeEventListener("chronomind-study-updated", handleStudyUpdated);
    };
  }, [router]);

  return null;
}
