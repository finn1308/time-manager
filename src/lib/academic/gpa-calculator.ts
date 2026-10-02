/**
 * Academic GPA & Grading Calculation Utility
 * Standard: Vietnamese MOET / Credit-based University System (Thang điểm 10 & Thang điểm 4)
 * Supports custom grading weights and cumulative calculations across multi-year semesters.
 */

export interface GradeScaleEntry {
  min10: number;
  max10: number;
  letter: string;
  points4: number;
  label: string;
}

export const STANDARD_GRADE_SCALE: GradeScaleEntry[] = [
  { min10: 8.5, max10: 10.0, letter: "A", points4: 4.0, label: "Xuất sắc / Giỏi" },
  { min10: 8.0, max10: 8.499, letter: "B+", points4: 3.5, label: "Khá giỏi" },
  { min10: 7.0, max10: 7.999, letter: "B", points4: 3.0, label: "Khá" },
  { min10: 6.5, max10: 6.999, letter: "C+", points4: 2.5, label: "Trung bình khá" },
  { min10: 5.5, max10: 6.499, letter: "C", points4: 2.0, label: "Trung bình" },
  { min10: 5.0, max10: 5.499, letter: "D+", points4: 1.5, label: "Trung bình yếu" },
  { min10: 4.0, max10: 4.999, letter: "D", points4: 1.0, label: "Yếu (Đạt)" },
  { min10: 0.0, max10: 3.999, letter: "F", points4: 0.0, label: "Kém (Không đạt)" },
];

/**
 * Convert a 10.0 scale grade into letter grade and 4.0 grade points
 */
export function convertGrade10To4(score10: number | null | undefined): {
  letter: string;
  points4: number;
  label: string;
  passed: boolean;
} {
  if (score10 === null || score10 === undefined || isNaN(score10)) {
    return { letter: "N/A", points4: 0, label: "Chưa có điểm", passed: false };
  }

  const clamped = Math.max(0, Math.min(10, Math.round(score10 * 100) / 100));

  for (const entry of STANDARD_GRADE_SCALE) {
    if (clamped >= entry.min10 && clamped <= entry.max10) {
      return {
        letter: entry.letter,
        points4: entry.points4,
        label: entry.label,
        passed: entry.letter !== "F",
      };
    }
  }

  return { letter: "F", points4: 0, label: "Kém (Không đạt)", passed: false };
}

/**
 * Calculate final course grade from component weights
 * e.g., weights = { attendance: 10, midterm: 30, project: 20, final: 40 }
 * scores = { attendance: 10, midterm: 8.5, project: 9.0, final: 8.0 }
 */
export function calculateWeightedCourseGrade(
  scores: Record<string, number | null | undefined>,
  weights: Record<string, number>
): number | null {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [key, weight] of Object.entries(weights)) {
    const score = scores[key];
    if (score !== undefined && score !== null && !isNaN(score)) {
      totalWeightedScore += score * (weight / 100);
      totalWeight += weight;
    }
  }

  if (totalWeight === 0) return null;

  // Normalize if weights don't sum to exactly 100% of recorded scores
  const finalGrade = (totalWeightedScore / totalWeight) * 100;
  return Math.round(finalGrade * 10) / 10;
}

export interface SubjectGradeInput {
  id: string;
  name: string;
  credits: number;
  courseGrade?: number | null;
  gradePoints?: number | null;
  letterGrade?: string | null;
  status: string;
}

/**
 * Calculate semester GPA and credits summary
 */
export function calculateSemesterGpa(subjects: SubjectGradeInput[]): {
  totalCredits: number;
  earnedCredits: number;
  gpa10: number;
  gpa4: number;
  completedSubjectsCount: number;
} {
  let totalCredits = 0;
  let earnedCredits = 0;
  let weightedPoints4 = 0;
  let weightedPoints10 = 0;
  let gradedCredits = 0;
  let completedSubjectsCount = 0;

  for (const sub of subjects) {
    const credits = sub.credits || 0;
    totalCredits += credits;

    // A course is graded if courseGrade or gradePoints is present
    const hasGrade = sub.gradePoints !== null && sub.gradePoints !== undefined;
    const hasGrade10 = sub.courseGrade !== null && sub.courseGrade !== undefined;

    if (hasGrade || hasGrade10) {
      completedSubjectsCount++;
      const pts4 = hasGrade ? sub.gradePoints! : convertGrade10To4(sub.courseGrade).points4;
      const pts10 = hasGrade10 ? sub.courseGrade! : 0;

      if (pts4 > 0) {
        earnedCredits += credits;
      }

      weightedPoints4 += pts4 * credits;
      weightedPoints10 += pts10 * credits;
      gradedCredits += credits;
    }
  }

  const gpa4 = gradedCredits > 0 ? Math.round((weightedPoints4 / gradedCredits) * 100) / 100 : 0;
  const gpa10 = gradedCredits > 0 ? Math.round((weightedPoints10 / gradedCredits) * 100) / 100 : 0;

  return {
    totalCredits,
    earnedCredits,
    gpa10,
    gpa4,
    completedSubjectsCount,
  };
}

/**
 * Calculate degree graduation classification based on Vietnamese standard
 */
export function getGraduationHonors(gpa4: number): string {
  if (gpa4 >= 3.6) return "Xuất sắc (Summa Cum Laude)";
  if (gpa4 >= 3.2) return "Giỏi (Magna Cum Laude)";
  if (gpa4 >= 2.5) return "Khá (Cum Laude)";
  if (gpa4 >= 2.0) return "Trung bình (Pass)";
  return "Chưa đủ điều kiện tốt nghiệp";
}
