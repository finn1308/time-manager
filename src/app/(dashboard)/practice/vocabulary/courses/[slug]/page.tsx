"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function PracticeVocabCourseDetailPage() {
  const params = useParams();
  const slug = (params?.slug as string) || "ielts-vocabulary";

  return <VocabUnifiedWorkspace defaultStep={2} initialCourseSlug={slug} />;
}
