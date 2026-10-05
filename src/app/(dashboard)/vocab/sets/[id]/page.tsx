"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function WordSetDetailPage() {
  const params = useParams();
  const setId = (params?.id as string) || "";

  return <VocabUnifiedWorkspace defaultStep={3} initialSetId={setId} />;
}
