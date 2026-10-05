"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, CheckCircle2, Inbox } from "lucide-react";
import Link from "next/link";

export default function PracticeSessionPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ subjectId?: string }> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  const router = useRouter();

  // No mock data allowed per requirements. 
  // We assume questions would be fetched from API here.
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(1500); // 25 min in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API fetch delay
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, questions]);

  const currentQ = questions[currentQIndex];
  const progress = questions.length > 0 ? ((currentQIndex + 1) / questions.length) * 100 : 0;

  const handleSelect = (optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [currentQIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQIndex > 0) {
      setCurrentQIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Calculate score
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    const duration = 1500 - timeLeft;

    try {
      await fetch("/api/practice/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: searchParams.subjectId,
          skillId: params.id,
          score: correct,
          total: questions.length,
          durationSeconds: duration
        })
      });
    } catch (error) {
      console.error(error);
    }

    router.push(`/practice/skill/${params.id}/result?score=${correct}&total=${questions.length}&time=${duration}`);
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-[#101c14] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#2d6a4f] border-t-transparent rounded-full" />
      </div>
    );
  }

  // EMPTY STATE (NO MOCK DATA)
  if (questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-white dark:bg-[#101c14] flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
        <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6">
          <Inbox className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 mb-2">No Questions Available</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md text-center mb-8">
          The practice bank for this module is currently empty. Please check back later or add content through the administration panel.
        </p>
        <Link 
          href={`/practice/skill/${params.id}`} 
          className="px-6 py-3 bg-[#2d6a4f] text-white rounded-xl font-medium hover:bg-[#1b4332] transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-[#101c14] flex flex-col animate-in fade-in duration-300">
      
      {/* Top Bar */}
      <div className="h-16 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 shrink-0 bg-white dark:bg-[#101c14]">
        <Link href={`/practice/skill/${params.id}`} className="text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-2 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Exit
        </Link>
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-mono font-medium bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <Clock className="w-4 h-4 text-gray-500" /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto py-12 px-6">
          
          <div className="mb-12">
            <div className="flex justify-between text-sm font-medium text-gray-500 mb-4">
              <span>Question {currentQIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-[#2d6a4f] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="text-2xl font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
              {currentQ.text}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((opt: string, i: number) => {
                const isSelected = answers[currentQIndex] === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center gap-4 ${
                      isSelected 
                        ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-[#2d6a4f] dark:border-[#52b788] shadow-sm" 
                        : "bg-white dark:bg-[#1a231d] border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className={`text-lg ${isSelected ? "text-[#1b4332] dark:text-[#9cd1b1] font-medium" : "text-gray-700 dark:text-gray-300"}`}>
                      {opt}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="h-20 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between px-8 shrink-0 bg-white dark:bg-[#101c14]">
        <div>
          {currentQIndex > 0 && (
            <button onClick={handlePrev} className="px-6 py-2.5 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-medium transition-colors">
              Previous
            </button>
          )}
        </div>
        
        {currentQIndex < questions.length - 1 ? (
          <button 
            onClick={handleNext}
            disabled={answers[currentQIndex] === undefined}
            className="px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next Question
          </button>
        ) : (
          <button 
            onClick={handleSubmit}
            disabled={answers[currentQIndex] === undefined || isSubmitting}
            className="px-8 py-3 bg-[#2d6a4f] text-white rounded-xl font-medium hover:bg-[#1b4332] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSubmitting ? "Submitting..." : (
              <>Submit Practice <CheckCircle2 className="w-4 h-4" /></>
            )}
          </button>
        )}
      </div>

    </div>
  );
}
