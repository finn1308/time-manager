"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { VocabIndexNav } from "./vocab-index-nav";
import { RoadmapScreen } from "./roadmap-screen";
import { TopicSetOverviewScreen } from "./topic-set-overview-screen";
import { LessonDetailScreen } from "./lesson-detail-screen";
import { InteractiveStudyScreen } from "./interactive-study-screen";
import { SpecialModesScreen } from "./special-modes-screen";
import { StudyMode } from "./interactive-study-modal";

import { VocabWorkspaceProvider, useVocabWorkspace } from "./vocab-workspace-context";

export interface VocabUnifiedWorkspaceProps {
  defaultStep?: 1 | 2 | 3 | 4 | 5;
  initialCourses?: any[];
  initialCourseSlug?: string;
  initialSetId?: string;
  initialMode?: StudyMode;
}

function VocabUnifiedWorkspaceContent({
  defaultStep = 1,
  initialCourses = [],
  initialCourseSlug = "a1-0-3-0",
  initialSetId = "",
  initialMode = "FLASHCARD",
}: VocabUnifiedWorkspaceProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { setSetId } = useVocabWorkspace();

  const resolveInitialStep = (): 1 | 2 | 3 | 4 | 5 => {
    const queryStep = searchParams?.get("step");
    if (queryStep && ["1", "2", "3", "4", "5"].includes(queryStep)) {
      return Number(queryStep) as 1 | 2 | 3 | 4 | 5;
    }
    if (pathname) {
      if (pathname.endsWith("/1")) return 1;
      if (pathname.endsWith("/2")) return 2;
      if (pathname.endsWith("/3")) return 3;
      if (pathname.endsWith("/4")) return 4;
      if (pathname.endsWith("/5")) return 5;
    }
    return defaultStep;
  };

  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4 | 5>(resolveInitialStep());
  const [courseSlug, setCourseSlug] = useState<string>(initialCourseSlug);
  const [studyMode, setStudyMode] = useState<StudyMode>(initialMode);

  useEffect(() => {
    const s = resolveInitialStep();
    setActiveStep(s);
  }, [pathname, searchParams, defaultStep]);

  const handleStepChange = useCallback((newStep: 1 | 2 | 3 | 4 | 5) => {
    setActiveStep(newStep);

    if (typeof window !== "undefined") {
      try {
        const currentUrl = new URL(window.location.href);
        if (currentUrl.pathname.match(/\/index\/[1-5]$/)) {
          window.history.replaceState(null, "", `/index/${newStep}`);
        } else if (currentUrl.pathname.match(/\/vocab\/index\/[1-5]$/)) {
          window.history.replaceState(null, "", `/vocab/index/${newStep}`);
        } else {
          currentUrl.searchParams.set("step", String(newStep));
          window.history.replaceState(null, "", currentUrl.toString());
        }
      } catch (e) {
      }
    }
  }, []);

  return (
    <div className="w-full space-y-6">
      <div className="sticky top-2 z-30 shadow-md sm:shadow-lg rounded-2xl bg-white/95 dark:bg-[#16241b]/95 backdrop-blur-md">
        <VocabIndexNav currentStep={activeStep} onStepChange={handleStepChange} />
      </div>

      <div className="min-h-[70vh] transition-opacity duration-200">
        {activeStep === 1 && (
          <RoadmapScreen
            initialCourses={initialCourses}
            onSelectCourse={(slug) => {
              setCourseSlug(slug);
              handleStepChange(2);
            }}
            onNavigateStep={handleStepChange}
            hideNav={true}
          />
        )}
        {activeStep === 2 && (
          <TopicSetOverviewScreen
            initialSlug={courseSlug}
            onSelectSet={(selectedSetId) => {
              setSetId(selectedSetId);
              handleStepChange(3);
            }}
            onNavigateStep={handleStepChange}
            hideNav={true}
          />
        )}
        {activeStep === 3 && (
          <LessonDetailScreen
            onStartStudy={(mode) => {
              setStudyMode(mode);
              handleStepChange(4);
            }}
            onOpenSpecialModes={() => handleStepChange(5)}
            onNavigateStep={handleStepChange}
            hideNav={true}
          />
        )}
        {activeStep === 4 && (
          <InteractiveStudyScreen
            initialMode={studyMode}
            onNavigateStep={handleStepChange}
            hideNav={true}
          />
        )}
        {activeStep === 5 && (
          <SpecialModesScreen
            onNavigateStep={handleStepChange}
            hideNav={true}
          />
        )}
      </div>
    </div>
  );
}

export function VocabUnifiedWorkspace(props: VocabUnifiedWorkspaceProps) {
  return (
    <VocabWorkspaceProvider initialSetId={props.initialSetId}>
      <VocabUnifiedWorkspaceContent {...props} />
    </VocabWorkspaceProvider>
  );
}
