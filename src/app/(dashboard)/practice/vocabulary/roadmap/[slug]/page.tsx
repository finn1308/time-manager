import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, Play, Lock, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap Detail | Practice",
  description: "Vocabulary roadmap details",
};

export default async function RoadmapDetailPage({ params }: { params: { slug: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const course = await db.vocabCourse.findUnique({
    where: { slug: params.slug },
    include: {
      wordSets: {
        include: {
          words: true,
          userProgresses: {
            where: { userId: user.id },
          }
        },
        orderBy: { orderNumber: "asc" }
      },
      enrollments: {
        where: { userId: user.id }
      }
    }
  });

  if (!course) redirect("/practice/vocabulary");

  const isPinned = course.enrollments.length > 0 && course.enrollments[0].isPinned;
  let totalWordsInCourse = 0;
  let totalLearnedInCourse = 0;

  course.wordSets.forEach((set: any) => {
    totalWordsInCourse += set.words.length;
    if (set.userProgresses?.[0]) {
      totalLearnedInCourse += set.userProgresses[0].completedWords;
    }
  });

  const progressPercent = totalWordsInCourse > 0 
    ? Math.round((totalLearnedInCourse / totalWordsInCourse) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link href="/practice/vocabulary" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
          </Link>
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: course.coverColor || '#10b981' }} />
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{course.icon || '📚'}</span>
                  <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                </div>
                {course.subtitle && <p className="text-gray-500 mt-1">{course.subtitle}</p>}
                
                <div className="flex gap-2 mt-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                    {course.wordSets.length} bộ từ
                  </span>
                  <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-semibold text-gray-600">
                    {totalWordsInCourse} từ vựng
                  </span>
                </div>
              </div>
              
              {/* Note: This should ideally be a client component for toggling, but we'll show state for now */}
              <button className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                isPinned ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                {isPinned ? '📌 Đã ghim' : 'Ghim lộ trình'}
              </button>
            </div>

            <div className="mt-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-gray-500">Tiến độ: {totalLearnedInCourse}/{totalWordsInCourse} từ</span>
                <span className="text-emerald-600">{progressPercent}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, backgroundColor: course.coverColor || '#10b981' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Word Sets Grid */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Các bộ từ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.wordSets.map((set: any, index: number) => {
              const progress = set.userProgresses?.[0];
              const learned = progress ? progress.completedWords : 0;
              const total = set.words.length;
              const isCompleted = total > 0 && learned === total;
              const setProgressPercent = total > 0 ? Math.round((learned / total) * 100) : 0;
              
              // Simple unlock logic: first set is always unlocked, others are unlocked if previous is completed (or if user is pro, etc.)
              // For now, let's keep all unlocked for simplicity unless it's explicitly locked by isPro
              const isLocked = set.isPro && !user.isPro; 

              return (
                <Link 
                  key={set.id} 
                  href={isLocked ? '#' : `/practice/vocabulary/set/${set.id}`}
                  className={`relative p-5 rounded-2xl border ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white hover:border-gray-300'} transition-all flex flex-col ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isLocked && (
                    <div className="absolute top-3 right-3 text-amber-500">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                  {isCompleted && (
                    <div className="absolute top-3 right-3 text-emerald-500">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{set.title}</h3>
                      <p className="text-xs text-gray-500">{total} từ</p>
                    </div>
                  </div>

                  <div className="mt-auto">
                    {setProgressPercent > 0 && !isCompleted && (
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${setProgressPercent}%` }} />
                      </div>
                    )}
                    {isCompleted ? (
                      <span className="text-xs font-semibold text-emerald-600">Đã hoàn thành</span>
                    ) : (
                      <span className="text-xs font-medium text-gray-400">
                        {learned > 0 ? `Đang học (${setProgressPercent}%)` : 'Chưa bắt đầu'}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
