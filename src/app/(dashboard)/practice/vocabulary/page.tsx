import { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { VocabDashboard } from "./_components/vocab-dashboard";
import { VocabRoadmaps } from "./_components/vocab-roadmaps";
import { VocabLibrary } from "./_components/vocab-library";

export const metadata: Metadata = {
  title: "Vocabulary | Practice",
  description: "Modern academic vocabulary learning system",
};

export default async function VocabularyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // 1. Lấy dữ liệu cho Dashboard Overview
  // Số từ đã thuộc (MASTERED)
  const learnedWordsCount = await db.userWordProgress.count({
    where: {
      userId: user.id,
      status: "MASTERED",
    },
  });

  // Số từ cần ôn hôm nay
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  
  const dueWordsCount = await db.userWordProgress.count({
    where: {
      userId: user.id,
      nextReviewDate: {
        lte: endOfDay,
      },
    },
  });

  // Tổng thời gian học Vocabulary từ StudySession
  // Chú ý: Lấy các StudySession có source chứa VOCAB
  const studySessions = await db.studySession.findMany({
    where: {
      userId: user.id,
      source: "VOCAB_PRACTICE",
    },
    select: {
      actualDurationSeconds: true,
    }
  });
  
  const totalStudyMinutes = Math.floor(
    studySessions.reduce((acc, curr) => acc + curr.actualDurationSeconds, 0) / 60
  );

  // Lộ trình đã ghim
  const pinnedCourses = await db.userCourseEnrollment.findMany({
    where: {
      userId: user.id,
      isPinned: true,
    },
    include: {
      course: {
        include: {
          wordSets: {
            include: {
              words: true,
              userProgresses: {
                where: { userId: user.id },
              },
            },
          },
        },
      },
    },
  });

  // Tất cả lộ trình để filter / search
  const allCourses = await db.vocabCourse.findMany({
    where: {
      isPublished: true,
    },
    include: {
      wordSets: {
        include: {
          _count: {
            select: { words: true }
          },
          userProgresses: {
            where: { userId: user.id },
          }
        }
      }
    },
    orderBy: {
      order: "asc",
    },
  });

  // Tính tổng số từ trong tất cả lộ trình đang học
  const enrolledCourses = await db.userCourseEnrollment.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  
  const enrolledCourseIds = enrolledCourses.map(e => e.courseId);
  const totalWordsInEnrolled = await db.vocabWord.count({
    where: {
      wordSet: {
        courseId: {
          in: enrolledCourseIds,
        }
      }
    }
  });

  // Progress tính bằng (learned / total) * 100
  const progressPercent = totalWordsInEnrolled > 0 
    ? Math.round((learnedWordsCount / totalWordsInEnrolled) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-24">
      <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">Vocabulary</h1>
          <p className="text-gray-500 mt-2">Xây dựng vốn từ vựng học thuật một cách có hệ thống.</p>
        </div>

        {/* Dashboard Stats */}
        <VocabDashboard 
          progress={progressPercent}
          learnedCount={learnedWordsCount}
          totalWords={totalWordsInEnrolled}
          dueToday={dueWordsCount}
          streakDays={user.streakDays}
          studyMinutes={totalStudyMinutes}
        />

        {/* Quick Access */}
        {/* <QuickAccess /> sẽ được tích hợp trong client component hoặc viết riêng */}

        {/* Pinned Roadmaps */}
        <VocabRoadmaps pinnedCourses={pinnedCourses} />

        {/* Filter & Library */}
        <VocabLibrary allCourses={allCourses} />
      </div>
    </div>
  );
}
