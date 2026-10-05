"use client";

import { useState, useEffect } from "react";
import { X, Volume2, Check, RotateCcw, ChevronLeft, ChevronRight, Award, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePipTimer } from "@/components/timer/pip-timer-provider";

interface VocabFlashcardSessionProps {
  wordSetId: string;
  wordSetTitle: string;
  courseTitle: string;
  subjectId: string | null;
  words: {
    id: string;
    term: string;
    phonetic: string | null;
    meaning: string;
    partOfSpeech: string | null;
    exampleSentence: string | null;
    status: string;
  }[];
}

export function VocabFlashcardSession({ wordSetId, wordSetTitle, courseTitle, subjectId, words }: VocabFlashcardSessionProps) {
  const router = useRouter();
  const { startTimer, stopTimer, activeSubject } = usePipTimer();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [startTime] = useState<Date>(new Date());
  
  const [results, setResults] = useState<{wordId: string, isKnown: boolean}[]>([]);

  // Start PIP Timer when session starts
  useEffect(() => {
    if (!timerState.isRunning) {
      startTimer({
        taskId: `vocab_${wordSetId}`,
        title: `Học từ vựng: ${wordSetTitle}`,
        type: "VOCAB",
        subjectId: subjectId || undefined,
      });
    }
  }, []);

  const currentWord = words[currentIndex];
  const progressPercent = Math.round((currentIndex / words.length) * 100);

  const handleNext = (isKnown: boolean) => {
    setResults(prev => [...prev, { wordId: currentWord.id, isKnown }]);
    
    if (currentIndex < words.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      finishSession();
    }
  };

  const finishSession = async () => {
    const endTime = new Date();
    const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000);
    
    // Stop PIP timer if we started it for this vocab task
    if (timerState.taskId === `vocab_${wordSetId}`) {
      stopTimer();
    }

    setIsFinished(true);

    try {
      // Gọi API để lưu session và cập nhật StudyRecord + UserWordProgress
      await fetch('/api/practice/vocabulary/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wordSetId,
          subjectId,
          durationSeconds,
          results, // {wordId, isKnown}[]
        })
      });
    } catch (e) {
      console.error("Failed to save session", e);
    }
  };

  if (words.length === 0) {
    return (
      <div className="h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Bộ từ trống</h2>
          <p className="text-gray-500 mb-6">Chưa có từ vựng nào trong bộ này để luyện tập.</p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const correctCount = results.filter(r => r.isKnown).length;
    const accuracy = Math.round((correctCount / words.length) * 100);
    const durationSeconds = Math.round((new Date().getTime() - startTime.getTime()) / 1000);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = durationSeconds % 60;

    return (
      <div className="min-h-screen bg-[#FDFDFD] flex flex-col items-center justify-center p-4 py-12">
        <div className="w-full max-w-lg">
          <div className="bg-white p-8 md:p-10 rounded-[32px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Award className="w-10 h-10 text-emerald-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hoàn thành!</h1>
            <p className="text-gray-500 font-medium mb-8">Bạn đã ôn tập xong bộ "{wordSetTitle}"</p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Đã thuộc</div>
                <div className="text-2xl font-bold text-emerald-600">{correctCount} / {words.length}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Độ chính xác</div>
                <div className="text-2xl font-bold text-blue-600">{accuracy}%</div>
              </div>
              <div className="col-span-2 p-4 bg-gray-50 rounded-2xl border border-gray-100/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 font-medium">
                  <Clock className="w-5 h-5 text-gray-400" /> Thời gian học
                </div>
                <div className="text-xl font-bold text-gray-900">{minutes}m {seconds}s</div>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/practice/vocabulary/set/${wordSetId}`)}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition-colors text-lg"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F8FAFC] z-50 flex flex-col">
      {/* Top Bar */}
      <div className="h-16 bg-white border-b border-gray-200 px-4 md:px-8 flex items-center justify-between shrink-0">
        <button 
          onClick={() => {
            if (timerState.taskId === `vocab_${wordSetId}`) stopTimer();
            router.back();
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium transition-colors p-2 -ml-2 rounded-lg hover:bg-gray-100"
        >
          <X className="w-5 h-5" /> Thoát
        </button>
        
        <div className="flex flex-col items-center flex-1 mx-4 max-w-xl hidden md:flex">
          <div className="text-sm font-bold text-gray-900 mb-2 truncate max-w-[200px]">{courseTitle}</div>
          <div className="w-full flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 shrink-0">{currentIndex + 1}</span>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden shrink-0">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-400 shrink-0">{words.length}</span>
          </div>
        </div>
        
        <div className="w-[88px]" /> {/* Spacer */}
      </div>

      {/* Main Flashcard Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 perspective-1000">
        
        <div 
          key={currentWord.id + (isFlipped ? '-back' : '-front')}
          className="w-full max-w-2xl bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-gray-100 min-h-[400px] flex flex-col cursor-pointer transition-transform duration-300 transform"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            // FRONT
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
              {currentWord.partOfSpeech && (
                <div className="absolute top-8 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold uppercase tracking-widest">
                  {currentWord.partOfSpeech}
                </div>
              )}
              
              <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">{currentWord.term}</h2>
              
              {currentWord.phonetic && (
                <p className="text-xl text-gray-400 font-mono mb-8">{currentWord.phonetic}</p>
              )}
              
              <div className="absolute bottom-8 text-sm font-medium text-gray-400 flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Click để lật thẻ
              </div>
            </div>
          ) : (
            // BACK
            <div className="flex-1 flex flex-col justify-center p-8 md:p-12 text-center relative bg-emerald-50/30 rounded-[2rem]">
              <h3 className="text-3xl font-bold text-emerald-700 mb-6">{currentWord.meaning}</h3>
              
              {currentWord.exampleSentence && (
                <div className="bg-white/80 p-6 rounded-2xl border border-emerald-100/50">
                  <p className="text-lg font-medium text-gray-700 mb-2 italic">
                    "{currentWord.exampleSentence}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions Area */}
        <div className="mt-8 md:mt-12 w-full max-w-2xl flex flex-col items-center">
          {!isFlipped ? (
            <div 
              className="text-gray-400 font-medium flex items-center gap-2 bg-white px-6 py-3 rounded-full shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setIsFlipped(true)}
            >
              Nhấn Space hoặc Click để xem nghĩa
            </div>
          ) : (
            <div 
              className="flex items-center gap-4 w-full transition-all"
            >
              <button 
                onClick={() => handleNext(false)}
                className="flex-1 py-4 bg-white border border-red-200 text-red-600 rounded-2xl font-bold text-lg hover:bg-red-50 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5 stroke-[3]" /> Quên
                </div>
              </button>
              <button 
                onClick={() => handleNext(true)}
                className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-colors shadow-sm"
              >
                <div className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 stroke-[3]" /> Đã thuộc
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
