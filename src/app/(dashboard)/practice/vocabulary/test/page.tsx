"use client";

import React from "react";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function PracticeVocabularyTestPage() {
  return (
    <VocabUnifiedWorkspace
      defaultStep={4}
      initialMode="QUIZ"
      initialCourseSlug="ielts-vocabulary"
    />
  );
}
