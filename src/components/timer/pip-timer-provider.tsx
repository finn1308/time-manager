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

export type TimerMode = "POMODORO" | "CUSTOM_COUNTDOWN" | "STOPWATCH";
export type PomodoroPhase = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export interface StartTimerOptions {
  scheduleEventId?: string | null;
  flexibleGoalId?: string | null;
  skillId?: string | null;
  taskId?: string | null;
  mode?: TimerMode;
  targetMinutes?: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  pomodoroLongBreakMinutes?: number;
}

export interface PipTimerContextType {
  activeSubject: ActiveSubject | null;
  scheduleEventId: string | null;
  flexibleGoalId: string | null;
  taskId: string | null;
  mode: TimerMode;
  pomodoroPhase: PomodoroPhase;
  pomodoroCycle: number;
  targetSeconds: number;
  remainingSeconds: number;
  secondsElapsed: number;
  totalWorkSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  isPipOpen: boolean;
  startTimer: (subject: ActiveSubject, optionsOrEventId?: string | null | StartTimerOptions) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  switchPhase: (targetPhase?: PomodoroPhase) => void;
  setTimerMode: (newMode: TimerMode, targetMins?: number) => void;
  requestDocumentPip: () => Promise<void>;
  closeDocumentPip: () => void;
  formatTime: (totalSeconds: number) => string;
}

const PipTimerContext = createContext<PipTimerContextType | undefined>(undefined);

const STORAGE_KEY = "chronomind_timer_state_v2";

function playTimerChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18); // A5
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
  } catch (e) {
    console.warn("Could not play audio chime:", e);
  }
}

