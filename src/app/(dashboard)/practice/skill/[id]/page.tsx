import React from "react";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Clock, Target, CheckCircle2, ChevronRight, Play } from "lucide-react";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Practice Details • ChronoMind",
};

const SKILL_DETAILS = {
  reading: {
    title: "Academic Reading",
    difficulty: "B2",
    estTime: "25 min",
    questions: 10,
    skills: ["Reading comprehension", "Vocabulary in context", "Inference"],
  },
  listening: {
    title: "Academic Listening",
    difficulty: "B2",
    estTime: "20 min",
    questions: 10,
    skills: ["Note-taking", "Detail recognition", "Main idea comprehension"],
  },
  grammar: {
    title: "Advanced Grammar",
    difficulty: "C1",
    estTime: "15 min",
    questions: 20,
    skills: ["Sentence structure", "Tense consistency", "Collocations"],
  },
  writing: {
    title: "Structured Writing",
    difficulty: "B2+",
    estTime: "40 min",
    questions: 2,
    skills: ["Argumentation", "Cohesion", "Task response"],
  },
  speaking: {
    title: "Fluency Practice",
    difficulty: "B2",
    estTime: "15 min",
    questions: 5,
    skills: ["Pronunciation", "Fluency", "Vocabulary resource"],
  },
  vocabulary: {
    title: "Academic Vocabulary",
    difficulty: "B2",
    estTime: "10 min",
    questions: 15,
    skills: ["Synonyms", "Contextual usage", "Spelling"],
  }
};

export default async function PracticeDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const skillId = params.id as keyof typeof SKILL_DETAILS;
  const detail = SKILL_DETAILS[skillId];

  if (!detail) {
    redirect("/practice");
  }

  // Get active subjects to link practice session
  const subjects = await prisma.subject.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    orderBy: { priority: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto py-12 animate-in fade-in duration-500">
      <Link href="/practice" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Practice
      </Link>

      <div className="space-y-8">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            {skillId}
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            {detail.title}
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Sharpen your skills through focused academic practice.
          </p>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-8 grid grid-cols-3 gap-6">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
              <Target className="w-4 h-4" /> Difficulty
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{detail.difficulty}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Estimated time
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{detail.estTime}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Questions
            </div>
            <div className="text-xl font-semibold text-gray-900 dark:text-gray-100">{detail.questions}</div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Skills trained</h2>
          <div className="flex flex-wrap gap-2">
            {detail.skills.map(s => (
              <span key={s} className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium border border-gray-100 dark:border-gray-800">
                {s}
              </span>
            ))}
          </div>
        </div>

        {subjects.length > 0 ? (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8 space-y-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Select Subject</h2>
            <form action={`/practice/skill/${skillId}/session`} className="flex gap-4">
              <select name="subjectId" className="flex-1 block w-full pl-4 pr-10 py-3 bg-white dark:bg-[#1a231d] border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2d6a4f] shadow-sm">
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button type="submit" className="px-8 py-3 bg-[#2d6a4f] text-white rounded-xl font-medium hover:bg-[#1b4332] transition-colors shadow-sm flex items-center gap-2">
                Start <Play className="w-4 h-4 fill-current" />
              </button>
            </form>
          </div>
        ) : (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 rounded-2xl border border-amber-200 dark:border-amber-800">
              Please <Link href="/subjects" className="font-bold underline">create a subject</Link> first before starting a practice session.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
