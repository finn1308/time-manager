"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X,
  Play,
  RotateCcw,
  Trophy,
  Heart,
  Volume2,
  VolumeX,
  Coins,
  Sparkles,
} from "lucide-react";
import { StudyWord } from "@/components/vocab/interactive-study-modal";

interface FlappyBirdGameProps {
  words: StudyWord[];
  wordSetId: string;
  onClose: () => void;
  onFinish?: (score: number) => void;
}

export function FlappyBirdGame({
  words,
  wordSetId,
  onClose,
  onFinish,
}: FlappyBirdGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // References to keep game loop in sync
  const stateRef = useRef({
    birdY: 200,
    birdVelocity: 0,
    pipes: [] as Array<{
      x: number;
      topHeight: number;
      gap: number;
      word: StudyWord;
      correctInTop: boolean;
      topText: string;
      bottomText: string;
      passed: boolean;
    }>,
    score: 0,
    lives: 3,
    wordIndex: 0,
    gameOver: false,
    frame: 0,
  });

  const currentWord = words[currentWordIndex % words.length] || null;

  const playChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  };

  const playHit = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  };

  // Jump Action
  const jump = useCallback(() => {
    if (stateRef.current.gameOver) return;
    stateRef.current.birdVelocity = -7.5;
  }, []);

  // Handle keyboard & touch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jump]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;

    // Reset loop state
    stateRef.current.birdY = canvas.height / 2;
    stateRef.current.birdVelocity = 0;
    stateRef.current.pipes = [];
    stateRef.current.score = 0;
    stateRef.current.lives = 3;
    stateRef.current.gameOver = false;
    stateRef.current.frame = 0;

    const spawnPipe = () => {
      const wordIdx = stateRef.current.wordIndex % words.length;
      const targetWord = words[wordIdx];
      const otherWords = words.filter((w) => w.id !== targetWord.id);
      const distractor = otherWords[Math.floor(Math.random() * otherWords.length)]?.meaning || "Sai";

      const correctInTop = Math.random() > 0.5;
      const gap = 160;
      const minPipeHeight = 60;
      const maxPipeHeight = canvas.height - gap - minPipeHeight;
      const topHeight = Math.floor(
        Math.random() * (maxPipeHeight - minPipeHeight) + minPipeHeight
      );

      stateRef.current.pipes.push({
        x: canvas.width + 40,
        topHeight,
        gap,
        word: targetWord,
        correctInTop,
        topText: correctInTop ? targetWord.meaning : distractor,
        bottomText: correctInTop ? distractor : targetWord.meaning,
        passed: false,
      });

      stateRef.current.wordIndex++;
      setCurrentWordIndex(stateRef.current.wordIndex);
    };

    // Initial pipe
    spawnPipe();

    const loop = () => {
      stateRef.current.frame++;

      // Physics
      stateRef.current.birdVelocity += 0.38; // gravity
      stateRef.current.birdY += stateRef.current.birdVelocity;

      // Floor & Ceiling bounds
      if (stateRef.current.birdY < 15) {
        stateRef.current.birdY = 15;
        stateRef.current.birdVelocity = 0;
      }
      if (stateRef.current.birdY > canvas.height - 30) {
        stateRef.current.birdY = canvas.height - 30;
        stateRef.current.birdVelocity = 0;
      }

      // Move pipes
      for (const pipe of stateRef.current.pipes) {
        pipe.x -= 2.2;

        // Check if bird passed pipe
        const birdX = 100;
        const pipeWidth = 70;

        if (!pipe.passed && pipe.x + pipeWidth < birdX) {
          pipe.passed = true;
          // Determine if bird flew through the correct gap
          // Top gap vs bottom gap
          const midY = pipe.topHeight + pipe.gap / 2;
          const flewInTop = stateRef.current.birdY < midY;
          const isCorrect = flewInTop === pipe.correctInTop;

          if (isCorrect) {
            playChime();
            stateRef.current.score += 10;
            setScore(stateRef.current.score);
          } else {
            playHit();
            stateRef.current.lives -= 1;
            setLives(stateRef.current.lives);
            if (stateRef.current.lives <= 0) {
              stateRef.current.gameOver = true;
              setIsGameOver(true);
            }
          }
        }
      }

      // Spawn next pipe every 160 frames
      if (stateRef.current.frame % 150 === 0) {
        spawnPipe();
      }

      // Remove off-screen pipes
      stateRef.current.pipes = stateRef.current.pipes.filter((p) => p.x > -150);

      // ================= DRAW =================
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, "#38bdf8");
      skyGrad.addColorStop(0.7, "#bae6fd");
      skyGrad.addColorStop(1, "#f0f9ff");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.beginPath();
      ctx.arc(120, 60, 35, 0, Math.PI * 2);
      ctx.arc(160, 50, 45, 0, Math.PI * 2);
      ctx.arc(200, 60, 35, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(420, 90, 30, 0, Math.PI * 2);
      ctx.arc(455, 80, 40, 0, Math.PI * 2);
      ctx.arc(490, 90, 30, 0, Math.PI * 2);
      ctx.fill();

      // Draw Pipes & Question Labels
      for (const pipe of stateRef.current.pipes) {
        const pipeWidth = 75;

        // Top Pipe (Green Arcade)
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, pipeWidth + 8, 20);

        // Bottom Pipe
        const bottomY = pipe.topHeight + pipe.gap;
        const bottomHeight = canvas.height - bottomY;
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(pipe.x, bottomY, pipeWidth, bottomHeight);
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(pipe.x - 4, bottomY, pipeWidth + 8, 20);

        // Floating Target Word Bubble between columns
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(pipe.x - 45, pipe.topHeight + 15, pipeWidth + 90, 40, 12);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(pipe.topText, pipe.x + pipeWidth / 2, pipe.topHeight + 40);

        // Bottom label
        ctx.beginPath();
        ctx.roundRect(pipe.x - 45, bottomY - 55, pipeWidth + 90, 40, 12);
        ctx.fill();
        ctx.fillStyle = "#0f172a";
        ctx.fillText(pipe.bottomText, pipe.x + pipeWidth / 2, bottomY - 30);
        ctx.restore();
      }

      // Draw Ground
      ctx.fillStyle = "#84cc16";
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
      ctx.fillStyle = "#65a30d";
      ctx.fillRect(0, canvas.height - 20, canvas.width, 4);

      // Draw Cute Yellow Bird
      const birdX = 100;
      const birdY = stateRef.current.birdY;

      ctx.save();
      ctx.translate(birdX, birdY);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, stateRef.current.birdVelocity * 0.08));
      ctx.rotate(angle);

      // Body (Chubby yellow circle)
      ctx.fillStyle = "#eab308";
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.ellipse(-6, 2, 10, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(7, -6, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(9, -6, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Beak (Orange triangle)
      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.moveTo(14, -2);
      ctx.lineTo(24, 2);
      ctx.lineTo(14, 6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      if (!stateRef.current.gameOver) {
        animationId = requestAnimationFrame(loop);
      }
    };

    animationId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, isGameOver, words, soundEnabled]);

  const restartGame = () => {
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setIsPlaying(true);
  };

  const handleEndGame = async () => {
    try {
      await fetch("/api/vocab/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wordSetId,
          mode: "SPECIAL",
          specialGameMode: "CHIM_CHAM_CHI",
          totalItems: Math.max(1, Math.round(score / 10)),
          correctItems: Math.round(score / 10),
          coinsDelta: 20,
        }),
      });
    } catch (e) {
      console.error(e);
    }
    if (onFinish) onFinish(score);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#18281d] w-full max-w-2xl rounded-3xl shadow-2xl border-2 border-amber-300 dark:border-amber-900/60 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#263d2e] flex items-center justify-between bg-gradient-to-r from-amber-400/10 via-yellow-400/10 to-transparent">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider flex items-center space-x-1">
              <Play className="w-3 h-3 fill-current" />
              <span>Chim Chăm Chỉ</span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-red-500 text-white font-extrabold text-[9px]">ARCADE</span>
            </span>
            <span className="text-xs font-bold text-gray-500">
              Điểm: <strong className="text-amber-600">{score}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Lives */}
            <div className="flex items-center space-x-1">
              {[...Array(3)].map((_, i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 ${
                    i < lives ? "text-red-500 fill-current" : "text-gray-300 dark:text-gray-600"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Target Word Prompter Banner */}
        {isPlaying && currentWord && (
          <div className="px-4 sm:px-6 py-2 sm:py-2.5 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
              🎯 Từ cần tìm: <strong className="text-sm font-black text-amber-600 dark:text-amber-400 uppercase tracking-wide">{currentWord.term}</strong>
            </span>
            <span className="text-[10px] sm:text-[11px] text-gray-500">
              Chạm màn hình hoặc nhấn <strong>Phím Cách</strong> để bay!
            </span>
          </div>
        )}

        {/* Canvas Game Arena */}
        <div
          onClick={jump}
          className="relative w-full max-w-full h-[280px] sm:h-[380px] bg-sky-200 cursor-pointer select-none overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={380}
            className="w-full h-full block touch-none"
          />

          {/* Start Screen Overlay */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center text-4xl shadow-xl animate-bounce">
                🐤
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black">Chim Chăm Chỉ Arcade</h3>
                <p className="text-xs text-amber-100 max-w-xs">
                  Bay qua cột và chọn đúng nghĩa từ vựng. Đừng đâm vào ống khói nhé!
                </p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPlaying(true);
                }}
                className="px-8 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-amber-950 font-black text-sm shadow-xl flex items-center space-x-2 transition-transform active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu bay</span>
              </button>
            </div>
          )}

          {/* Game Over Screen Overlay */}
          {isGameOver && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center text-white space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-3xl">
                💥
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black">Kết Thúc Lượt Bay!</h3>
                <p className="text-sm font-bold text-amber-300">
                  Tổng điểm của bạn: {score} điểm
                </p>
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                <Coins className="w-4 h-4 text-amber-400" />
                <span>+20 Xu thưởng Arcade</span>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    restartGame();
                  }}
                  className="px-6 py-2.5 rounded-full bg-amber-500 text-amber-950 font-bold text-xs hover:bg-amber-400 shadow-md flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bay lại</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEndGame();
                  }}
                  className="px-6 py-2.5 rounded-full bg-white/20 hover:bg-white/30 text-white font-bold text-xs"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
