import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookOpen, Headphones, PenTool, Mic, Edit3, BookType, Search, ChevronRight, Play } from "lucide-react";

export const metadata = {
  title: "Practice • ChronoMind",
  description: "Academic learning workspace",
};

export default async function PracticePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  // Only real data from database
  const activeSubjects = await prisma.subject.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { priority: "desc" },
    take: 5,
  });

  const recentSessions = await prisma.studySession.findMany({
    where: { 
      userId: user.id,
      source: "PRACTICE_SESSION"
    },
    orderBy: { actualEnd: "desc" },
    take: 3,
    include: { subject: true },
  });

  // Calculate greeting
  const hour = new Date().getHours();
  let greeting = "Good evening";
  if (hour < 12) greeting = "Good morning";
  else if (hour < 18) greeting = "Good afternoon";

  const firstName = user.name?.split(' ')[0] || "Student";

  // Skills that are theoretically supported by our new architecture
  const practiceSkills = [
    { id: "reading", title: "Reading", desc: "Improve comprehension, speed and analysis.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: "listening", title: "Listening", desc: "Train your ability to understand spoken English.", icon: Headphones, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
    { id: "grammar", title: "Grammar", desc: "Strengthen accuracy through targeted exercises.", icon: PenTool, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
    { id: "writing", title: "Writing", desc: "Practice structured academic writing.", icon: Edit3, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
    { id: "speaking", title: "Speaking", desc: "Develop fluency and confidence.", icon: Mic, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
    { id: "vocabulary", title: "Vocabulary", desc: "Expand and reinforce useful vocabulary.", icon: BookType, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-900/20" }
  ];

  return (
    <div className="max-w-5xl mx-auto py-8 animate-in fade-in duration-500 space-y-12">
      
      {/* Header Section */}
      <section className="space-y-6">
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-gray-900 dark:text-gray-100">
            {greeting}, {firstName}.
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
            What would you like to practice today?
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-[#1a231d] border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] focus:border-transparent transition-all shadow-sm"
            placeholder="Search practice by subject, skill, or topic..."
          />
        </div>
      </section>

      {/* Continue Learning / Recent */}
      {recentSessions.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Continue Learning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="p-5 bg-white dark:bg-[#1a231d] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-300">
                      {session.subject?.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {Math.round(session.actualDurationSeconds / 60)} min
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {session.notes || "Practice Session"}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xs text-gray-500">Last practiced: {new Date(session.actualEnd).toLocaleDateString()}</span>
                  <Link href={`/practice/start?subjectId=${session.subject?.id}`} className="text-[#2d6a4f] dark:text-[#52b788] hover:text-[#1b4332] font-medium text-sm flex items-center gap-1">
                    Continue <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Practice Library */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100">Practice Library</h2>
          {activeSubjects.length > 0 && (
            <select className="bg-transparent border-none text-sm font-medium text-gray-500 cursor-pointer focus:ring-0">
              <option value="all">All Subjects</option>
              {activeSubjects.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          )}
        </div>

        {activeSubjects.length === 0 ? (
          <div className="p-12 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 text-center space-y-4 shadow-sm">
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Start your first practice session</h3>
            <p className="text-gray-500 max-w-md mx-auto">Create a subject first to begin practicing and tracking your progress.</p>
            <Link href="/subjects" className="inline-flex items-center justify-center px-6 py-3 bg-[#2d6a4f] text-white rounded-xl font-medium hover:bg-[#1b4332] transition-colors">
              Go to Subjects
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            {practiceSkills.map((skill) => {
              const Icon = skill.icon;
              return (
                <Link key={skill.id} href={`/practice/skill/${skill.id}`} className="group p-6 bg-white dark:bg-[#1a231d] rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md transition-all flex items-start gap-5">
                  <div className={`p-4 rounded-2xl ${skill.bg} ${skill.color} transition-transform group-hover:scale-105`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-[#2d6a4f] dark:group-hover:text-[#52b788] transition-colors">
                      {skill.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                      {skill.desc}
                    </p>
                  </div>
                  <div className="self-center opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
