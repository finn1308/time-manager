"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function VocabIndexStepPage() {
  const params = useParams();
  const step = params?.step as string;
  const parsedStep = ["1", "2", "3", "4", "5"].includes(step)
    ? (Number(step) as 1 | 2 | 3 | 4 | 5)
    : 1;

  return <VocabUnifiedWorkspace defaultStep={parsedStep} />;
}
