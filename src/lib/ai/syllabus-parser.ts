export interface ParsedSyllabus {
  courseName: string;
  courseCode: string;
  credits: number;
  lecturer?: string;
  gradingStructure: {
    attendance?: number;
    midterm?: number;
    project?: number;
    final?: number;
    assignments?: number;
  };
  weeklyTopics: Array<{
    week: number;
    title: string;
    description?: string;
    objectives?: string[];
  }>;
  assignments: Array<{
    title: string;
    weekNumber?: number;
    deadline?: string;
    weightPercent?: number;
    description?: string;
  }>;
  exams: Array<{
    type: "MIDTERM" | "FINAL" | "QUIZ";
    title: string;
    weekNumber?: number;
    date?: string;
    weightPercent?: number;
  }>;
}

export function parseSyllabusDeterministic(rawText: string): ParsedSyllabus {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean);

  // Extract course name
  let courseName = "Môn học mới";
  let courseCode = "IT101";
  let credits = 3;
  let lecturer = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("môn học:") || lower.includes("học phần:") || lower.includes("course:")) {
      courseName = line.split(/[:：]/)[1]?.trim() || courseName;
    } else if (lower.includes("mã học phần:") || lower.includes("mã môn:") || lower.includes("code:")) {
      courseCode = line.split(/[:：]/)[1]?.trim() || courseCode;
    } else if (lower.includes("số tín chỉ:") || lower.includes("tín chỉ:") || lower.includes("credits:")) {
      const match = line.match(/\d+/);
      if (match) credits = Number(match[0]);
    } else if (lower.includes("giảng viên:") || lower.includes("lecturer:") || lower.includes("gv:")) {
      lecturer = line.split(/[:：]/)[1]?.trim() || lecturer;
    }
  }

  // Extract weekly topics
  const weeklyTopics: ParsedSyllabus["weeklyTopics"] = [];
  const weekRegex = /(?:tuần|bài|chương|week|chapter)\s*(\d+)[:.\s-]+([^\n]+)/gi;
  let match;
  let weekCounter = 1;

  while ((match = weekRegex.exec(rawText)) !== null) {
    const weekNum = Number(match[1]) || weekCounter;
    const title = match[2].trim();
    if (title.length > 3 && weeklyTopics.length < 15) {
      weeklyTopics.push({
        week: weekNum,
        title: title.slice(0, 80),
        description: `Nội dung trọng tâm tuần ${weekNum}: ${title}`,
      });
      weekCounter++;
    }
  }

  // Fallback default topics if none detected
  if (weeklyTopics.length === 0) {
    for (let i = 1; i <= 10; i++) {
      weeklyTopics.push({
        week: i,
        title: `Chương ${i}: Tổng quan & kiến thức chuyên đề ${i}`,
        description: `Mục tiêu bài học tuần ${i}`,
      });
    }
  }

  // Extract grading structure
  const gradingStructure: ParsedSyllabus["gradingStructure"] = {
    attendance: 10,
    midterm: 30,
    project: 20,
    final: 40,
  };

  if (rawText.toLowerCase().includes("chuyên cần")) {
    const m = rawText.match(/chuyên cần[^\d]*(\d+)%/i);
    if (m) gradingStructure.attendance = Number(m[1]);
  }
  if (rawText.toLowerCase().includes("giữa kỳ")) {
    const m = rawText.match(/giữa kỳ[^\d]*(\d+)%/i);
    if (m) gradingStructure.midterm = Number(m[1]);
  }
  if (rawText.toLowerCase().includes("cuối kỳ")) {
    const m = rawText.match(/cuối kỳ[^\d]*(\d+)%/i);
    if (m) gradingStructure.final = Number(m[1]);
  }

  // Assignments
  const assignments = [
    {
      title: `Bài tập lớn / Đồ án: ${courseName}`,
      weekNumber: 10,
      description: "Thực hiện đồ án ứng dụng thực tế hoặc tiểu luận chuyên sâu",
      weightPercent: 20,
    },
    {
      title: "Bài tập thực hành số 1",
      weekNumber: 5,
      description: "Bài tập áp dụng các chương 1 - 4",
      weightPercent: 10,
    },
  ];

  // Exams
  const exams: ParsedSyllabus["exams"] = [
    {
      type: "MIDTERM",
      title: `Thi giữa kỳ: ${courseName}`,
      weekNumber: 8,
      weightPercent: gradingStructure.midterm || 30,
    },
    {
      type: "FINAL",
      title: `Thi kết thúc học phần: ${courseName}`,
      weekNumber: 15,
      weightPercent: gradingStructure.final || 40,
    },
  ];

  return {
    courseName,
    courseCode,
    credits,
    lecturer: lecturer || undefined,
    gradingStructure,
    weeklyTopics,
    assignments,
    exams,
  };
}
