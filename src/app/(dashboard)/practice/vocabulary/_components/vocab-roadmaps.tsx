"use client";

import Link from "next/link";
import { BookOpen, Pin } from "lucide-react";

interface VocabRoadmapsProps {
  pinnedCourses: any[];
}

export function VocabRoadmaps({ pinnedCourses }: VocabRoadmapsProps) {
  if (pinnedCourses.length === 0) {
    return (
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Pin className="w-4 h-4" /> Lộ trình đã ghim
        </h2>
        <div className="p-8 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center justify-center text-center">
          <BookOpen className="w-8 h-8 text-gray-400 mb-3" />
          <h3 className="text-sm font-semibold text-gray-900">Chưa ghim lộ trình nào</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Bạn có thể ghim các lộ trình học yêu thích để truy cập nhanh từ đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Pin className="w-4 h-4" /> Lộ trình đã ghim
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pinnedCourses.map((enrollment) => {
          const course = enrollment.course;
          
          let totalWords = 0;
          let learnedWords = 0;
          let totalSets = course.wordSets.length;
          
          course.wordSets.forEach((set: any) => {
            totalWords += set.words.length;
            const progress = set.userProgresses?.[0];
            if (progress) {
              learnedWords += progress.completedWords;
            }
          });
          
          const progressPercent = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;
          
          return (
            <Link key={enrollment.id} href={`/practice/vocabulary/roadmap/${course.slug}`}>
              <div 
                className="p-5 rounded-2xl border border-gray-200/80 bg-white shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                {/* Decoration strip */}
                <div 
                  className="absolute top-0 left-0 w-full h-1" 
                  style={{ backgroundColor: course.coverColor || '#10b981' }} 
                />
                
                <div className="flex justify-between items-start mb-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{course.icon || '📚'}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{course.title}</h3>
                      {course.subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{course.subtitle}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                    {totalSets} bộ từ
                  </span>
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-semibold">
                    {totalWords} từ vựng
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-500">Tiến độ: {learnedWords}/{totalWords} từ</span>
                    <span className="text-emerald-600 font-bold">{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${progressPercent}%`, 
                        backgroundColor: course.coverColor || '#10b981' 
                      }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
