"use client";

import React, { use } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, Clock, Target, ArrowRight, RotateCcw } from "lucide-react";

export default function PracticeResultPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ score?: string, total?: string, time?: string }> }) {
  const params = use(props.params);
  const searchParams = use(props.searchParams);
  
  const score = parseInt(searchParams.score || "0");
  const total = parseInt(searchParams.total || "1");
  const time = parseInt(searchParams.time || "0");
  
  const accuracy = Math.round((score / total) * 100);
  
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-2xl mx-auto py-16 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">Practice Complete</h1>
        <p className="text-gray-500 text-lg">Excellent work. Your session has been recorded.</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-6 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center justify-center gap-1.5">
            <Target className="w-4 h-4" /> Score
          </div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {score} <span className="text-xl text-gray-400">/ {total}</span>
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Accuracy
          </div>
          <div className="text-3xl font-semibold text-[#2d6a4f] dark:text-[#52b788]">
            {accuracy}%
          </div>
        </div>
        
        <div className="p-6 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 text-center shadow-sm">
          <div className="text-gray-500 text-sm font-medium mb-2 flex items-center justify-center gap-1.5">
            <Clock className="w-4 h-4" /> Time
          </div>
          <div className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {formatTime(time)}
          </div>
        </div>
      </div>

      <div className="p-8 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 mb-8 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-6">Performance Breakdown</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
              <span className="font-medium text-emerald-900 dark:text-emerald-100">Correct answers</span>
            </div>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">{score}</span>
          </div>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-500" />
              <span className="font-medium text-rose-900 dark:text-rose-100">Incorrect answers</span>
            </div>
            <span className="font-semibold text-rose-700 dark:text-rose-400">{total - score}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link 
          href={`/practice/skill/${params.id}`}
          className="px-8 py-3.5 bg-white dark:bg-[#1a231d] border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" /> Practice Again
        </Link>
        <Link 
          href="/practice"
          className="px-8 py-3.5 bg-[#2d6a4f] text-white rounded-xl font-medium hover:bg-[#1b4332] transition-colors flex items-center justify-center gap-2"
        >
          Back to Practice <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

    </div>
  );
}
