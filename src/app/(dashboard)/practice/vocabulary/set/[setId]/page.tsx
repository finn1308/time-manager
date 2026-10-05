import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { ChevronLeft, Play, LayoutGrid, Check, Volume2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Vocabulary Set | Practice",
  description: "Vocabulary set details",
};

export default async function VocabSetDetailPage({ params }: { params: { setId: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const wordSet = await db.wordSet.findUnique({
    where: { id: params.setId },
    include: {
      course: true,
      words: {
        orderBy: { order: "asc" }
      },
      userProgresses: {
        where: { userId: user.id }
      }
    }
  });

  if (!wordSet) redirect("/practice/vocabulary");

  // Xử lý status của từng từ (dựa trên userWordProgress)
  const userWordsProgress = await db.userWordProgress.findMany({
    where: {
      userId: user.id,
      wordSetId: wordSet.id,
    }
  });

  const progressMap = new Map();
  userWordsProgress.forEach(p => progressMap.set(p.wordId, p));

  const totalWords = wordSet.words.length;
  let learnedCount = 0;
  
  const wordsWithProgress = wordSet.words.map(word => {
    const progress = progressMap.get(word.id);
    if (progress && progress.status === "MASTERED") learnedCount++;
    return {
      ...word,
      progress: progress || null,
    };
  });

  const progressPercent = totalWords > 0 ? Math.round((learnedCount / totalWords) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 space-y-8">
        {/* Navigation & Header */}
        <div>
          <Link href={`/practice/vocabulary/roadmap/${wordSet.course.slug}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại lộ trình
          </Link>
          
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-end">
              <div className="flex-1 mr-8">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-wider mb-4">
                  <LayoutGrid className="w-3 h-3" />
                  Bộ từ {wordSet.orderNumber}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{wordSet.title}</h1>
                <p className="text-gray-500 text-sm mb-6">{totalWords} từ vựng • {learnedCount}/{totalWords} đã thuộc ({progressPercent}%)</p>
                
                <div className="h-2 w-full max-w-md bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%`, backgroundColor: wordSet.course.coverColor || '#10b981' }}
                  />
                </div>
              </div>
              
              <div className="flex-shrink-0">
                <Link href={`/practice/vocabulary/session/${wordSet.id}`}>
                  <button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold shadow-sm transition-colors">
                    <Play className="w-5 h-5 fill-current" />
                    {learnedCount === 0 ? "Bắt đầu học" : learnedCount === totalWords ? "Ôn tập lại" : "Tiếp tục học"}
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Word List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách từ vựng</h2>
          </div>
          
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {wordsWithProgress.map((word, index) => {
              const isMastered = word.progress?.status === "MASTERED";
              return (
                <div 
                  key={word.id} 
                  className={`flex items-start gap-4 p-5 ${index !== wordsWithProgress.length - 1 ? 'border-b border-gray-100' : ''} hover:bg-gray-50/50 transition-colors`}
                >
                  <div className="pt-1">
                    {isMastered ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-semibold">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    {/* Left col: Term & Phonetic */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-gray-900">{word.term}</h3>
                        {word.partOfSpeech && (
                          <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                            {word.partOfSpeech}
                          </span>
                        )}
                        {/* Fake audio button for UI */}
                        <button className="text-gray-400 hover:text-emerald-500 transition-colors p-1">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                      {word.phonetic && (
                        <p className="text-sm text-gray-500 font-mono mt-0.5">{word.phonetic}</p>
                      )}
                    </div>
                    
                    {/* Right col: Meaning & Example */}
                    <div>
                      <p className="font-medium text-gray-900 mb-1">{word.meaning}</p>
                      {word.exampleSentence && (
                        <div className="text-sm text-gray-600 italic">
                          "{word.exampleSentence}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {wordsWithProgress.length === 0 && (
              <div className="p-12 text-center">
                <p className="text-gray-500">Chưa có từ vựng nào trong bộ này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
