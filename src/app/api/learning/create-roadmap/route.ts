import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { generateLearningRoadmapPackage } from "@/lib/ai/learning-generator";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId, subjectId, customText, targetDays = 14, targetGrade = "A" } = await req.json();

    const parsedDays = Math.max(1, Math.min(60, parseInt(targetDays, 10) || 14));

    // 1. Gather text content to analyze
    let documentText = customText?.trim() || "";
    let associatedSubjectName: string | undefined;

    if (subjectId) {
      const subject = await prisma.subject.findFirst({
        where: { id: subjectId, userId: user.id },
      });
      if (subject) {
        associatedSubjectName = subject.name;
        if (!documentText && subject.description) {
          documentText = `Môn học: ${subject.name}\n${subject.description}`;
        }
      }
    }

    if (documentId) {
      const doc = await prisma.document.findFirst({
        where: { id: documentId, userId: user.id },
      });
      if (doc && doc.extractedText) {
        documentText = doc.extractedText;
      }
    }

    if (!documentText || documentText.length < 20) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp tài liệu học tập hoặc chọn tài liệu đã tải lên." },
        { status: 400 }
      );
    }

    // 2. Fetch User AI API Key if configured
    let plainApiKey: string | null = null;
    let provider: string | null = null;

    const keyRecord = await prisma.userApiKey.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (keyRecord) {
      try {
        plainApiKey = decryptApiKey(keyRecord.encryptedKey, keyRecord.iv, keyRecord.authTag);
        provider = keyRecord.provider;
      } catch (keyErr) {
        console.warn("Failed to decrypt user API key, using local educational engine:", keyErr);
      }
    }

    // 3. Generate Learning Package (Course + Day Stages + Lessons + Quizzes)
    const learningPackage = await generateLearningRoadmapPackage({
      documentText,
      targetDays: parsedDays,
      targetGrade: String(targetGrade).toUpperCase(),
      subjectName: associatedSubjectName,
      apiKey: plainApiKey,
      provider,
    });

    // 4. Save to Database using atomic nested create
    const roadmap = await prisma.learningRoadmap.create({
      data: {
        userId: user.id,
        subjectId: subjectId || null,
        documentId: documentId || null,
        title: learningPackage.courseTitle,
        targetDays: parsedDays,
        targetGrade: learningPackage.targetGrade,
        dailyMinutes:
          Math.round(
            learningPackage.stages.reduce((acc, s) => acc + s.estimatedMinutes, 0) /
              (learningPackage.stages.length || 1)
          ) || 20,
        totalStages: learningPackage.stages.length,
        completedStages: 0,
        totalXp: 0,
        status: "ACTIVE",
        stages: {
          create: learningPackage.stages.map((stg) => ({
            dayNumber: stg.dayNumber,
            title: stg.title,
            description: stg.description,
            estimatedMinutes: stg.estimatedMinutes,
            xpReward: stg.xpReward,
            isUnlocked: stg.dayNumber === 1,
            isCompleted: false,
            lessonContent: stg.lessonContent,
            keyConcepts: JSON.stringify(stg.keyConcepts),
            quizzes: {
              create: [
                {
                  userId: user.id,
                  subjectId: subjectId || null,
                  documentId: documentId || null,
                  title: `Quiz: ${stg.title}`,
                  description: `Bài kiểm tra hiểu bản chất và phản xạ cho ${stg.title}`,
                  difficulty: targetGrade === "A" || targetGrade === "A+" ? "HARD" : "MEDIUM",
                  questionCount: stg.questions.length,
                  status: "PUBLISHED",
                  questions: {
                    create: stg.questions.map((q) => ({
                      question: q.question,
                      options: JSON.stringify(q.options),
                      correctAnswer: q.correctAnswer,
                      hint: q.hint,
                      rationale: q.rationale,
                      difficulty: q.difficulty,
                      questionType: q.questionType,
                      topic: q.topic,
                      sourceReference: q.sourceReference,
                      sourcePage: q.sourcePage || null,
                    })),
                  },
                },
              ],
            },
          })),
        },
      },
    });

    return NextResponse.json({
      success: true,
      roadmapId: roadmap.id,
      courseTitle: roadmap.title,
      targetDays: roadmap.targetDays,
      targetGrade: roadmap.targetGrade,
      totalStages: roadmap.totalStages,
      providerUsed: learningPackage.providerUsed,
    });
  } catch (err: any) {
    console.error("Create roadmap error:", err);
    return NextResponse.json({ error: err.message || "Lỗi tạo lộ trình học tập" }, { status: 500 });
  }
}
