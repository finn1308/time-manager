"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import { PipMiniPlayer } from "./pip-mini-player";
import { TimerCompleteModal } from "./timer-complete-modal";

export interface ActiveSubject {
  id: string;
  name: string;
  code?: string | null;
  color: string;
  icon?: string | null;
}

interface PipTimerContextType {
  activeSubject: ActiveSubject | null;
  scheduleEventId: string | null;
  secondsElapsed: number;
  isRunning: boolean;
  isPaused: boolean;
  isPipOpen: boolean;
  startTimer: (subject: ActiveSubject, scheduleEventId?: string | null) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  requestDocumentPip: () => Promise<void>;
  closeDocumentPip: () => void;
  formatTime: (totalSeconds: number) => string;
}

const PipTimerContext = createContext<PipTimerContextType | undefined>(undefined);

const STORAGE_KEY = "chronomind_timer_state_v1";

export function PipTimerProvider({ children }: { children: React.ReactNode }) {
  const [activeSubject, setActiveSubject] = useState<ActiveSubject | null>(null);
  const [scheduleEventId, setScheduleEventId] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPipOpen, setIsPipOpen] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [stoppedSeconds, setStoppedSeconds] = useState(0);

  const pipWindowRef = useRef<any>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef<number>(0);

  // Format seconds into HH:MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Restore state from localStorage on initial mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeSubject) {
          setActiveSubject(parsed.activeSubject);
          setScheduleEventId(parsed.scheduleEventId || null);
          setSecondsElapsed(parsed.secondsElapsed || 0);
          accumulatedRef.current = parsed.secondsElapsed || 0;
          setIsRunning(false);
          setIsPaused(true);
        }
      }
    } catch (e) {
      console.warn("Failed to load saved timer state:", e);
    }
  }, []);

  // Timer tick effect with high-precision timestamp offset
  useEffect(() => {
    if (isRunning && !isPaused) {
      startTimeRef.current = Date.now();
      const currentAccumulated = accumulatedRef.current;

      intervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
          const total = currentAccumulated + delta;
          setSecondsElapsed(total);

          // Save to localStorage every 5 seconds
          if (total % 5 === 0 && activeSubject) {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                activeSubject,
                scheduleEventId,
                secondsElapsed: total,
                isPaused: false,
              })
            );
          }
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, activeSubject, scheduleEventId]);

  const startTimer = useCallback((subject: ActiveSubject, eventId?: string | null) => {
    setActiveSubject(subject);
    setScheduleEventId(eventId || null);
    setSecondsElapsed(0);
    accumulatedRef.current = 0;
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pauseTimer = useCallback(() => {
    if (isRunning && !isPaused) {
      if (startTimeRef.current) {
        const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedRef.current += delta;
      }
      setIsPaused(true);
    }
  }, [isRunning, isPaused]);

  const resumeTimer = useCallback(() => {
    if (isRunning && isPaused) {
      startTimeRef.current = Date.now();
      setIsPaused(false);
    }
  }, [isRunning, isPaused]);

  const stopTimer = useCallback(() => {
    if (startTimeRef.current && isRunning && !isPaused) {
      const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
      accumulatedRef.current += delta;
    }
    const finalSecs = accumulatedRef.current;
    setStoppedSeconds(finalSecs);
    setIsRunning(false);
    setIsPaused(false);
    setShowCompleteModal(true);
    localStorage.removeItem(STORAGE_KEY);
  }, [isRunning, isPaused]);

  // Request W3C Document Picture-in-Picture
  const requestDocumentPip = useCallback(async () => {
    if (typeof window === "undefined") return;

    if ("documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 360,
          height: 270,
        });

        pipWindowRef.current = pipWindow;

        // Copy styles to PIP window
        Array.from(document.styleSheets).forEach((styleSheet) => {
          try {
            if (styleSheet.cssRules) {
              const newStyleEl = pipWindow.document.createElement("style");
              Array.from(styleSheet.cssRules).forEach((cssRule) => {
                newStyleEl.appendChild(pipWindow.document.createTextNode(cssRule.cssText));
              });
              pipWindow.document.head.appendChild(newStyleEl);
            } else if (styleSheet.href) {
              const newLinkEl = pipWindow.document.createElement("link");
              newLinkEl.rel = "stylesheet";
              newLinkEl.href = styleSheet.href;
              pipWindow.document.head.appendChild(newLinkEl);
            }
          } catch {
            // Cross-origin styles fallback
            if (styleSheet.href) {
              const newLinkEl = pipWindow.document.createElement("link");
              newLinkEl.rel = "stylesheet";
              newLinkEl.href = styleSheet.href;
              pipWindow.document.head.appendChild(newLinkEl);
            }
          }
        });

        // Add Notion-style font and base body styles
        pipWindow.document.body.style.margin = "0";
        pipWindow.document.body.style.padding = "0";
        pipWindow.document.body.style.backgroundColor = "#191919";
        pipWindow.document.body.style.fontFamily = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

        const container = pipWindow.document.createElement("div");
        container.id = "pip-root";
        pipWindow.document.body.appendChild(container);
        setPipContainer(container);
        setIsPipOpen(true);

        pipWindow.addEventListener("pagehide", () => {
          setIsPipOpen(false);
          setPipContainer(null);
          pipWindowRef.current = null;
        });
      } catch (err) {
        console.warn("Document Picture-in-Picture failed or rejected by user:", err);
      }
    } else {
      console.info("Document Picture-in-Picture API not supported on this browser. Floating in-app widget will be used.");
    }
  }, []);

  const closeDocumentPip = useCallback(() => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
      setIsPipOpen(false);
      setPipContainer(null);
    }
  }, []);

  return (
    <PipTimerContext.Provider
      value={{
        activeSubject,
        scheduleEventId,
        secondsElapsed,
        isRunning,
        isPaused,
        isPipOpen,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        requestDocumentPip,
        closeDocumentPip,
        formatTime,
      }}
    >
      {children}

      {/* Render Document PiP Window content via React Portal */}
      {isPipOpen &&
        pipContainer &&
        ReactDOM.createPortal(
          <div className="dark p-3.5 bg-[#191919] text-[#e3e2e0] h-full flex flex-col justify-between select-none">
            <PipMiniPlayer />
          </div>,
          pipContainer
        )}

      {/* Completion Modal */}
      {showCompleteModal && activeSubject && (
        <TimerCompleteModal
          subject={activeSubject}
          scheduleEventId={scheduleEventId}
          seconds={stoppedSeconds}
          open={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setActiveSubject(null);
            setSecondsElapsed(0);
          }}
        />
      )}
    </PipTimerContext.Provider>
  );
}

export function usePipTimer() {
  const context = useContext(PipTimerContext);
  if (!context) {
    throw new Error("usePipTimer must be used within a PipTimerProvider");
  }
  return context;
}