export function PipTimerProvider({ children }: { children: React.ReactNode }) {
  const [activeSubject, setActiveSubject] = useState<ActiveSubject | null>(null);
  const [scheduleEventId, setScheduleEventId] = useState<string | null>(null);
  const [flexibleGoalId, setFlexibleGoalId] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [mode, setMode] = useState<TimerMode>("POMODORO");
  const [pomodoroPhase, setPomodoroPhase] = useState<PomodoroPhase>("WORK");
  const [pomodoroCycle, setPomodoroCycle] = useState<number>(0);

  // Settings
  const [pomodoroWorkMins, setPomodoroWorkMins] = useState<number>(25);
  const [pomodoroBreakMins, setPomodoroBreakMins] = useState<number>(5);
  const [pomodoroLongBreakMins, setPomodoroLongBreakMins] = useState<number>(15);

  // Timing state
  const [targetSeconds, setTargetSeconds] = useState<number>(25 * 60);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(25 * 60);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [totalWorkSeconds, setTotalWorkSeconds] = useState<number>(0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isPipOpen, setIsPipOpen] = useState<boolean>(false);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(false);
  const [stoppedSeconds, setStoppedSeconds] = useState<number>(0);

  const pipWindowRef = useRef<any>(null);
  const [pipContainer, setPipContainer] = useState<HTMLElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // High precision reference
  const lastTickRef = useRef<number | null>(null);

  // Format seconds into HH:MM:SS or MM:SS
  const formatTime = useCallback((totalSeconds: number): string => {
    const s = Math.max(0, Math.floor(totalSeconds));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  // Restore state from localStorage on initial mount and check offline sync
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeSubject) {
          setActiveSubject(parsed.activeSubject);
          setScheduleEventId(parsed.scheduleEventId || null);
          setFlexibleGoalId(parsed.flexibleGoalId || null);
          setTaskId(parsed.taskId || null);
          setMode(parsed.mode || "POMODORO");
          setPomodoroPhase(parsed.pomodoroPhase || "WORK");
          setPomodoroCycle(parsed.pomodoroCycle || 0);
          setTargetSeconds(parsed.targetSeconds || 25 * 60);
          setRemainingSeconds(parsed.remainingSeconds || 25 * 60);
          setSecondsElapsed(parsed.secondsElapsed || 0);
          setTotalWorkSeconds(parsed.totalWorkSeconds || 0);
          setIsRunning(false);
          setIsPaused(true);
        }
      }
    } catch (e) {
      console.warn("Failed to load saved timer state:", e);
    }
  }, []);

  // Offline Sync Effect
  useEffect(() => {
    const syncOfflineSessions = async () => {
      if (typeof window === "undefined" || !navigator.onLine) return;
      
      const offlineData = localStorage.getItem("offline_study_sessions");
      if (!offlineData) return;
      
      try {
        const sessions = JSON.parse(offlineData);
        if (sessions && sessions.length > 0) {
          let hasError = false;
          // Try to sync one by one
          for (let i = 0; i < sessions.length; i++) {
            try {
              const res = await fetch("/api/timer/stop", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(sessions[i]),
              });
              if (!res.ok) hasError = true;
            } catch {
              hasError = true;
            }
          }
          if (!hasError) {
            localStorage.removeItem("offline_study_sessions");
            // Optional: emit event to refresh logs
            window.dispatchEvent(new Event("chronomind-study-updated"));
          }
        }
      } catch (e) {
        console.warn("Error parsing offline sessions", e);
      }
    };

    window.addEventListener("online", syncOfflineSessions);
    // Try syncing on initial load just in case
    syncOfflineSessions();

    return () => {
      window.removeEventListener("online", syncOfflineSessions);
    };
  }, []);

  // Switch phase logic
  const switchPhase = useCallback(
    (targetPhase?: PomodoroPhase) => {
      let nextPhase: PomodoroPhase = "WORK";
      if (targetPhase) {
        nextPhase = targetPhase;
      } else {
        if (pomodoroPhase === "WORK") {
          const nextCycle = pomodoroCycle + 1;
          setPomodoroCycle(nextCycle);
          nextPhase = nextCycle % 4 === 0 ? "LONG_BREAK" : "SHORT_BREAK";
        } else {
          nextPhase = "WORK";
        }
      }

      setPomodoroPhase(nextPhase);

      let nextDuration = 25 * 60;
      if (nextPhase === "WORK") {
        nextDuration = pomodoroWorkMins * 60;
      } else if (nextPhase === "SHORT_BREAK") {
        nextDuration = pomodoroBreakMins * 60;
      } else {
        nextDuration = pomodoroLongBreakMins * 60;
      }

      setTargetSeconds(nextDuration);
      setRemainingSeconds(nextDuration);
      setIsPaused(false);
    },
    [pomodoroPhase, pomodoroCycle, pomodoroWorkMins, pomodoroBreakMins, pomodoroLongBreakMins]
  );

  // Stop Timer
  const stopTimer = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    const loggedSeconds = totalWorkSeconds > 0 ? totalWorkSeconds : secondsElapsed;
    setStoppedSeconds(loggedSeconds);
    setShowCompleteModal(true);
    localStorage.removeItem(STORAGE_KEY);
  }, [totalWorkSeconds, secondsElapsed]);

  // Main tick effect
  useEffect(() => {
    if (isRunning && !isPaused) {
      lastTickRef.current = Date.now();

      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.round((now - (lastTickRef.current || now)) / 1000);
        if (delta <= 0) return;
        lastTickRef.current = now;

        if (mode === "STOPWATCH") {
          setSecondsElapsed((prev) => {
            const next = prev + delta;
            setTotalWorkSeconds(next);
            return next;
          });
        } else {
          // COUNTDOWN OR POMODORO
          setRemainingSeconds((prev) => {
            const next = prev - delta;
            if (pomodoroPhase === "WORK") {
              setTotalWorkSeconds((work) => work + delta);
              setSecondsElapsed((work) => work + delta);
            }

            if (next <= 0) {
              playTimerChime();
              if (mode === "CUSTOM_COUNTDOWN") {
                stopTimer();
                return 0;
              }
              // In Pomodoro mode: transition phase
              switchPhase();
              return 0;
            }
            return next;
          });
        }

        // Periodically persist state
        if (activeSubject) {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              activeSubject,
              scheduleEventId,
              flexibleGoalId,
              taskId,
              mode,
              pomodoroPhase,
              pomodoroCycle,
              targetSeconds,
              remainingSeconds,
              secondsElapsed,
              totalWorkSeconds,
            })
          );
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
  }, [
    isRunning,
    isPaused,
    mode,
    pomodoroPhase,
    activeSubject,
    scheduleEventId,
    flexibleGoalId,
    taskId,
    pomodoroCycle,
    targetSeconds,
    remainingSeconds,
    secondsElapsed,
    totalWorkSeconds,
    switchPhase,
    stopTimer,
  ]);

  // Start timer action
  const startTimer = useCallback(
    (subject: ActiveSubject, optionsOrEventId?: string | null | StartTimerOptions) => {
      let eventId: string | null = null;
      let flexGoalId: string | null = null;
      let tId: string | null = null;
      let targetMode: TimerMode = "POMODORO";
      let workMins = 25;
      let breakMins = 5;
      let longBreakMins = 15;
      let customMins: number | null = null;

      if (typeof optionsOrEventId === "string") {
        eventId = optionsOrEventId;
      } else if (optionsOrEventId && typeof optionsOrEventId === "object") {
        eventId = optionsOrEventId.scheduleEventId || null;
        flexGoalId = optionsOrEventId.flexibleGoalId || null;
        tId = optionsOrEventId.taskId || null;
        if (optionsOrEventId.mode) targetMode = optionsOrEventId.mode;
        if (optionsOrEventId.pomodoroWorkMinutes) workMins = optionsOrEventId.pomodoroWorkMinutes;
        if (optionsOrEventId.pomodoroBreakMinutes) breakMins = optionsOrEventId.pomodoroBreakMinutes;
        if (optionsOrEventId.pomodoroLongBreakMinutes) longBreakMins = optionsOrEventId.pomodoroLongBreakMinutes;
        if (optionsOrEventId.targetMinutes) customMins = optionsOrEventId.targetMinutes;
      }

      setActiveSubject(subject);
      setScheduleEventId(eventId);
      setFlexibleGoalId(flexGoalId);
      setTaskId(tId);
      setMode(targetMode);
      setPomodoroPhase("WORK");
      setPomodoroCycle(0);
      setPomodoroWorkMins(workMins);
      setPomodoroBreakMins(breakMins);
      setPomodoroLongBreakMins(longBreakMins);

      let initialTarget = workMins * 60;
      if (targetMode === "CUSTOM_COUNTDOWN") {
        initialTarget = (customMins || 45) * 60;
      } else if (targetMode === "STOPWATCH") {
        initialTarget = 0;
      }

      setTargetSeconds(initialTarget);
      setRemainingSeconds(initialTarget);
      setSecondsElapsed(0);
      setTotalWorkSeconds(0);
      setIsRunning(true);
      setIsPaused(false);
    },
    []
  );

  const pauseTimer = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeTimer = useCallback(() => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
  }, []);

  const setTimerMode = useCallback((newMode: TimerMode, targetMins?: number) => {
    setMode(newMode);
    if (newMode === "POMODORO") {
      setPomodoroPhase("WORK");
      const s = 25 * 60;
      setTargetSeconds(s);
      setRemainingSeconds(s);
    } else if (newMode === "CUSTOM_COUNTDOWN") {
      const s = (targetMins || 45) * 60;
      setTargetSeconds(s);
      setRemainingSeconds(s);
    } else {
      setTargetSeconds(0);
      setRemainingSeconds(0);
    }
  }, []);

  // Request W3C Document Picture-in-Picture
  const requestDocumentPip = useCallback(async () => {
    if (typeof window === "undefined") return;

    if ("documentPictureInPicture" in window) {
      try {
        const pipWindow = await (window as any).documentPictureInPicture.requestWindow({
          width: 360,
          height: 290,
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
            if (styleSheet.href) {
              const newLinkEl = pipWindow.document.createElement("link");
              newLinkEl.rel = "stylesheet";
              newLinkEl.href = styleSheet.href;
              pipWindow.document.head.appendChild(newLinkEl);
            }
          }
        });

        pipWindow.document.body.style.margin = "0";
        pipWindow.document.body.style.padding = "0";
        pipWindow.document.body.style.backgroundColor = "#121d15";
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
        flexibleGoalId,
        taskId,
        mode,
        pomodoroPhase,
        pomodoroCycle,
        targetSeconds,
        remainingSeconds,
        secondsElapsed,
        totalWorkSeconds,
        isRunning,
        isPaused,
        isPipOpen,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        switchPhase,
        setTimerMode,
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
          <div className="dark p-4 bg-[#121d15] text-[#e3e2e0] h-full flex flex-col justify-between select-none">
            <PipMiniPlayer />
          </div>,
          pipContainer
        )}

      {/* Completion Modal */}
      {showCompleteModal && activeSubject && (
        <TimerCompleteModal
          subject={activeSubject}
          scheduleEventId={scheduleEventId}
          flexibleGoalId={flexibleGoalId}
          taskId={taskId}
          seconds={stoppedSeconds}
          open={showCompleteModal}
          onClose={() => {
            setShowCompleteModal(false);
            setActiveSubject(null);
            setFlexibleGoalId(null);
            setSecondsElapsed(0);
            setTotalWorkSeconds(0);
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
