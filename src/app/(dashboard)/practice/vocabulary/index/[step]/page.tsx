import React from "react";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";
import { getCourses } from "@/lib/vocab/service";
import { getCurrentUser } from "@/lib/auth";

export default async function PracticeVocabStepPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const { step } = await params;
  const stepNumber = [1, 2, 3, 4, 5].includes(Number(step))
    ? (Number(step) as 1 | 2 | 3 | 4 | 5)
    : 1;

  const user = await getCurrentUser();
  const initialCourses = await getCourses(user);
  const initialSetId = initialCourses?.[0]?.wordSets?.[0]?.id || undefined;

  return (
    <VocabUnifiedWorkspace
      defaultStep={stepNumber}
      initialCourses={initialCourses}
      initialCourseSlug="ielts-vocabulary"
      initialSetId={initialSetId}
    />
  );
}
