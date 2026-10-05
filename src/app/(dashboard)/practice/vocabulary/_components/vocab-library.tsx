"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Library } from "lucide-react";

interface VocabLibraryProps {
  allCourses: any[];
}

export function VocabLibrary({ allCourses }: VocabLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLevel, setActiveLevel] = useState<string>("ALL");

  const levels = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];

  const filteredCourses = allCourses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (course.subtitle && course.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesLevel = activeLevel === "ALL" || course.level === activeLevel;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
        <Library className="w-4 h-4" /> Thư viện từ vựng
      </h2>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Tìm kiếm lộ trình, bộ từ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeLevel === level 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {level === "ALL" ? "Tất cả" : level}
            </button>
          ))}
        </div>
      </div>

      {/* Library Grid */}
      {filteredCourses.length === 0 ? (
        <div className="p-8 text-center bg-white border border-gray-200 rounded-2xl">
          <p className="text-gray-500 text-sm">Không tìm thấy lộ trình phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            let totalWords = 0;
            course.wordSets.forEach((set: any) => {
              totalWords += set._count.words;
            });

            return (
              <Link key={course.id} href={`/practice/vocabulary/roadmap/${course.slug}`}>
                <div 
                  className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-200 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl bg-gray-50 w-12 h-12 flex items-center justify-center rounded-xl">
                      {course.icon || '📚'}
                    </div>
                    {course.isPro && (
                      <span className="px-2 py-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded uppercase">PRO</span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{course.title}</h3>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500 font-medium">
                    <span>{course.wordSets.length} bộ</span>
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>{totalWords} từ</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  );
}
