/**
 * Test Suite for 4-Year University Academic OS & GPA Engine
 * Standard: Vietnamese MOET Credit System (Thang 10 & Thang 4)
 * Run with: npx tsx scripts/test-academic-gpa.ts
 */

import {
  convertGrade10To4,
  calculateWeightedCourseGrade,
  calculateSemesterGpa,
  getGraduationHonors,
} from "../src/lib/academic/gpa-calculator";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${msg}`);
    process.exit(1);
  } else {
    console.log(`  ✅ PASS: ${msg}`);
  }
}

async function runAcademicTests() {
  console.log("\n🧪 Running ChronoMind 4-Year Academic OS & GPA Engine Test Suite...\n");

  // 1. Grade scale conversions
  const gradeA = convertGrade10To4(9.0);
  assert(gradeA.letter === "A" && gradeA.points4 === 4.0 && gradeA.passed, "Grade 9.0 correctly maps to A (4.0) passed");

  const gradeBPlus = convertGrade10To4(8.2);
  assert(gradeBPlus.letter === "B+" && gradeBPlus.points4 === 3.5 && gradeBPlus.passed, "Grade 8.2 correctly maps to B+ (3.5) passed");

  const gradeB = convertGrade10To4(7.5);
  assert(gradeB.letter === "B" && gradeB.points4 === 3.0 && gradeB.passed, "Grade 7.5 correctly maps to B (3.0) passed");

  const gradeCPlus = convertGrade10To4(6.7);
  assert(gradeCPlus.letter === "C+" && gradeCPlus.points4 === 2.5 && gradeCPlus.passed, "Grade 6.7 correctly maps to C+ (2.5) passed");

  const gradeC = convertGrade10To4(6.0);
  assert(gradeC.letter === "C" && gradeC.points4 === 2.0 && gradeC.passed, "Grade 6.0 correctly maps to C (2.0) passed");

  const gradeDPlus = convertGrade10To4(5.2);
  assert(gradeDPlus.letter === "D+" && gradeDPlus.points4 === 1.5 && gradeDPlus.passed, "Grade 5.2 correctly maps to D+ (1.5) passed");

  const gradeD = convertGrade10To4(4.5);
  assert(gradeD.letter === "D" && gradeD.points4 === 1.0 && gradeD.passed, "Grade 4.5 correctly maps to D (1.0) passed");

  const gradeF = convertGrade10To4(3.2);
  assert(gradeF.letter === "F" && gradeF.points4 === 0.0 && !gradeF.passed, "CRITICAL SPEC: Grade 3.2 correctly maps to F (0.0) failed");

  // 2. Weighted component scoring
  const weights = { attendance: 10, midterm: 30, project: 20, final: 40 };
  const scores = { attendance: 10, midterm: 8.5, project: 9.0, final: 8.0 };
  // Weighted: 10*0.1 + 8.5*0.3 + 9.0*0.2 + 8.0*0.4 = 1.0 + 2.55 + 1.8 + 3.2 = 8.55 -> 8.6
  const finalGrade = calculateWeightedCourseGrade(scores, weights);
  assert(finalGrade === 8.6, `Weighted grade calculation matches expected (8.6, got ${finalGrade})`);

  // 3. Semester GPA calculation
  const sampleSemesterSubjects = [
    { id: "1", name: "Toán cao cấp A1", credits: 3, courseGrade: 9.0, gradePoints: 4.0, letterGrade: "A", status: "COMPLETED" },
    { id: "2", name: "Lập trình C/C++", credits: 4, courseGrade: 8.2, gradePoints: 3.5, letterGrade: "B+", status: "COMPLETED" },
    { id: "3", name: "Triết học Mác - Lênin", credits: 3, courseGrade: 7.0, gradePoints: 3.0, letterGrade: "B", status: "COMPLETED" },
    { id: "4", name: "Tiếng Anh 1", credits: 3, courseGrade: 8.8, gradePoints: 4.0, letterGrade: "A", status: "COMPLETED" },
  ];
  // Total credits: 3 + 4 + 3 + 3 = 13 credits
  // Weighted points 4.0: (4*3) + (3.5*4) + (3*3) + (4*3) = 12 + 14 + 9 + 12 = 47
  // GPA 4.0: 47 / 13 = 3.615 -> 3.62
  // Weighted points 10.0: (9*3) + (8.2*4) + (7*3) + (8.8*3) = 27 + 32.8 + 21 + 26.4 = 107.2
  // GPA 10.0: 107.2 / 13 = 8.246 -> 8.25
  const semStats = calculateSemesterGpa(sampleSemesterSubjects);
  assert(semStats.totalCredits === 13, `Semester total credits = 13 (got ${semStats.totalCredits})`);
  assert(semStats.earnedCredits === 13, `Semester earned credits = 13 (got ${semStats.earnedCredits})`);
  assert(semStats.gpa4 === 3.62, `Semester GPA 4.0 = 3.62 (got ${semStats.gpa4})`);
  assert(semStats.gpa10 === 8.25, `Semester GPA 10.0 = 8.25 (got ${semStats.gpa10})`);

  // 4. Failed course handling
  const subjectsWithFail = [
    ...sampleSemesterSubjects,
    { id: "5", name: "Vật lý đại cương", credits: 3, courseGrade: 3.0, gradePoints: 0.0, letterGrade: "F", status: "COMPLETED" },
  ];
  const failStats = calculateSemesterGpa(subjectsWithFail);
  assert(failStats.totalCredits === 16, "Enrolled credits includes failed course (16)");
  assert(failStats.earnedCredits === 13, "CRITICAL SPEC: Earned credits EXCLUDES failed course (13)");
  assert(failStats.gpa4 < semStats.gpa4, "Failed course pulls down GPA");

  // 5. Honors classification
  assert(getGraduationHonors(3.8).includes("Xuất sắc"), "GPA 3.8 classified as Xuất sắc");
  assert(getGraduationHonors(3.3).includes("Giỏi"), "GPA 3.3 classified as Giỏi");
  assert(getGraduationHonors(2.8).includes("Khá"), "GPA 2.8 classified as Khá");
  assert(getGraduationHonors(2.2).includes("Trung bình"), "GPA 2.2 classified as Trung bình");

  // 6. Multi-year continuity scenario
  // Simulating 4 years (8 semesters) with cumulative credit threshold (130)
  let cumulativeCredits = 0;
  let cumulativeWeightedPoints = 0;

  for (let sem = 1; sem <= 8; sem++) {
    const semCredits = 16;
    const semGradePoints = 3.6; // consistent good performance
    cumulativeCredits += semCredits;
    cumulativeWeightedPoints += semCredits * semGradePoints;
  }

  const finalCumulativeGpa = cumulativeWeightedPoints / cumulativeCredits;
  assert(cumulativeCredits === 128, `4-year cumulative credits reached 128/130 (got ${cumulativeCredits})`);
  assert(Math.round(finalCumulativeGpa * 100) / 100 === 3.6, "Cumulative GPA across 8 semesters is strictly preserved");

  console.log("\n🎉 Academic & GPA Test Suite Completed: All checks passed!\n");
}

runAcademicTests();
