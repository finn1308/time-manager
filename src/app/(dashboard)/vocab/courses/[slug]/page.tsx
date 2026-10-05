"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function VocabCourseDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "a1-0-3-0";

  return <VocabUnifiedWorkspace defaultStep={2} initialCourseSlug={slug} />;
}
