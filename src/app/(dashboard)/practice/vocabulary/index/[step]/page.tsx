"use client";

import React from "react";
import { useParams } from "next/navigation";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function PracticeVocabStepPage() {
  const params = useParams();
  const stepParam = params?.step as string;
  const stepNumber = [1, 2, 3, 4, 5].includes(Number(stepParam))
    ? (Number(stepParam) as 1 | 2 | 3 | 4 | 5)
    : 1;

  return (
    <VocabUnifiedWorkspace
      defaultStep={stepNumber}
      initialCourseSlug="ielts-vocabulary"
    />
  );
}
