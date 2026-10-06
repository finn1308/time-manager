import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    if (!body || !body.data) {
      return NextResponse.json({ error: "File sao lưu không hợp lệ. Thiếu trường 'data'." }, { status: 400 });
    }

    const {
      degreeProgram,
      academicYears = [],
      semesters = [],
      subjects = [],
      tasks = [],
      notes = [],
      habits = [],
      calendarEvents = [],
      skills = [],
      projects = [],
      certificates = [],
      careerApplications = [],
    } = body.data;

    let importedYearsCount = 0;
    let importedSemestersCount = 0;
    let importedSubjectsCount = 0;
    let importedTasksCount = 0;
    let importedNotesCount = 0;
    let importedHabitsCount = 0;
    let importedEventsCount = 0;
    let importedSkillsCount = 0;
    let importedProjectsCount = 0;
    let importedCertificatesCount = 0;
    let importedAppsCount = 0;

    // 0. Import Degree Program if present
    if (degreeProgram) {
      await prisma.degreeProgram.upsert({
        where: { userId: user.id },
        update: {
          major: degreeProgram.major,
          faculty: degreeProgram.faculty,
          university: degreeProgram.university,
          totalCreditsRequired: degreeProgram.totalCreditsRequired || 130,
          targetGpa: degreeProgram.targetGpa || 3.6,
          currentGpa: degreeProgram.currentGpa || 0,
          currentCredits: degreeProgram.currentCredits || 0,
          graduationYear: degreeProgram.graduationYear || null,
        },
        create: {
          userId: user.id,
          major: degreeProgram.major || "Công nghệ Thông tin",
          faculty: degreeProgram.faculty || "Khoa CNTT",
          university: degreeProgram.university || "Đại học",
          totalCreditsRequired: degreeProgram.totalCreditsRequired || 130,
          targetGpa: degreeProgram.targetGpa || 3.6,
          currentGpa: degreeProgram.currentGpa || 0,
          currentCredits: degreeProgram.currentCredits || 0,
          graduationYear: degreeProgram.graduationYear || null,
        },
      });
    }

    // 1. Import Academic Years
    const yearIdMapping: Record<string, string> = {};
    for (const yr of academicYears) {
      if (!yr.name) continue;
      const existing = await prisma.academicYear.findFirst({
        where: { userId: user.id, yearNumber: yr.yearNumber || 1 },
      });

      if (existing) {
        yearIdMapping[yr.id] = existing.id;
      } else {
        const created = await prisma.academicYear.create({
          data: {
            userId: user.id,
            yearNumber: yr.yearNumber || 1,
            name: yr.name,
            startDate: yr.startDate ? new Date(yr.startDate) : new Date(),
            endDate: yr.endDate ? new Date(yr.endDate) : new Date(),
            status: yr.status || "ACTIVE",
          },
        });
        yearIdMapping[yr.id] = created.id;
        importedYearsCount++;
      }
    }

    // 2. Import Semesters
    const semesterIdMapping: Record<string, string> = {};
    for (const sem of semesters) {
      if (!sem.name) continue;
      const mappedYearId = sem.academicYearId ? yearIdMapping[sem.academicYearId] : null;
      if (!mappedYearId) continue;

      const existing = await prisma.semester.findFirst({
        where: { userId: user.id, academicYearId: mappedYearId, name: sem.name },
      });

      if (existing) {
        semesterIdMapping[sem.id] = existing.id;
      } else {
        const created = await prisma.semester.create({
          data: {
            userId: user.id,
            academicYearId: mappedYearId,
            name: sem.name,
            type: sem.type || "FALL",
            startDate: sem.startDate ? new Date(sem.startDate) : new Date(),
            endDate: sem.endDate ? new Date(sem.endDate) : new Date(),
            status: sem.status || "ACTIVE",
            gpa10: sem.gpa10 || null,
            gpa4: sem.gpa4 || null,
            totalCredits: sem.totalCredits || 0,
            earnedCredits: sem.earnedCredits || 0,
          },
        });
        semesterIdMapping[sem.id] = created.id;
        importedSemestersCount++;
      }
    }

    // 3. Import Subjects (upsert by name)
    const subjectIdMapping: Record<string, string> = {};
    for (const sub of subjects) {
      if (!sub.name) continue;
      const existing = await prisma.subject.findFirst({
        where: { userId: user.id, name: sub.name.trim() },
      });

      const mappedSemesterId = sub.semesterId ? semesterIdMapping[sub.semesterId] || null : null;

      if (existing) {
        subjectIdMapping[sub.id] = existing.id;
        // Update academic fields if not populated
        await prisma.subject.update({
          where: { id: existing.id },
          data: {
            semesterId: mappedSemesterId || existing.semesterId,
            credits: sub.credits || existing.credits,
            courseGrade: sub.courseGrade !== undefined ? sub.courseGrade : existing.courseGrade,
            letterGrade: sub.letterGrade || existing.letterGrade,
            gradePoints: sub.gradePoints !== undefined ? sub.gradePoints : existing.gradePoints,
            status: sub.status || existing.status,
            lecturer: sub.lecturer || existing.lecturer,
            classroom: sub.classroom || existing.classroom,
          },
        });
      } else {
        const created = await prisma.subject.create({
          data: {
            userId: user.id,
            name: sub.name.trim(),
            code: sub.code || null,
            color: sub.color || "#2d6a4f",
            targetHours: sub.targetHours || 0,
            completedHours: sub.completedHours || 0,
            priority: sub.priority || 2,
            semesterId: mappedSemesterId,
            credits: sub.credits || 3,
            courseGrade: sub.courseGrade || null,
            letterGrade: sub.letterGrade || null,
            gradePoints: sub.gradePoints || null,
            status: sub.status || "ACTIVE",
            lecturer: sub.lecturer || null,
            classroom: sub.classroom || null,
          },
        });
        subjectIdMapping[sub.id] = created.id;
        importedSubjectsCount++;
      }
    }

    // 4. Import Tasks
    for (const t of tasks) {
      if (!t.title) continue;
      const mappedSubjectId = t.subjectId ? subjectIdMapping[t.subjectId] || null : null;
      await prisma.task.create({
        data: {
          userId: user.id,
          title: t.title,
          description: t.description || null,
          priority: t.priority || "MEDIUM",
          status: t.status || "INBOX",
          estimatedMinutes: t.estimatedMinutes || 60,
          deadline: t.deadline ? new Date(t.deadline) : null,
          subjectId: mappedSubjectId,
        },
      });
      importedTasksCount++;
    }

    // 5. Import Notes
    for (const n of notes) {
      if (!n.title) continue;
      const mappedSubjectId = n.subjectId ? subjectIdMapping[n.subjectId] || null : null;
      await prisma.note.create({
        data: {
          userId: user.id,
          title: n.title,
          content: n.content || "",
          subjectId: mappedSubjectId,
        },
      });
      importedNotesCount++;
    }

    // 6. Import Habits
    for (const h of habits) {
      if (!h.title) continue;
      const mappedSubjectId = h.subjectId ? subjectIdMapping[h.subjectId] || null : null;
      await prisma.habit.create({
        data: {
          userId: user.id,
          title: h.title,
          description: h.description || null,
          frequency: h.frequency || "DAILY",
          targetDays: h.targetDays || "1,2,3,4,5,6,0",
          color: h.color || "#2d6a4f",
          subjectId: mappedSubjectId,
        },
      });
      importedHabitsCount++;
    }

    // 7. Import Calendar Events
    for (const ev of calendarEvents) {
      if (!ev.title || !ev.startTime || !ev.endTime) continue;
      const mappedSubjectId = ev.subjectId ? subjectIdMapping[ev.subjectId] || null : null;
      await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: ev.title,
          description: ev.description || null,
          startTime: new Date(ev.startTime),
          endTime: new Date(ev.endTime),
          type: ev.type || "SELF_STUDY",
          subjectId: mappedSubjectId,
          isLocked: Boolean(ev.isLocked),
          trackStudyTime: ev.trackStudyTime !== undefined
            ? Boolean(ev.trackStudyTime)
            : (ev.type === "SCHOOL" || ev.type === "SELF_STUDY" || ev.type === "STUDY" || Boolean(mappedSubjectId)),
        },
      });
      importedEventsCount++;
    }

    // 8. Import Skills
    for (const sk of skills) {
      if (!sk.name) continue;
      await prisma.skill.upsert({
        where: { userId_name: { userId: user.id, name: sk.name.trim() } },
        update: { category: sk.category, level: sk.level, description: sk.description },
        create: {
          userId: user.id,
          name: sk.name.trim(),
          category: sk.category || "TECH",
          level: sk.level || "INTERMEDIATE",
          description: sk.description || null,
        },
      });
      importedSkillsCount++;
    }

    // 9. Import Projects
    for (const proj of projects) {
      if (!proj.title) continue;
      const mappedSubjectId = proj.subjectId ? subjectIdMapping[proj.subjectId] || null : null;
      await prisma.project.create({
        data: {
          userId: user.id,
          title: proj.title,
          description: proj.description || null,
          repositoryUrl: proj.repositoryUrl || null,
          demoUrl: proj.demoUrl || null,
          technologies: proj.technologies || null,
          status: proj.status || "IN_PROGRESS",
          subjectId: mappedSubjectId,
        },
      });
      importedProjectsCount++;
    }

    // 10. Import Certificates
    for (const cert of certificates) {
      if (!cert.name || !cert.issuer) continue;
      await prisma.certificate.create({
        data: {
          userId: user.id,
          name: cert.name,
          issuer: cert.issuer,
          issueDate: cert.issueDate ? new Date(cert.issueDate) : new Date(),
          expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : null,
          credentialId: cert.credentialId || null,
          credentialUrl: cert.credentialUrl || null,
          score: cert.score || null,
          status: cert.status || "ACTIVE",
        },
      });
      importedCertificatesCount++;
    }

    // 11. Import Career Applications
    for (const app of careerApplications) {
      if (!app.company || !app.role) continue;
      await prisma.careerApplication.create({
        data: {
          userId: user.id,
          company: app.company,
          role: app.role,
          location: app.location || null,
          type: app.type || "INTERNSHIP",
          status: app.status || "APPLIED",
          appliedDate: app.appliedDate ? new Date(app.appliedDate) : new Date(),
          deadline: app.deadline ? new Date(app.deadline) : null,
          salary: app.salary || null,
          notes: app.notes || null,
        },
      });
      importedAppsCount++;
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        entityType: "BACKUP",
        entityId: user.id,
        action: "RESTORE",
        detailsJson: JSON.stringify({
          years: importedYearsCount,
          semesters: importedSemestersCount,
          subjects: importedSubjectsCount,
          tasks: importedTasksCount,
          events: importedEventsCount,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Khôi phục dữ liệu hệ thống đại học 4 năm thành công!",
      imported: {
        academicYears: importedYearsCount,
        semesters: importedSemestersCount,
        subjects: importedSubjectsCount,
        tasks: importedTasksCount,
        notes: importedNotesCount,
        habits: importedHabitsCount,
        events: importedEventsCount,
        skills: importedSkillsCount,
        projects: importedProjectsCount,
        certificates: importedCertificatesCount,
        careerApplications: importedAppsCount,
      },
    });
  } catch (error: any) {
    console.error("POST /api/import error:", error);
    return NextResponse.json({ error: error.message || "Lỗi khôi phục dữ liệu" }, { status: 500 });
  }
}
