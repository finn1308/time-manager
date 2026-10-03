"use client";

import React from "react";
import { useParams } from "next/navigation";
import { RoadmapScreen } from "@/components/vocab/roadmap-screen";
import { TopicSetOverviewScreen } from "@/components/vocab/topic-set-overview-screen";
import { LessonDetailScreen } from "@/components/vocab/lesson-detail-screen";
import { InteractiveStudyScreen } from "@/components/vocab/interactive-study-screen";
import { SpecialModesScreen } from "@/components/vocab/special-modes-screen";

export default function VocabIndexStepPage() {
  const params = useParams();
  const step = params?.step as string;

  switch (step) {
    case "1":
      return <RoadmapScreen />;
    case "2":
      return <TopicSetOverviewScreen />;
    case "3":
      return <LessonDetailScreen />;
    case "4":
      return <InteractiveStudyScreen />;
    case "5":
      return <SpecialModesScreen />;
    default:
      return <RoadmapScreen />;
  }
}
