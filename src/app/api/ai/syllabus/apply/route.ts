import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addWeeks, addDays } from "date-fns";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      importId,
      semesterId,
      createSubject = true,
      createAssignments = true,
      createExams = true,
      createKnowledgeNodes = true,
      subjectNameOverride,
    } = await req.json();

    const record = await prisma.syllabusImport.findFirst({
      where: { id: importId, userId: user.id },
    });

    if (!record) {
      return NextResponse.json({ error: "Không tìm thấy bản ghi đề cương" }, { status: 404 });
    }

    const data = JSON.parse(record.parsedDataJson);
    const subjectName = subjectNameOverride || data.courseName || "Môn học mới";

    let subject: any = null;

    if (createSubject) {
      // Find or create subject
      subject = await prisma.subject.create({
        data: {
          userId: user.id,
          name: subjectName,
          code: data.courseCode || null,
          credits: Number(data.credits) || 3,
          lecturer: data.lecturer || null,
          semesterId: semesterId || null,
          syllabus: record.rawText.slice(0, 5000),
          gradeWeightJson: JSON.stringify(data.gradingStructure),
          status: "ACTIVE",
          color: "#408257",
        },
      });

      // Update import record
      await prisma.syllabusImport.update({
        where: { id: record.id },
        data: { subjectId: subject.id, status: "APPLIED" },
      });
    }

    const createdItems = {
      subject: subject?.name,
      assignmentsCount: 0,
      examsCount: 0,
      knowledgeNodesCount: 0,
    };

    const now = new Date();

    // 1. Create Assignments if requested
    if (createAssignments && Array.isArray(data.assignments)) {
      for (const item of data.assignments) {
        const deadline = addWeeks(now, item.weekNumber || 4);
        await prisma.assignment.create({
          data: {
            userId: user.id,
            subjectId: subject ? subject.id : null,
            semesterId: semesterId || null,
            title: item.title,
            description: item.description || null,
            deadline,
            priority: "HIGH",
            estimatedWorkloadMinutes: 180,
            status: "PLANNING",
          },
        });
        createdItems.assignmentsCount++;
      }
    }

    // 2. Create Exams if requested
    if (createExams && Array.isArray(data.exams)) {
      for (const exam of data.exams) {
        const examDate = addWeeks(now, exam.weekNumber || 8);
        await prisma.examPreparation.create({
          data: {
            userId: user.id,
            subjectId: subject ? subject.id : null,
            title: exam.title,
            examDate,
            targetScore: 8.5,
            currentScore: 5.0,
            availableStudyHours: 40.0,
            currentPhase: "FOUNDATION",
            readinessScore: 25.0,
            status: "ACTIVE",
            riskLevel: "MODERATE",
          },
        });

        // Also add calendar event for the exam
        await prisma.calendarEvent.create({
          data: {
            userId: user.id,
            subjectId: subject ? subject.id : null,
            title: `📅 ${exam.title}`,
            description: `Kỳ thi theo đề cương môn ${subjectName}`,
            startTime: examDate,
            endTime: addDays(examDate, 0), // 2 hour exam
            type: "EXAM",
            isLocked: true,
          },
        });

        createdItems.examsCount++;
      }
    }

    // 3. Create Knowledge Nodes (Concepts & Topics)
    if (createKnowledgeNodes && Array.isArray(data.weeklyTopics)) {
      for (let i = 0; i < data.weeklyTopics.length; i++) {
        const topic = data.weeklyTopics[i];
        await prisma.knowledgeNode.create({
          data: {
            userId: user.id,
            subjectId: subject ? subject.id : null,
            title: topic.title,
            chapter: `Tuần ${topic.week || i + 1}`,
            topic: topic.title,
            description: topic.description || null,
            masteryScore: 0.0,
            importance: i < 5 ? "CORE" : "ELECTIVE",
            order: i + 1,
          },
        });
        createdItems.knowledgeNodesCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công đề cương môn ${subjectName}`,
      createdItems,
    });
  } catch (err: any) {
    console.error("Error applying syllabus:", err);
    return NextResponse.json({ error: err.message || "Lỗi lưu dữ liệu đề cương" }, { status: 500 });
  }
}
