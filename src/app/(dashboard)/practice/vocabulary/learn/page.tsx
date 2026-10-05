"use client";

import React from "react";
import { VocabUnifiedWorkspace } from "@/components/vocab/vocab-unified-workspace";

export default function PracticeVocabularyLearnPage() {
  return (
    <VocabUnifiedWorkspace
      defaultStep={4}
      initialMode="FLASHCARD"
      initialCourseSlug="ielts-vocabulary"
    />
  );
}
