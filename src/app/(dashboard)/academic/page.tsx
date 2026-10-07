"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  Archive,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
  Layers,
  Sparkles,
  BarChart2,
  Clock,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { SyllabusImporterModal } from "@/components/academic/syllabus-importer-modal";
import { Badge } from "@/components/ui/badge";

import { toast } from "sonner";
interface DegreeProgramData {
  id: string;
  major: string;
  faculty: string | null;
  university: string | null;
  totalCreditsRequired: number;
  earnedCredits: number;
  remainingCredits: number;
  progressPercent: number;
  inProgressCredits: number;
  plannedCredits: number;
  currentGpa: number;
  targetGpa: number;
  graduationYear: number | null;
  honorsClassification: string;
  status: string;
}

interface SemesterData {
  id: string;
  academicYearId: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  gpa10: number | null;
  gpa4: number | null;
  totalCredits: number;
  earnedCredits: number;
  subjects: Array<{
    id: string;
    name: string;
    code: string | null;
    credits: number;
    status: string;
    courseGrade: number | null;
    letterGrade: string | null;
    gradePoints: number | null;
    lecturer: string | null;
    classroom: string | null;
  }>;
}

interface AcademicYearData {
  id: string;
  yearNumber: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  semesters: SemesterData[];
}

export default function AcademicHubPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [years, setYears] = useState<AcademicYearData[]>([]);
  const [degree, setDegree] = useState<DegreeProgramData | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  // Modals state
  const [showAddYearModal, setShowAddYearModal] = useState(false);
  const [showAddSemesterModal, setShowAddSemesterModal] = useState(false);
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);
  const [showEditCourseModal, setShowEditCourseModal] = useState<any | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState<SemesterData | null>(null);
  const [showEditDegreeModal, setShowEditDegreeModal] = useState(false);
  const [showSyllabusModal, setShowSyllabusModal] = useState(false);

  // Form states
  const [newYearName, setNewYearName] = useState("");
  const [newYearNumber, setNewYearNumber] = useState(3);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [newSemesterType, setNewSemesterType] = useState("FALL");

  // Course Form State
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseCredits, setCourseCredits] = useState(3);
  const [courseLecturer, setCourseLecturer] = useState("");
  const [courseRoom, setCourseRoom] = useState("");
  const [courseGrade, setCourseGrade] = useState<string>("");
  const [courseStatus, setCourseStatus] = useState("ACTIVE");

  // Degree Edit Form
  const [editMajor, setEditMajor] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editTargetCredits, setEditTargetCredits] = useState(130);
  const [editTargetGpa, setEditTargetGpa] = useState(3.6);

  // Transition Semester Form
  const [nextSemesterTitle, setNextSemesterTitle] = useState("");
  const [autoCreateNext, setAutoCreateNext] = useState(true);

  const fetchAcademicData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [yearsRes, degreeRes] = await Promise.all([
        fetch("/api/academic/years"),
        fetch("/api/academic/degree-progress"),
      ]);

      const yearsJson = await yearsRes.json();
      const degreeJson = await degreeRes.json();

      if (!yearsRes.ok) throw new Error(yearsJson.error || "Không thể tải danh sách năm học");
      if (!degreeRes.ok) throw new Error(degreeJson.error || "Không thể tải tiến độ học tập");

      const fetchedYears: AcademicYearData[] = yearsJson.years || [];
      setYears(fetchedYears);
      setDegree(degreeJson.degree || null);

      if (degreeJson.degree) {
        setEditMajor(degreeJson.degree.major || "");
        setEditUniversity(degreeJson.degree.university || "");
        setEditTargetCredits(degreeJson.degree.totalCreditsRequired || 130);
        setEditTargetGpa(degreeJson.degree.targetGpa || 3.6);
      }

      // Default select active or first year
      if (fetchedYears.length > 0) {
        const activeYear = fetchedYears.find((y) => y.status === "ACTIVE") || fetchedYears[0];
        setSelectedYearId((prev) => prev || activeYear.id);

        if (activeYear.semesters && activeYear.semesters.length > 0) {
          const activeSem = activeYear.semesters.find((s) => s.status === "ACTIVE") || activeYear.semesters[0];
          setSelectedSemesterId((prev) => prev || activeSem.id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicData();
  }, [fetchAcademicData]);

  // Selected Year & Semester objects
  const currentYear = years.find((y) => y.id === selectedYearId) || years[0] || null;
  const currentSemester =
    currentYear?.semesters.find((s) => s.id === selectedSemesterId) ||
    currentYear?.semesters[0] ||
    null;

  // Handler: Add Academic Year
  const handleAddYear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newYearName.trim()) return;

    try {
      const res = await fetch("/api/academic/years", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newYearName.trim(),
          yearNumber: newYearNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddYearModal(false);
      setNewYearName("");
      await fetchAcademicData();
    } catch (err: any) {
      toast.error("Lỗi tạo năm học: " + err.message);
    }
  };

  // Handler: Add Semester
  const handleAddSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName.trim() || !selectedYearId) return;

    try {
      const res = await fetch("/api/academic/semesters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academicYearId: selectedYearId,
          name: newSemesterName.trim(),
          type: newSemesterType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddSemesterModal(false);
      setNewSemesterName("");
      await fetchAcademicData();
    } catch (err: any) {
      toast.error("Lỗi tạo học kỳ: " + err.message);
    }
  };

  // Handler: Add or Edit Course
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName.trim()) return;

    try {
      const isEditing = Boolean(showEditCourseModal);
      const url = "/api/subjects";
      const method = isEditing ? "PUT" : "POST";

      const payload: any = {
        name: courseName.trim(),
        code: courseCode.trim() || null,
        credits: Number(courseCredits) || 3,
        lecturer: courseLecturer.trim() || null,
        classroom: courseRoom.trim() || null,
        status: courseStatus,
        semesterId: selectedSemesterId,
      };

      if (courseGrade !== "" && !isNaN(Number(courseGrade))) {
        payload.courseGrade = Number(courseGrade);
      } else if (isEditing && courseGrade === "") {
        payload.courseGrade = null;
      }

      if (isEditing) {
        payload.id = showEditCourseModal.id;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowAddCourseModal(false);
      setShowEditCourseModal(null);
      resetCourseForm();
      await fetchAcademicData();
    } catch (err: any) {
      toast.error("Lỗi lưu môn học: " + err.message);
    }
  };

  const resetCourseForm = () => {
    setCourseName("");
    setCourseCode("");
    setCourseCredits(3);
    setCourseLecturer("");
    setCourseRoom("");
    setCourseGrade("");
    setCourseStatus("ACTIVE");
  };

  // Handler: Complete Semester Transition
  const handleTransitionSemester = async () => {
    if (!showTransitionModal) return;

    try {
      const res = await fetch("/api/academic/semester-transition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semesterId: showTransitionModal.id,
          action: "COMPLETE",
          createNextSemester: autoCreateNext,
          nextSemesterName: nextSemesterTitle.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowTransitionModal(null);
      setNextSemesterTitle("");
      await fetchAcademicData();
    } catch (err: any) {
      toast.error("Lỗi kết chuyển học kỳ: " + err.message);
    }
  };

  // Handler: Save Degree Profile
  const handleSaveDegree = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/academic/degree-progress", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          major: editMajor,
          university: editUniversity,
          totalCreditsRequired: editTargetCredits,
          targetGpa: editTargetGpa,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowEditDegreeModal(false);
      await fetchAcademicData();
    } catch (err: any) {
      toast.error("Lỗi cập nhật: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <RefreshCw className="w-8 h-8 text-[#2d6a4f] animate-spin" />
        <p className="text-sm font-medium text-[#526b5c] dark:text-[#a3bda9]">
          Đang tải dữ liệu hồ sơ học thuật 4 năm...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
        <div className="flex items-center space-x-3 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold text-base">Không thể tải thông tin học thuật</h3>
        </div>
        <p className="text-sm">{error}</p>
        <button
          onClick={fetchAcademicData}
          className="mt-4 px-4 py-2 bg-[#2d6a4f] text-white rounded-xl text-sm font-medium hover:bg-[#1b4332] transition-colors"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner: Academic OS Overview & 4-Year Progress */}
      <div className="rounded-3xl bg-gradient-to-br from-[#1b4332] via-[#2d6a4f] to-[#40916c] text-white p-6 sm:p-8 shadow-xl shadow-[#1b4332]/10 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-[#d8f3dc]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Personal Academic Operating System</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {degree?.major || "Chương trình Đại học"}
              </h1>
              <p className="text-sm sm:text-base text-[#d8f3dc]/90 font-medium">
                {degree?.university || "Đại học"} • Khóa 4 năm
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowEditDegreeModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 text-white border border-white/20"
            >
              <Edit3 className="w-4 h-4" />
              <span>Cấu hình mục tiêu</span>
            </button>
          </div>
        </div>

        {/* 4-Year Degree Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/15">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-[#d8f3dc]/80 font-medium flex items-center space-x-1">
              <Award className="w-3.5 h-3.5" />
              <span>Tín chỉ tích lũy</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold">{degree?.earnedCredits || 0}</span>
              <span className="text-xs text-[#d8f3dc]/70">/ {degree?.totalCreditsRequired || 130}</span>
            </div>
            <div className="w-full bg-white/20 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#95d5b2] h-full rounded-full transition-all duration-500"
                style={{ width: `${degree?.progressPercent || 0}%` }}
              />
            </div>
            <p className="text-[11px] text-[#d8f3dc]/70 mt-1">Đạt {degree?.progressPercent || 0}% mục tiêu</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-[#d8f3dc]/80 font-medium flex items-center space-x-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>GPA Tích lũy (Hệ 4)</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold">
                {degree?.currentGpa !== undefined ? degree.currentGpa.toFixed(2) : "0.00"}
              </span>
              <span className="text-xs text-[#d8f3dc]/70">/ 4.00</span>
            </div>
            <p className="text-[11px] text-[#d8f3dc]/90 font-medium mt-2 truncate">
              {degree?.honorsClassification || "Đang học"}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-[#d8f3dc]/80 font-medium flex items-center space-x-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Đang học kỳ này</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold">{degree?.inProgressCredits || 0}</span>
              <span className="text-xs text-[#d8f3dc]/70">tín chỉ</span>
            </div>
            <p className="text-[11px] text-[#d8f3dc]/70 mt-2">Đang được tính trong GPA</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
            <div className="text-xs text-[#d8f3dc]/80 font-medium flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>Còn lại tốt nghiệp</span>
            </div>
            <div className="mt-1 flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold">{degree?.remainingCredits || 0}</span>
              <span className="text-xs text-[#d8f3dc]/70">tín chỉ</span>
            </div>
            <p className="text-[11px] text-[#d8f3dc]/70 mt-2">Mục tiêu: {degree?.targetGpa?.toFixed(2) || "3.60"}</p>
          </div>
      </div>
    </div>

      {/* 4-Year Academic OS Subsystem Quick Links */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <Link href="/academic">
          <Badge className="bg-[#2d6a4f] text-white py-1.5 px-3 rounded-xl cursor-pointer">
            🎓 Học kỳ & Môn học
          </Badge>
        </Link>
        <Link href="/academic/assignments">
          <Badge variant="outline" className="py-1.5 px-3 rounded-xl hover:bg-emerald-50 dark:hover:bg-[#1a2f22] cursor-pointer">
            📝 Bài tập lớn & Đồ án
          </Badge>
        </Link>
        <Link href="/exams">
          <Badge variant="outline" className="py-1.5 px-3 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 cursor-pointer">
            🎯 Luyện thi 5 giai đoạn
          </Badge>
        </Link>
        <Link href="/academic/knowledge-graph">
          <Badge variant="outline" className="py-1.5 px-3 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-700 dark:text-purple-300 border-purple-200 cursor-pointer">
            🌿 Cây tri thức & Tiên quyết
          </Badge>
        </Link>
        <Link href="/academic/learning-profile">
          <Badge variant="outline" className="py-1.5 px-3 rounded-xl hover:bg-teal-50 dark:hover:bg-teal-950/20 text-teal-700 dark:text-teal-300 border-teal-200 cursor-pointer">
            🧠 Hồ sơ nhận thức AI
          </Badge>
        </Link>
      </div>

      {/* Main Academic Workspace: Years Navigation */}
      <div className="space-y-6">
        {/* Year Pills Navigation */}
        <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-none gap-3">
          <div className="flex items-center space-x-2">
            {years.map((year) => {
              const isSelected = year.id === (currentYear?.id || "");
              return (
                <button
                  key={year.id}
                  onClick={() => {
                    setSelectedYearId(year.id);
                    if (year.semesters && year.semesters.length > 0) {
                      setSelectedSemesterId(year.semesters[0].id);
                    } else {
                      setSelectedSemesterId(null);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all flex items-center space-x-2 whitespace-nowrap shadow-sm ${
                    isSelected
                      ? "bg-[#2d6a4f] text-white shadow-[#2d6a4f]/20"
                      : "bg-white dark:bg-[#18281d] text-[#526b5c] dark:text-[#a3bda9] hover:bg-[#ebf4ee] dark:hover:bg-[#1e3425] border border-[#dbe7dd] dark:border-[#263d2e]"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{year.name}</span>
                  {year.status === "ACTIVE" && (
                    <span className="w-2 h-2 rounded-full bg-[#52b788] animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setNewYearNumber((years.length || 0) + 1);
              setNewYearName(`Năm ${(years.length || 0) + 1}`);
              setShowAddYearModal(true);
            }}
            className="px-3.5 py-2 rounded-2xl border border-dashed border-[#52b788] text-[#2d6a4f] dark:text-[#52b788] hover:bg-[#52b788]/10 text-xs font-semibold flex items-center space-x-1.5 transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm năm học</span>
          </button>
        </div>

        {/* Current Year & Semesters Container */}
        {currentYear ? (
          <div className="bg-white dark:bg-[#142318] rounded-3xl p-6 sm:p-8 border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm space-y-6">
            {/* Semester Tabs Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#dbe7dd]/80 dark:border-[#263d2e]">
              <div className="flex items-center space-x-3 overflow-x-auto pb-1">
                {currentYear.semesters.map((sem) => {
                  const isSelected = sem.id === currentSemester?.id;
                  return (
                    <button
                      key={sem.id}
                      onClick={() => setSelectedSemesterId(sem.id)}
                      className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                        isSelected
                          ? "bg-[#ebf4ee] dark:bg-[#1e3425] text-[#2d6a4f] dark:text-[#74c69d]"
                          : "text-[#526b5c] dark:text-[#a3bda9] hover:text-[#192e22] dark:hover:text-white"
                      }`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>{sem.name}</span>
                        {sem.status === "COMPLETED" && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#52b788]" />
                        )}
                        {sem.status === "ACTIVE" && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#52b788]/20 text-[#2d6a4f] dark:text-[#74c69d]">
                            Hiện tại
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setNewSemesterName(`Học kỳ ${(currentYear.semesters.length || 0) + 1}`);
                    setShowAddSemesterModal(true);
                  }}
                  className="px-3 py-1.5 text-xs text-[#2d6a4f] dark:text-[#52b788] hover:underline font-semibold flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm học kỳ</span>
                </button>
              </div>

              {/* Semester Action Buttons */}
              {currentSemester && (
                <div className="flex items-center space-x-3">
                  {currentSemester.status === "ACTIVE" && (
                    <button
                      onClick={() => {
                        setShowTransitionModal(currentSemester);
                        setNextSemesterTitle(`Học kỳ ${(currentYear.semesters.length || 0) + 1}`);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#2d6a4f] to-[#40916c] text-white text-xs font-semibold hover:opacity-95 transition-all flex items-center space-x-1.5 shadow-sm"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Kết chuyển học kỳ & Chốt điểm</span>
                    </button>
                  )}

                  <button
                    onClick={() => setShowSyllabusModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-[#1a2f22] border border-emerald-200 dark:border-[#263d2e] text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-all flex items-center space-x-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nhập đề cương AI</span>
                  </button>

                  <button
                    onClick={() => {
                      resetCourseForm();
                      setShowAddCourseModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all flex items-center space-x-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm môn học</span>
                  </button>
                </div>
              )}
            </div>

            {/* Current Semester Summary Cards */}
            {currentSemester && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fbf8] dark:bg-[#101b13] p-4 rounded-2xl border border-[#dbe7dd]/60 dark:border-[#263d2e]">
                <div>
                  <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9]">
                    GPA Học kỳ (Hệ 4)
                  </span>
                  <p className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] mt-0.5">
                    {currentSemester.gpa4 !== null ? currentSemester.gpa4.toFixed(2) : "Đang học"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9]">
                    GPA Học kỳ (Hệ 10)
                  </span>
                  <p className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] mt-0.5">
                    {currentSemester.gpa10 !== null ? currentSemester.gpa10.toFixed(1) : "Đang học"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9]">
                    Số tín chỉ đăng ký
                  </span>
                  <p className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] mt-0.5">
                    {currentSemester.subjects.reduce((sum, s) => sum + (s.credits || 0), 0)} tín chỉ
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9]">
                    Trạng thái học kỳ
                  </span>
                  <div className="mt-0.5">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-md ${
                        currentSemester.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : currentSemester.status === "ACTIVE"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {currentSemester.status === "COMPLETED"
                        ? "Đã hoàn thành"
                        : currentSemester.status === "ACTIVE"
                        ? "Đang diễn ra"
                        : "Kế hoạch"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Courses Grid / List */}
            {currentSemester && currentSemester.subjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentSemester.subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#18281d] border border-[#dbe7dd] dark:border-[#263d2e] hover:border-[#52b788] transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#ebf4ee] dark:bg-[#203626] text-[#2d6a4f] dark:text-[#74c69d]">
                          {sub.code || "MÔN HỌC"}
                        </span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              setShowEditCourseModal(sub);
                              setCourseName(sub.name);
                              setCourseCode(sub.code || "");
                              setCourseCredits(sub.credits || 3);
                              setCourseLecturer(sub.lecturer || "");
                              setCourseRoom(sub.classroom || "");
                              setCourseGrade(sub.courseGrade !== null ? String(sub.courseGrade) : "");
                              setCourseStatus(sub.status || "ACTIVE");
                            }}
                            className="p-1 rounded text-[#526b5c] dark:text-[#a3bda9] hover:text-[#2d6a4f] hover:bg-[#ebf4ee] dark:hover:bg-[#203626] transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-base text-[#192e22] dark:text-[#f0f7f2] line-clamp-2">
                        {sub.name}
                      </h3>

                      <div className="mt-3 space-y-1.5 text-xs text-[#526b5c] dark:text-[#a3bda9]">
                        <div className="flex items-center justify-between">
                          <span>Số tín chỉ:</span>
                          <span className="font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                            {sub.credits} TC
                          </span>
                        </div>
                        {sub.lecturer && (
                          <div className="flex items-center justify-between">
                            <span>Giảng viên:</span>
                            <span className="truncate max-w-[120px]">{sub.lecturer}</span>
                          </div>
                        )}
                        {sub.classroom && (
                          <div className="flex items-center justify-between">
                            <span>Phòng học:</span>
                            <span>{sub.classroom}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Grade Section */}
                    <div className="mt-4 pt-3 border-t border-[#dbe7dd]/70 dark:border-[#263d2e] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#526b5c] dark:text-[#a3bda9]">
                          Kết quả
                        </span>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-base font-bold text-[#2d6a4f] dark:text-[#74c69d]">
                            {sub.courseGrade !== null ? sub.courseGrade.toFixed(1) : "—"}
                          </span>
                          {sub.letterGrade && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2d6a4f] text-white">
                              {sub.letterGrade}
                            </span>
                          )}
                          {sub.gradePoints !== null && (
                            <span className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
                              ({sub.gradePoints.toFixed(1)}/4)
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          sub.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {sub.status === "COMPLETED" ? "Đã xong" : "Đang học"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-[#dbe7dd] dark:border-[#263d2e] rounded-2xl space-y-3">
                <BookOpen className="w-10 h-10 text-[#526b5c] dark:text-[#a3bda9] mx-auto opacity-50" />
                <h4 className="text-sm font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                  Chưa có môn học nào trong học kỳ này
                </h4>
                <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] max-w-sm mx-auto">
                  Hãy thêm các môn học bạn đã đăng ký để hệ thống tính toán tín chỉ và điểm GPA.
                </p>
                <button
                  onClick={() => {
                    resetCourseForm();
                    setShowAddCourseModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#2d6a4f] text-white text-xs font-semibold hover:bg-[#1b4332] transition-all inline-flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm môn học đầu tiên</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#142318] rounded-3xl border border-[#dbe7dd] dark:border-[#263d2e] p-6">
            <Calendar className="w-12 h-12 text-[#2d6a4f] mx-auto mb-3 opacity-60" />
            <h3 className="font-bold text-lg">Chưa thiết lập năm học</h3>
            <p className="text-sm text-[#526b5c] dark:text-[#a3bda9] max-w-md mx-auto mt-1 mb-4">
              Bắt đầu tạo Năm 1 để quản lý toàn diện quá trình học tập 4 năm đại học của bạn.
            </p>
            <button
              onClick={() => {
                setNewYearNumber(1);
                setNewYearName("Năm 1");
                setShowAddYearModal(true);
              }}
              className="px-5 py-2.5 rounded-2xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-all"
            >
              Khởi tạo Năm 1
            </button>
          </div>
        )}
      </div>

      {/* 4-Year Transcript Table (Persistent Historical Record) */}
      <div className="bg-white dark:bg-[#142318] rounded-3xl p-6 sm:p-8 border border-[#dbe7dd] dark:border-[#263d2e] shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2] flex items-center space-x-2">
              <Layers className="w-5 h-5 text-[#2d6a4f]" />
              <span>Bảng điểm tổng hợp 4 năm (Academic Transcript)</span>
            </h2>
            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9]">
              Dữ liệu học thuật được bảo toàn xuyên suốt các học kỳ mà không bị reset.
            </p>
          </div>
          <Link
            href="/api/export?format=csv&entity=courses"
            target="_blank"
            className="text-xs text-[#2d6a4f] dark:text-[#52b788] hover:underline font-semibold flex items-center space-x-1"
          >
            <span>Xuất CSV bảng điểm</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#f8fbf8] dark:bg-[#101b13] text-[#526b5c] dark:text-[#a3bda9] uppercase text-[10px] tracking-wider border-y border-[#dbe7dd] dark:border-[#263d2e]">
              <tr>
                <th className="py-3 px-4">Năm học</th>
                <th className="py-3 px-4">Học kỳ</th>
                <th className="py-3 px-4 text-center">Số môn</th>
                <th className="py-3 px-4 text-center">Tín chỉ</th>
                <th className="py-3 px-4 text-center">GPA (Hệ 10)</th>
                <th className="py-3 px-4 text-center">GPA (Hệ 4)</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dbe7dd]/60 dark:divide-[#263d2e]">
              {years.flatMap((year) =>
                year.semesters.map((sem) => (
                  <tr key={sem.id} className="hover:bg-[#f8fbf8] dark:hover:bg-[#18281d] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#192e22] dark:text-[#f0f7f2]">
                      {year.name}
                    </td>
                    <td className="py-3.5 px-4">{sem.name}</td>
                    <td className="py-3.5 px-4 text-center font-medium">{sem.subjects.length}</td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      {sem.subjects.reduce((sum, s) => sum + (s.credits || 0), 0)} TC
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-[#2d6a4f] dark:text-[#74c69d]">
                      {sem.gpa10 !== null ? sem.gpa10.toFixed(2) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-[#2d6a4f] dark:text-[#74c69d]">
                      {sem.gpa4 !== null ? sem.gpa4.toFixed(2) : "—"}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md ${
                          sem.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {sem.status === "COMPLETED" ? "Đã chốt" : "Đang học"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Thêm Năm Học */}
      {showAddYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">Thêm Năm học mới</h3>
            <form onSubmit={handleAddYear} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên năm học
                </label>
                <input
                  type="text"
                  value={newYearName}
                  onChange={(e) => setNewYearName(e.target.value)}
                  placeholder="Ví dụ: Năm 3 (2025 - 2026)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Thứ tự năm
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={newYearNumber}
                  onChange={(e) => setNewYearNumber(parseInt(e.target.value, 10))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddYearModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Tạo năm học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm Học Kỳ */}
      {showAddSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">Thêm Học kỳ mới</h3>
            <form onSubmit={handleAddSemester} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên học kỳ
                </label>
                <input
                  type="text"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  placeholder="Ví dụ: Học kỳ 2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Loại học kỳ
                </label>
                <select
                  value={newSemesterType}
                  onChange={(e) => setNewSemesterType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                >
                  <option value="FALL">Học kỳ 1 (Thu)</option>
                  <option value="SPRING">Học kỳ 2 (Xuân)</option>
                  <option value="SUMMER">Học kỳ Hè</option>
                  <option value="CUSTOM">Khác</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddSemesterModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Tạo học kỳ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Thêm / Sửa Môn Học & Nhập Điểm */}
      {(showAddCourseModal || showEditCourseModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-lg w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              {showEditCourseModal ? "Cập nhật môn học & Nhập điểm" : "Thêm môn học vào học kỳ"}
            </h3>

            <form onSubmit={handleSaveCourse} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Tên môn học *
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  placeholder="Ví dụ: Cấu trúc dữ liệu và giải thuật"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Mã môn (Mã học phần)
                  </label>
                  <input
                    type="text"
                    value={courseCode}
                    onChange={(e) => setCourseCode(e.target.value)}
                    placeholder="Ví dụ: IT3011"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Số tín chỉ
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={courseCredits}
                    onChange={(e) => setCourseCredits(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Giảng viên phụ trách
                  </label>
                  <input
                    type="text"
                    value={courseLecturer}
                    onChange={(e) => setCourseLecturer(e.target.value)}
                    placeholder="TS. Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Phòng học / Giảng đường
                  </label>
                  <input
                    type="text"
                    value={courseRoom}
                    onChange={(e) => setCourseRoom(e.target.value)}
                    placeholder="D9-401"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              </div>

              {/* Grade & Status */}
              <div className="p-4 rounded-2xl bg-[#f8fbf8] dark:bg-[#18281d] border border-[#dbe7dd]/80 dark:border-[#263d2e] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f] dark:text-[#74c69d]">
                  Kết quả học tập & Điểm số (Thang 10)
                </span>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                      Điểm tổng kết môn (Hệ 10)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min={0}
                      max={10}
                      value={courseGrade}
                      onChange={(e) => setCourseGrade(e.target.value)}
                      placeholder="VD: 8.5"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#101b13] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    />
                    <p className="text-[10px] text-[#526b5c] mt-1">
                      Hệ thống tự quy đổi ra Điểm chữ (A, B+, B...) và Hệ 4.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                      Trạng thái môn
                    </label>
                    <select
                      value={courseStatus}
                      onChange={(e) => setCourseStatus(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#101b13] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    >
                      <option value="ACTIVE">Đang học</option>
                      <option value="COMPLETED">Đã hoàn thành</option>
                      <option value="PLANNED">Dự kiến học</option>
                      <option value="DROPPED">Hủy môn</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCourseModal(false);
                    setShowEditCourseModal(null);
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu môn học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Kết Chuyển Học Kỳ (Semester Transition) */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-[#2d6a4f] dark:text-[#74c69d]">
              <Archive className="w-6 h-6" />
              <h3 className="text-lg font-bold">Kết chuyển & Chốt học kỳ</h3>
            </div>

            <p className="text-xs text-[#526b5c] dark:text-[#a3bda9] leading-relaxed">
              Bạn đang chốt học kỳ <strong>{showTransitionModal.name}</strong>. Hệ thống sẽ:
            </p>

            <ul className="text-xs text-[#526b5c] dark:text-[#a3bda9] space-y-1.5 list-disc list-inside bg-[#f8fbf8] dark:bg-[#101b13] p-3.5 rounded-2xl border border-[#dbe7dd]/60 dark:border-[#263d2e]">
              <li>Tự động tính toán điểm GPA (Hệ 10 & Hệ 4) và số tín chỉ đạt được.</li>
              <li>Cập nhật tiến độ tốt nghiệp tổng 4 năm (Cumulative GPA).</li>
              <li>Chuyển trạng thái học kỳ thành <strong>COMPLETED</strong>.</li>
              <li>
                <strong>Bảo toàn vĩnh viễn</strong> mọi ghi chú, tài liệu PDF, flashcards, và lịch sử buổi học.
              </li>
            </ul>

            <div className="space-y-3 pt-2">
              <label className="flex items-center space-x-2 text-xs font-semibold text-[#192e22] dark:text-[#f0f7f2] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateNext}
                  onChange={(e) => setAutoCreateNext(e.target.checked)}
                  className="rounded text-[#2d6a4f] focus:ring-[#52b788]"
                />
                <span>Tự động khởi tạo học kỳ tiếp theo</span>
              </label>

              {autoCreateNext && (
                <div>
                  <label className="text-[11px] font-medium text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Tên học kỳ tiếp theo
                  </label>
                  <input
                    type="text"
                    value={nextSemesterTitle}
                    onChange={(e) => setNextSemesterTitle(e.target.value)}
                    placeholder="Ví dụ: Học kỳ 2"
                    className="w-full px-3 py-2 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-xs focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowTransitionModal(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleTransitionSemester}
                className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
              >
                Xác nhận kết chuyển
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cấu hình mục tiêu chương trình đào tạo */}
      {showEditDegreeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-[#142318] rounded-3xl max-w-md w-full p-6 border border-[#dbe7dd] dark:border-[#263d2e] shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-[#192e22] dark:text-[#f0f7f2]">
              Cấu hình mục tiêu 4 năm đại học
            </h3>

            <form onSubmit={handleSaveDegree} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Chuyên ngành đào tạo
                </label>
                <input
                  type="text"
                  value={editMajor}
                  onChange={(e) => setEditMajor(e.target.value)}
                  placeholder="Công nghệ Thông tin"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                  Trường đại học
                </label>
                <input
                  type="text"
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                  placeholder="Đại học Bách Khoa"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Tổng tín chỉ yêu cầu
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={250}
                    value={editTargetCredits}
                    onChange={(e) => setEditTargetCredits(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#526b5c] dark:text-[#a3bda9] block mb-1">
                    Mục tiêu GPA (Hệ 4)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min={2.0}
                    max={4.0}
                    value={editTargetGpa}
                    onChange={(e) => setEditTargetGpa(parseFloat(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#dbe7dd] dark:border-[#263d2e] bg-white dark:bg-[#18281d] text-sm focus:outline-none focus:ring-2 focus:ring-[#52b788]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditDegreeModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-[#526b5c] hover:bg-gray-100 dark:hover:bg-[#1e3425] transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2d6a4f] text-white text-sm font-semibold hover:bg-[#1b4332] transition-colors"
                >
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Syllabus Importer AI Modal */}
      <SyllabusImporterModal
        open={showSyllabusModal}
        onClose={() => setShowSyllabusModal(false)}
        onSuccess={fetchAcademicData}
        semesterId={selectedSemesterId}
      />
    </div>
  );
}
